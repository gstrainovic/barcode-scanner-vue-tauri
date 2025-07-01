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

pub fn download_env_file() -> std::io::Result<()> {
    let url = "https://raw.githubusercontent.com/gstrainovic/barcode-scanner-vue-tauri/refs/heads/main/.env";
    let response = reqwest::blocking::get(url)
        .expect("Failed to download .env file");
    let content = response.text().expect("Failed to read response text");
    fs::write(".env", content)?;
    Ok(())
}

impl Config {
    pub fn from_env() -> Self {
        if !std::path::Path::new(".env").exists() {
            download_env_file()
                .expect("Failed to download or write .env file");
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