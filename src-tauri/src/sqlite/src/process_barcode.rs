use crate::{
    create_history, is_barcode_duplicate_sqlite
};
use notify_rust::Notification;
use req::{
    check_duplicate_barcode::is_barcode_duplicate,
};

use serde::{Deserialize, Serialize};

static mut ERROR_STATUS: super::errors::Status = super::errors::Status::Ok;

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

    let prefix_warn_icon = if status.message.starts_with("@C88") {
        "❗"
    } else if status.message.starts_with("@C03") {
        "⚠️"
    } else {
        "✅"
    };

    let new_status_message = status
        .message
        .replace("@C88", "")
        .replace("@C03", "")
        .replace("@C00", "");

    // app.notification()
    //         .builder()
    //         .title(config.dialog.title)
    //         .body(&format!("{} {} ist {}", prefix_warn_icon, barcode_c, new_status_message))
    //         .show()
    //         .unwrap();

        Notification::new()
        .summary(&format!("{} {} ist {}", prefix_warn_icon, barcode_c, new_status_message))
        .show()
        .unwrap();

}


#[allow(non_snake_case)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Einstellungen {
    pub Barcode_Mindestlaenge: i32,
    pub Leitcodes_Aktiv: bool,
    pub Ausnahmen_Aktiv: bool,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct Ausnahmen {
    pub Barcode: String,
    pub Bedeutung: String,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct LeitcodeBuchstabe {
    pub Buchstabe: String,
    pub Position_Null_Beginnend: i32,
}

#[derive(Deserialize, Debug)]
pub struct IdAtrBuchstaben {
    pub id: i16,
    pub attributes: LeitcodeBuchstabe,
}

#[derive(Deserialize, Debug)]
pub struct DataBuchstaben {
    pub data: Vec<IdAtrBuchstaben>,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct Leitcode {
    pub Beschreibung: String,
    pub Mindeslaenge: i32,
    pub Leitcode_Buchstabe: DataBuchstaben,
    pub Produktion: bool,
}

pub fn process_barcode(
    barcode_new: &str,
    user_id: i32,
    jwt: String,
    lager_user_ids: &Vec<i32>,
    rolle: &str,
    settings: Einstellungen,
    ausnahmen: Vec<Ausnahmen>,
    leitcodes: Vec<Leitcode>,
) -> super::errors::Error {
    let offline = jwt.is_empty();

    if settings.Ausnahmen_Aktiv {
        // if barcode ends with a string from barcode_ausnahmen, then send it directly to server
        for barcode_ausnahme in ausnahmen {
            if barcode_new.ends_with(barcode_ausnahme.Barcode.to_lowercase().as_str()) {
                let cleaned_barcode = clean_barcode(&barcode_new);
                let bedeutung = barcode_ausnahme.Bedeutung.clone();
                super::send_barcode::send_barcode(
                    cleaned_barcode.clone(),
                    user_id,
                    &jwt,
                    &lager_user_ids,
                );
                history_add(
                    super::errors::ausnahme(bedeutung.clone()),
                    &cleaned_barcode,
                    user_id,
                    offline,
                    lager_user_ids,
                );
                let status_response = super::errors::ausnahme(bedeutung);
                return status_response;
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
        let status_response = super::errors::zu_kurz();
        return status_response;
    }

    if settings.Leitcodes_Aktiv {
        // block DHL Leitcode like

        for leitcode in leitcodes {
            // Leitcodes welche nicht dem aktuellem Arbeitsplatz zugeordnet sind, werden ignoriert
            if leitcode.Produktion && rolle != "Produktion" {
                continue;
            }

            if barcode_new.len() > leitcode.Mindeslaenge as usize {
                let beschreibung = leitcode.Beschreibung;
                let data_buchstaben: Vec<IdAtrBuchstaben> = leitcode.Leitcode_Buchstabe.data;
                let anzahl_buchstaben = data_buchstaben.len();
                let mut gefunden = 0;
                for buchstabe_atr_id in data_buchstaben {
                    let buchstabe_attr: LeitcodeBuchstabe = buchstabe_atr_id.attributes;
                    let position: usize = buchstabe_attr.Position_Null_Beginnend as usize;
                    if barcode_new.len() > position {
                        let barcode_buchstabe = barcode_new.chars().nth(position).unwrap();
                        if buchstabe_attr.Buchstabe == barcode_buchstabe.to_string() {
                            gefunden += 1;
                        }
                    }
                }
                
                if gefunden == anzahl_buchstaben {
                    history_add(
                        super::errors::leitcode(beschreibung.clone()),
                        &barcode_new,
                        user_id,
                        offline,
                        lager_user_ids,
                    );
                    let status_response = super::errors::leitcode(beschreibung);
                    return status_response;
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

    // println!("is_barcode_duplicate_bool: {:?}", is_barcode_duplicate_bool);

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
        let status_response = super::errors::ok();
        return status_response;
    } else {
        history_add(
            super::errors::bereits_gesendet(),
            &barcode_new,
            user_id,
            offline,
            lager_user_ids,
        );
        let status_response = super::errors::bereits_gesendet();
        return status_response;
    }
}
