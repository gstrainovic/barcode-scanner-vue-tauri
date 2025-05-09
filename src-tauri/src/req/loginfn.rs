use serde::Deserialize;
use serde_json::{Map, Value};

#[derive(Deserialize, Debug)]
pub struct User {
    pub username: String,
    pub id: i32,
    pub rolle: String,
}

#[derive(Deserialize, Debug)]
pub struct JWT {
    pub jwt: Option<String>,
    pub error: Option<Map<String, Value>>,
    pub user: Option<User>,
}

