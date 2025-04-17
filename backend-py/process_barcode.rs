pub fn process_barcode(
    i: &mut input::Input,
    user_id: i32,
    jwt: String,
    lager_user_ids: &Vec<i32>,
    history: fltk::browser::HoldBrowser,
) {
    i.activate();
    let mut barcode_new = i.value();
    i.set_value("");

    // remove from barcode all characters that are not alphanumeric and make it lowercase
    barcode_new = barcode_new
        .chars()
        .filter(|c| c.is_alphanumeric())
        .collect::<String>()
        .to_lowercase();

    let offline = jwt.is_empty();

    let settings = if offline {
        get_settings_sqlite()
    } else {
        get_settings(&jwt).unwrap().data.attributes
    };

    if settings.Ausnahmen_Aktiv {
        let ausnahmen = if offline {
            get_ausnahmen_sqlite()
        } else {
            get_ausnahmen(&jwt).unwrap()
        };

        // if barcode ends with a string from barcode_ausnahmen, then send it directly to server
        for barcode_ausnahme in ausnahmen {
            if barcode_new.ends_with(barcode_ausnahme.Barcode.to_lowercase().as_str()) {
                send_barcode(barcode_new.clone(), user_id, &jwt, &lager_user_ids);
                history_add(
                    errors::ausnahme(barcode_ausnahme.Bedeutung),
                    &barcode_new,
                    history,
                    user_id,
                    offline,
                    lager_user_ids,
                );
                return;
            }
        }
    }

    if barcode_new.len() < settings.Barcode_Mindestlaenge as usize {
        Notification::new()
            .summary(&format!(
                "Barcode Scanner: {} ist zu kurz, nicht gesendet",
                barcode_new
            ))
            .show()
            .unwrap();
        history_add(
            errors::zu_kurz(),
            &barcode_new,
            history,
            user_id,
            offline,
            lager_user_ids,
        );
        return;
    }

    if settings.Leitcodes_Aktiv {
        let leitcodes = if jwt.is_empty() {
            get_leitcodes_sql()
        } else {
            update_leitcodes(get_leitcodes(&jwt).unwrap());
            get_leitcodes(&jwt).unwrap().data
        };

        for idatr in leitcodes {
            let attribute: Leitcode = idatr.attributes;
            if barcode_new.len() > attribute.Mindeslaenge as usize {
                let beschreibung = attribute.Beschreibung;
                let data_buchstaben: Vec<IdAtrBuchstaben> = attribute.Leitcode_Buchstabe.data;
                for buchstabe_atr_id in data_buchstaben {
                    let buchstabe_attr: LeitcodeBuchstabe = buchstabe_atr_id.attributes;
                    let position: usize = buchstabe_attr.Position_Null_Beginnend as usize;

                    // does the barcode match witch buchstabe at position?
                    if barcode_new.len() > position {
                        let barcode_buchstabe = barcode_new.chars().nth(position).unwrap();
                        if buchstabe_attr.Buchstabe == barcode_buchstabe.to_string() {
                            Notification::new()
                                .summary(&format!(
                                    "Barcode Scanner: {} als {} erkannt, nicht gesendet",
                                    barcode_new, beschreibung
                                ))
                                .show()
                                .unwrap();
                            history_add(
                                errors::leitcode(beschreibung),
                                &barcode_new,
                                history,
                                user_id,
                                offline,
                                lager_user_ids,
                            );
                            return;
                        }
                    }
                }
            }
        }
    }

    let is_barcode_duplicate_bool = if offline {
        is_barcode_duplicate_sqlite(&barcode_new)
    } else {
        is_barcode_duplicate(&jwt, &barcode_new, &user_id).unwrap()
    };

    if !is_barcode_duplicate_bool {
        send_barcode(barcode_new.clone(), user_id, &jwt, lager_user_ids);

        // does the barcode contain a number?
        let mut contains_number = false;
        for c in barcode_new.chars() {
            if c.is_numeric() {
                contains_number = true;
                break;
            }
        }

        let err = if contains_number {
            errors::ok()
        } else {
            errors::no_numbers()
        };

        history_add(err, &barcode_new, history, user_id, offline, lager_user_ids);
    } else {
        Notification::new()
            .summary(&format!(
                "Barcode Scanner: {} wurde bereits gesendet",
                barcode_new
            ))
            .show()
            .unwrap();

        history_add(
            errors::bereits_gesendet(),
            &barcode_new,
            history,
            user_id,
            offline,
            lager_user_ids,
        );
        return;
    }
}
