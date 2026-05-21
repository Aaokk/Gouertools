use std::path::Path;

use base64::{engine::general_purpose::STANDARD, Engine};
use futures_util::StreamExt;
use reqwest::header::{ACCEPT, REFERER, USER_AGENT};
use tauri::Emitter;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

fn bytes_from_data_url(data_url: &str) -> Result<Vec<u8>, String> {
  let comma = data_url
    .find(',')
    .ok_or_else(|| "invalid data URL: missing comma".to_string())?;
  let prelude = &data_url[..comma];
  if !prelude.contains("base64") {
    return Err("only base64 data URLs are supported".into());
  }
  let b64 = data_url[comma + 1..].trim();
  STANDARD.decode(b64).map_err(|e| e.to_string())
}

#[tauri::command]
fn desktop_save_image(path: String, data_url: String) -> Result<(), String> {
  let bytes = bytes_from_data_url(&data_url)?;
  std::fs::write(Path::new(&path), bytes).map_err(|e| e.to_string())
}

/// 仅允许配置的域名，缓解误用 SSRF（由前端传入固定常量 URL）
fn allowed_update_fetch_url(url: &str) -> bool {
  let u = url.trim();
  u.starts_with("https://gouer.vip/")
    || u.starts_with("https://up.gouer.vip/")
    || u.starts_with("https://tapi.ge0.cc/")
}

/// 安装包直链仅允许这两类域名（与前端 openUrl 白名单一致）
fn allowed_asset_download_url(url: &str) -> bool {
  let u = url.trim();
  u.starts_with("https://gouer.vip/")
    || u.starts_with("https://up.gouer.vip/")
}

fn installer_ext_ok(name: &str) -> bool {
  let lower = name.to_ascii_lowercase();
  lower.ends_with(".dmg")
    || lower.ends_with(".pkg")
    || lower.ends_with(".zip")
    || lower.ends_with(".exe")
    || lower.ends_with(".msi")
}

fn sanitize_filename(name: &str) -> Option<String> {
  let t = name.trim();
  if t.is_empty() || t.contains("..") || t.contains('/') || t.contains('\\') {
    return None;
  }
  let s: String = t
    .chars()
    .filter(|c| {
      c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_' | '(' | ')' | ' ' | '（' | '）')
    })
    .collect();
  if s.is_empty() || s.len() > 200 {
    return None;
  }
  installer_ext_ok(&s).then_some(s)
}

fn pick_filename(url: &str, filename_hint: Option<String>) -> Result<String, String> {
  if let Some(h) = filename_hint {
    if let Some(s) = sanitize_filename(&h) {
      return Ok(s);
    }
  }
  let path_part = url.split('?').next().unwrap_or(url);
  let seg = path_part.rsplit('/').next().filter(|s| !s.is_empty());
  let seg = seg.ok_or_else(|| "URL 中无文件名".to_string())?;
  sanitize_filename(seg).ok_or_else(|| "无法从 URL 得到合法安装包文件名".to_string())
}

#[derive(Clone, serde::Serialize)]
struct DownloadUpdateProgressEvent {
  received: u64,
  total: Option<u64>,
}

#[tauri::command]
async fn fetch_update_manifest(url: String) -> Result<String, String> {
  let url = url.trim().to_string();
  if !allowed_update_fetch_url(&url) {
    return Err("update url not allowed".into());
  }
  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(15))
    .build()
    .map_err(|e| e.to_string())?;
  let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
  if !resp.status().is_success() {
    return Err(format!("HTTP {}", resp.status()));
  }
  resp.text().await.map_err(|e| e.to_string())
}

/// 流式下载安装包到系统临时目录，通过事件 `download_update_progress` 推送进度；返回本地绝对路径。
#[tauri::command]
async fn download_update_asset(
  app: tauri::AppHandle,
  url: String,
  filename_hint: Option<String>,
) -> Result<String, String> {
  let url = url.trim().to_string();
  if !allowed_asset_download_url(&url) {
    return Err("download url not allowed".into());
  }

  let fname = pick_filename(&url, filename_hint)?;
  let ts = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_millis())
    .unwrap_or(0);
  let dest = std::env::temp_dir().join(format!("gouer-tools-update-{ts}-{fname}"));

  /// CDN/防盗链常拦截 `reqwest/x.x` 默认 UA，误判为爬虫返回 403；与常见浏览器行为对齐。
  const DOWNLOAD_UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(3600))
    .redirect(reqwest::redirect::Policy::limited(16))
    .build()
    .map_err(|e| e.to_string())?;

  let parsed = url::Url::parse(&url).map_err(|e| format!("invalid URL: {e}"))?;

  let mut req = client
    .get(parsed.clone())
    .header(USER_AGENT, DOWNLOAD_UA)
    .header(ACCEPT, "*/*");

  if matches!(
    parsed.host_str(),
    Some("up.gouer.vip") | Some("gouer.vip")
  ) {
    req = req.header(REFERER, "https://gouer.vip/");
  }

  let resp = req.send().await.map_err(|e| e.to_string())?;
  if !resp.status().is_success() {
    return Err(format!("下载失败 HTTP {}", resp.status()));
  }

  if let Some(ct) = resp.headers().get(reqwest::header::CONTENT_TYPE) {
    let s = ct.to_str().unwrap_or("").to_ascii_lowercase();
    if s.contains("text/html") {
      return Err("服务器返回了网页而非安装包，请检查上架直链".into());
    }
  }

  let total: Option<u64> = resp
    .headers()
    .get(reqwest::header::CONTENT_LENGTH)
    .and_then(|v| v.to_str().ok())
    .and_then(|s| s.parse().ok());

  const MAX_BYTES: u64 = 800 * 1024 * 1024;
  if let Some(t) = total {
    if t > MAX_BYTES {
      return Err("安装包体积超过限制".into());
    }
  }

  let mut stream = resp.bytes_stream();
  let mut file = File::create(&dest).await.map_err(|e| e.to_string())?;
  let mut received: u64 = 0;
  let mut last_emit = std::time::Instant::now();
  let emit_gap = std::time::Duration::from_millis(150);

  while let Some(chunk) = stream.next().await {
    let chunk = chunk.map_err(|e| e.to_string())?;
    let n = chunk.len() as u64;
    received += n;
    if received > MAX_BYTES {
      drop(file);
      let _ = std::fs::remove_file(&dest);
      return Err("下载超过体积上限，已中止".into());
    }
    file
      .write_all(&chunk)
      .await
      .map_err(|e| e.to_string())?;

    if last_emit.elapsed() >= emit_gap {
      let _ = app.emit(
        "download_update_progress",
        DownloadUpdateProgressEvent {
          received,
          total,
        },
      );
      last_emit = std::time::Instant::now();
    }
  }

  file.flush().await.map_err(|e| e.to_string())?;
  drop(file);

  let _ = app.emit(
    "download_update_progress",
    DownloadUpdateProgressEvent {
      received,
      total: Some(received),
    },
  );

  dest
    .to_str()
    .map(|s| s.to_string())
    .ok_or_else(|| "路径无效".into())
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
  app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_os::init())
    .invoke_handler(tauri::generate_handler![
      desktop_save_image,
      fetch_update_manifest,
      download_update_asset,
      quit_app
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
