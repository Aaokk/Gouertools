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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![desktop_save_image])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
