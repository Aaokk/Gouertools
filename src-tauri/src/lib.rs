use std::path::Path;

use base64::{engine::general_purpose::STANDARD, Engine};

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
  u.starts_with("https://tools.gouer.vip/")
    || u.starts_with("https://up.gouer.vip/")
    || u.starts_with("https://tapi.ge0.cc/")
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_os::init())
    .invoke_handler(tauri::generate_handler![desktop_save_image, fetch_update_manifest])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
