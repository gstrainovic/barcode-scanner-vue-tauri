use crate::config::Config;
use crate::loginfn::User;

#[tokio::main]
pub async fn get_users(jwt: String) -> Result<Vec<User>, reqwest::Error> {
    let config = Config::new();
    let url = format!("{}{}", config.api.strapi, "/api/users");

    let client = reqwest::Client::new();

    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", jwt))
        .send()
        .await?
        .json::<Vec<User>>()
        .await?;

    return Ok(res);
}