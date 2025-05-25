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