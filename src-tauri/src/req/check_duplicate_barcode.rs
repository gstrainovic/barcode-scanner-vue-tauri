use serde::Deserialize;
use config::STRAPI_URL;

#[derive(Deserialize, Debug)]
pub struct Response {
    pub data: Vec<Data>,
}

#[derive(Deserialize, Debug)]
pub struct Data {
    pub id: i32,
    pub attributes: Attributes,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct Attributes {
    pub createdAt: String,
}

#[tokio::main]
pub async fn is_barcode_duplicate(jwt: &str, barcode: &str, user_id: &i32) -> Result<bool, reqwest::Error> {
    let url = format!("{}/api/barcodes?filters[barcode][$eq]={}&filters[users_permissions_user][id][$eq]={}&sort=createdAt:DESC", STRAPI_URL, barcode, user_id);
    let client = reqwest::Client::new();

    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", jwt))
        .send()
        .await?
        .json::<Response>()
        .await?;
    
    // println!("is_barcode_duplicate: res: {:?}", res);

    if res.data.len() > 0 {
        return Ok(true);

    } else {
        return Ok(false);
    }
}