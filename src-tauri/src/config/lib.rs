use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiConfig {
    pub strapi: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DialogConfig {
    pub title: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub api: ApiConfig,
    pub version: String,
    pub dialog: DialogConfig,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfigAsJson {
    pub api: ApiConfig,
    pub version: String,
    pub dialog: DialogConfig,
}

pub fn get_config_as_json() -> ConfigAsJson {
    let config = cfg();
    ConfigAsJson {
        api: config.api,
        version: config.version,
        dialog: config.dialog,
    }
}

pub fn cfg() -> Config {
    Config {
        api: ApiConfig {
            strapi: "https://gz-strapi.strainovic-it.ch".to_string(),
        },
        version: "2.0.14".to_string(),
        dialog: DialogConfig {
            title: "BarcodeScannerV2-Dialog".to_string(),
        },
    }
}