use serde::Deserialize;
use crate::config::Config;

#[derive(Deserialize, Debug)]
pub struct AusnahmenData {
    pub data: Vec<IdAtrAusnahmen>,
}

#[derive(Deserialize, Debug)]
pub struct IdAtrAusnahmen {
    pub id: i16,
    pub attributes: Ausnahmen,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct Ausnahmen {
    pub Barcode: String,
    pub Bedeutung: String,
}

// get all exceptions from the database
#[tokio::main]
pub async fn get_ausnahmen(jwt: &str) -> Result<Vec<Ausnahmen>, reqwest::Error> {
    let config = Config::new();
    let url = format!("{}/api/ausnahmen", config.api.strapi);
    let client = reqwest::Client::new();

    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", jwt))
        .send()
        .await?
        .json::<AusnahmenData>()
        .await?;

    let mut ausnahmen = Vec::new();

    for ausnahme in res.data {
        ausnahmen.push(ausnahme.attributes);
    }

    Ok(ausnahmen)
}