// @generated automatically by Diesel CLI.

diesel::table! {
    history (id) {
        id -> Integer,
        status -> Text,
        barcode -> Text,
        timestamp -> Text,
        synced -> Bool,
        user_id -> Integer,
        offline -> Bool,
        lager_user_ids -> Text,
    }
}
