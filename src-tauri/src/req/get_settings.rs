use crate::config::Config;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct EinstellungenData {
    pub data: IdAtr,
}

#[derive(Deserialize, Debug)]
pub struct IdAtr {
    pub id: i16,
    pub attributes: Einstellungen,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct Einstellungen {
    pub Barcode_Mindestlaenge: i32,
    pub Leitcodes_Aktiv: bool,
    pub Ausnahmen_Aktiv: bool,
}

// get all exceptions from the database
#[tokio::main]
pub async fn get_settings(jwt: &str) -> Result<EinstellungenData, reqwest::Error> {
    let config = Config::new();
    let url = format!("{}/api/einstellung", config.api.strapi);
    let client = reqwest::Client::new();

    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", jwt))
        .send()
        .await?
        .json::<EinstellungenData>()
        .await?;

    Ok(res)
}
