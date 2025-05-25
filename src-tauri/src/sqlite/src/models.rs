use diesel::prelude::*;
use super::schema::history;

// #[derive(Queryable, Selectable)]
// #[diesel(table_name = crate::schema::history)]
// #[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[derive(Queryable, serde::Serialize)]
pub struct History {
    pub id: i32,
    pub status: String,
    pub barcode: String,
    pub timestamp: String,
    pub synced: bool,
    pub user_id: i32,
    pub offline: bool,
    pub lager_user_ids: String,
}

#[derive(Insertable)]
#[diesel(table_name = history)]
#[derive(Debug)]
pub struct NewHistory<'a> {
    pub status: &'a str,
    pub barcode: &'a str,
    pub timestamp: &'a str,
    pub synced: &'a bool,
    pub user_id: &'a i32,
    pub offline: bool,
    pub lager_user_ids: &'a str,
}


