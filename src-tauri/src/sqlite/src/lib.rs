pub mod models;
pub mod schema;
pub mod process_barcode;
pub mod errors;
pub mod send_barcode;

use diesel::prelude::*;
use std::{fs, error::Error};
use crate::models::{NewHistory, History};

use schema::history::{self};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

const HISTORY_LIMIT: i64 = 10000;

fn run_migrations<DB: diesel::backend::Backend>(connection: &mut impl MigrationHarness<DB>) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
    // This will run the necessary migrations.
    //
    // See the documentation for `MigrationHarness` for
    // all available methods.
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

pub fn establish_connection() -> SqliteConnection {
    let path = std::path::Path::new("./db.sqlite");

    if !path.exists() {
        fs::File::create(path).expect("Unable to create file");
    }

    let mut conn = SqliteConnection::establish( path.to_str().unwrap() )
        .unwrap_or_else(|_| panic!("Error connecting to {}", path.to_str().unwrap()));

    run_migrations(&mut conn).unwrap();

    conn
}

pub fn create_history<'a>(status: &'a str, barcode: &'a str, nuser_id: &'a i32, offline: bool, lager_user_ids: &Vec<i32>)  {
    let conn = &mut establish_connection();
    let lager_user_ids_string = lager_user_ids.into_iter().map(|id| id.to_string()).collect::<Vec<String>>().join(",");
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let new_history = NewHistory {
        status,
        barcode,
        timestamp: timestamp.as_str(),
        synced: &false,
        user_id: nuser_id,
        offline: offline,
        lager_user_ids: &lager_user_ids_string,
    };
    let _ = diesel::insert_into(history::table)
        .values(&new_history)
        .execute(conn);
}

pub fn is_barcode_duplicate_sqlite(barcode_string: &str) -> bool {
    use schema::history::dsl::*;

    let conn = &mut establish_connection();

    let history_rec = history
        .filter(barcode.eq(barcode_string)) // change this line
        .first::<History>(conn)
        .optional()
        .expect("Error loading history");

    if history_rec.is_some() {
        true
    } else {
        false
    }
}

// function to reduce the history table to the last 200 entries
pub fn reduce_history() {
    use schema::history::dsl::*;

    let conn = &mut establish_connection();

    let history_count = history.count().get_result::<i64>(conn).unwrap();

    if history_count > HISTORY_LIMIT {
        // Find the threshold id to delete all older entries
        let threshold_id_opt = history
            .select(id)
            .order(id.desc())
            .offset(HISTORY_LIMIT - 1)
            .first::<i32>(conn)
            .optional()
            .expect("Error finding threshold id for history deletion");

        if let Some(threshold_id) = threshold_id_opt {
            let deleted_rows = diesel::delete(history.filter(id.lt(threshold_id)))
                .execute(conn)
                .expect("Error deleting old history");

            println!("Deleted {} rows from history", deleted_rows);
        }
    }
}


pub fn get_history() -> Result<serde_json::Value, String> {
    let conn = &mut establish_connection();

    let history_records = history::table
        .order(history::timestamp.desc())
        .limit(HISTORY_LIMIT)
        .load::<History>(conn)
        .unwrap_or_else(|error| {
            eprintln!("Error loading history: {}", error);
            panic!("Failed to load history");
        })
        .into_iter()
        .map(|mut entry| {
            entry.timestamp = entry.timestamp.to_string(); // convert to string
            entry
        })
        .collect::<Vec<History>>();

    serde_json::to_value(history_records).map_err(|e| e.to_string())
}


pub fn update_history(idi: i32) {
    use schema::history::dsl::*;

    let conn = &mut establish_connection();

    diesel::update(history.find(idi))
        .set(synced.eq(true))
        .execute(conn)
        .unwrap();
}

pub fn get_sync_history() -> Vec<History> {
    let conn = &mut establish_connection();

    let history_rec = history::table
        .filter(history::synced.eq(false))
        .filter(history::offline.eq(true))
        .filter(history::status.eq("OK"))
        .load::<History>(conn)
        .expect("Error loading history");

    history_rec
}
