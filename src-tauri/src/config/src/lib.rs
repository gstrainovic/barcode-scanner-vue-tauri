use std::fs;
use serde::Deserialize;

#[derive(Deserialize)]
struct TauriConfig {
    version: String, // Direktes Feld für die Version
}

pub fn get_version() -> String {
    let config_path = "../src-tauri/tauri.conf.json"; // Pfad zur tauri.conf.json
    let config_content = fs::read_to_string(config_path)
        .expect("tauri.conf.json konnte nicht gelesen werden");
    let config: TauriConfig = serde_json::from_str(&config_content)
        .expect("tauri.conf.json konnte nicht geparst werden");
    config.version
}

pub const STRAPI_URL: &str = "https://gz-strapi.strainovic-it.ch";
pub const DIALOG_TITLE: &str = "BarcodeScanner Dialog";