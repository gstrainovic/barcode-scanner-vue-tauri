use req::{
    check_duplicate_barcode::is_barcode_duplicate, get_ausnahmen::get_ausnahmen,
    get_leitcodes::get_leitcodes, get_leitcodes::IdAtrBuchstaben, get_leitcodes::Leitcode,
    get_leitcodes::LeitcodeBuchstabe, get_settings::get_settings,
};
use crate::{
    create_history, get_ausnahmen as get_ausnahmen_sqlite, get_leitcodes_sql,
    get_settings as get_settings_sqlite, update_leitcodes, is_barcode_duplicate_sqlite
};

static mut ERROR_STATUS : super::errors::Status = super::errors::Status::Ok;

pub fn clean_barcode(barcode: &str) -> String {
    barcode
        .chars()
        .filter(|c| c.is_alphanumeric())
        .collect::<String>()
        .to_lowercase()
}

pub fn history_add(
    status: super::errors::Error,
    barcode_c: &str,
    nuser_id: i32,
    offline: bool,
    lager_user_ids: &Vec<i32>,
) {
    unsafe { ERROR_STATUS = status.status };

    create_history(
        &status.message,
        &barcode_c,
        &nuser_id,
        offline,
        lager_user_ids,
    );
}

pub fn process_barcode(
    barcode_new: &str,
    user_id: i32,
    jwt: String,
    lager_user_ids: &Vec<i32>,
    rolle: &str,
) {

    let offline = jwt.is_empty();

    let settings = if offline {
        get_settings_sqlite()
    } else {
        get_settings(&jwt).unwrap().data.attributes
    };

    // println!("settings: {:?}", settings);

    if settings.Ausnahmen_Aktiv {
        let ausnahmen = if offline {
            get_ausnahmen_sqlite()
        } else {
            get_ausnahmen(&jwt).unwrap()
        };

        // if barcode ends with a string from barcode_ausnahmen, then send it directly to server
        for barcode_ausnahme in ausnahmen {
            if barcode_new.ends_with(barcode_ausnahme.Barcode.to_lowercase().as_str()) {
                let cleaned_barcode = clean_barcode(&barcode_new);
                super::send_barcode::send_barcode(cleaned_barcode.clone(), user_id, &jwt, &lager_user_ids);
                history_add(
                    super::errors::ausnahme(barcode_ausnahme.Bedeutung),
                    &cleaned_barcode,
                    user_id,
                    offline,
                    lager_user_ids,
                );
                return;
            }
        }
    }

    if barcode_new.len() < settings.Barcode_Mindestlaenge as usize {
        history_add(
            super::errors::zu_kurz(),
            &barcode_new,
            user_id,
            offline,
            lager_user_ids,
        );
        return;
    }

    if settings.Leitcodes_Aktiv {
        // block DHL Leitcode like
        // ¨C140327619348`99000900190051
        // ¨C140327628203`99000900033018

        // ¨C140327647661`99000900000000
        
        // 0327642113+99..


        let leitcodes = if jwt.is_empty() {
            get_leitcodes_sql()
        } else {
            update_leitcodes(get_leitcodes(&jwt).unwrap());
            get_leitcodes(&jwt).unwrap().data
        };
        // if jwt.is_empty() {
        //     leitcodes = get_leitcodes_sql();
        // } else {
        //     leitcodes = get_leitcodes(&jwt).unwrap().data;
        // }
        for idatr in leitcodes {
            let attribute: Leitcode = idatr.attributes;

            // Leitcodes welche nicht dem aktuellem Arbeitsplatz zugeordnet sind, werden ignoriert
            if attribute.Produktion && rolle != "Produktion" {
                continue;
            }
            
            if barcode_new.len() > attribute.Mindeslaenge as usize {
                let beschreibung = attribute.Beschreibung;
                let data_buchstaben: Vec<IdAtrBuchstaben> = attribute.Leitcode_Buchstabe.data;
                let anzahl_buchstaben = data_buchstaben.len();
                let mut gefunden = 0;
                for buchstabe_atr_id in data_buchstaben {
                    let buchstabe_attr: LeitcodeBuchstabe = buchstabe_atr_id.attributes;
                    let position: usize = buchstabe_attr.Position_Null_Beginnend as usize;
                    // does the barcode match witch buchstabe at position?
                    if barcode_new.len() > position {
                        let barcode_buchstabe = barcode_new.chars().nth(position).unwrap();
                        if buchstabe_attr.Buchstabe == barcode_buchstabe.to_string() {
                            gefunden += 1;
                        }
                    }
                }

                if gefunden == anzahl_buchstaben {
                    history_add(
                        super::errors::leitcode(beschreibung),
                        &barcode_new,
                        user_id,
                        offline,
                        lager_user_ids,
                    );
                    return;
                }

                // for buchstabe_atr_id in data_buchstaben {
                //     let buchstabe_attr: LeitcodeBuchstabe = buchstabe_atr_id.attributes;
                //     let position: usize = buchstabe_attr.Position_Null_Beginnend as usize;

                //     // does the barcode match witch buchstabe at position?
                //     println!("barcode_lower{:?}", barcode_new);
                //     if barcode_new.len() > position {
                //         let barcode_buchstabe = barcode_new.chars().nth(position).unwrap();
                //         println!("barcode_buchstabe{:?}", barcode_buchstabe);
                //         if buchstabe_attr.Buchstabe == barcode_buchstabe.to_string() {
                //             Notification::new()
                //                 .summary(&format!(
                //                     "Barcode Scanner: {} als {} erkannt, nicht gesendet",
                //                     barcode_new, beschreibung
                //                 ))
                //                 .show()
                //                 .unwrap();
                //             history_add(
                //                 errors::leitcode(beschreibung),
                //                 &barcode_new,
                //                 history,
                //                 user_id,
                //                 offline,
                //                 lager_user_ids,
                //             );
                //             return;
                //         }
                //     }
                // }
            }
        }
    }


    let cleaned_barcode = clean_barcode(&barcode_new);
    
    let is_barcode_duplicate_bool = if offline {
        is_barcode_duplicate_sqlite(&cleaned_barcode)
    } else {
        is_barcode_duplicate(&jwt, &cleaned_barcode, &user_id).unwrap()
    };

    println!("is_barcode_duplicate_bool: {:?}", is_barcode_duplicate_bool);

    if !is_barcode_duplicate_bool {
        super::send_barcode::send_barcode(cleaned_barcode.clone(), user_id, &jwt, lager_user_ids);

        // does the barcode contain a number?
        let mut contains_number = false;
        for c in barcode_new.chars() {
            if c.is_numeric() {
                contains_number = true;
                break;
            }
        }

        let err = if contains_number {
            super::errors::ok()
        } else {
           super::errors::no_numbers()
        };

        history_add(err, &barcode_new, user_id, offline, lager_user_ids);
    } else {
        history_add(
            super::errors::bereits_gesendet(),
            &barcode_new,
            user_id,
            offline,
            lager_user_ids,
        );
    }
}
