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
        Self {
            api: ApiConfig {
                strapi: std::env::var("STRAPI_URL").expect("STRAPI_URL not set") + "/api/",
            },
            version: std::env::var("VERSION").expect("VERSION not set"),
            dialog: DialogConfig {
                title: std::env::var("DIALOG_TITLE").expect("DIALOG_TITLE not set"),
            },
        }
    }
}