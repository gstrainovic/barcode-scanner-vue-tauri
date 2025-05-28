use std::fs;

pub struct ApiConfig {
    pub strapi: String,
}

pub struct DialogConfig {
    pub title: String,
}

pub struct Config {
    pub api: ApiConfig,
    pub version: String,
    pub dialog: DialogConfig,
}

impl Config {
    pub fn from_env() -> Self {
        // Prüfe ob .env Datei existiert,
        // falls nein, lade es herunter von https://raw.githubusercontent.com/gstrainovic/barcode-scanner-vue-tauri/refs/heads/main/.env
        // und speichere es im aktuellen Verzeichnis.
        if !std::path::Path::new(".env").exists() {
            let url = "https://raw.githubusercontent.com/gstrainovic/barcode-scanner-vue-tauri/refs/heads/main/.env";
            let response = reqwest::blocking::get(url)
                .expect("Failed to download .env file");
            let content = response.text().expect("Failed to read response text");
            fs::write(".env", content).expect("Failed to write .env file");
        }

        dotenv::dotenv().ok();

        Self {
            api: ApiConfig {
                strapi: std::env::var("VITE_STRAPI_URL").expect("VITE_STRAPI_URL not set"),
            },
            version: std::env::var("VITE_VERSION").expect("VITE_VERSION not set"),
            dialog: DialogConfig {
                title: std::env::var("VITE_DIALOG_TITLE").expect("VITE_DIALOG_TITLE not set"),
            },
        }
    }
}