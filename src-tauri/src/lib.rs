// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// use std::sync::Arc;
use scanner::{RawInputManager, DeviceType};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
struct SerializableDevice {
    name: String,
    // id: u32,
}

#[tauri::command]
fn get_devices() -> Arc<Vec<SerializableDevice>> {
    let mut manager = RawInputManager::new().unwrap();
    manager.register_devices(DeviceType::Keyboards);
    let devices = manager.get_device_list();
    let keyboardsl = Arc::new(
        devices
            .keyboards
            .iter()
            .map(|device| SerializableDevice {
                name: device.name.clone(),
                // id: device.id,
            })
            .collect::<Vec<SerializableDevice>>(),
    );

    keyboardsl
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
