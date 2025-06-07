use req::write_barcode::write_barcode;

pub fn send_barcode(barcode: String, user: i32, jwt: &str, lager_user_ids: &Vec<i32>) {
    if jwt.is_empty() {
        // Notification::new()
        // .summary(&format!("Barcode Scanner: {} lokal gespeichert", barcode_c))
        // .show()
        // .unwrap();
        // return;
    }

    match write_barcode(barcode, user, jwt, &lager_user_ids, false) {
        Ok(_) => {
        }
        Err(e) => {
            eprintln!("Fehler beim Senden des Barcodes: {}", e);
        }
    }
}