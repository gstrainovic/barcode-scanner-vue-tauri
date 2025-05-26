export interface User {
    username: string;
    id: number;
}

export interface HinweisVorlage {
    id: number;
    titel: string;
    text: string;
    strg: string;
    barcode?: string;
}

export interface AuthResponse {
    jwt: string;
    user: {
    rolle: string;
    username: string;
    id: number;
    [key: string]: unknown;
    };
    [key: string]: unknown;
};

export interface Attributes { attributes: { [key: string]: unknown } };


export interface Settings {
    Barcode_Mindestlaenge: number;
    Leitcodes_Aktiv: boolean;
    Ausnahmen_Aktiv: boolean;
}

export interface Ausnahmen {
    Barcode: string;
    Bedeutung: string;
}

// #[derive(Deserialize, Debug)]
// #[allow(non_snake_case)]
// pub struct Leitcode {
//     pub Beschreibung: String,
//     pub Mindeslaenge: i32,
//     pub Leitcode_Buchstabe: DataBuchstaben,
//     pub Produktion: bool,
// }
export interface Leitcode {
    Beschreibung: string;
    Mindeslaenge: number;
    Leitcode_Buchstabe: DataBuchstaben;
    Produktion: boolean;
}

// #[derive(Deserialize, Debug)]
// pub struct DataBuchstaben {
//     pub data: Vec<IdAtrBuchstaben>,
// }
interface DataBuchstaben {
    data: IdAtrBuchstaben[];
}

// #[derive(Deserialize, Debug)]
// pub struct IdAtrBuchstaben {
//     pub id: i16,
//     pub attributes: LeitcodeBuchstabe,
// }
interface IdAtrBuchstaben {
    id: number;
    attributes: LeitcodeBuchstabe;
}

// #[derive(Deserialize, Debug)]
// #[allow(non_snake_case)]
// pub struct LeitcodeBuchstabe {
//     pub Buchstabe: String,
//     pub Position_Null_Beginnend: i32,
// }
export interface LeitcodeBuchstabe {
    Buchstabe: string;
    Position_Null_Beginnend: number;
}

// #[derive(Insertable)]
// #[diesel(table_name = history)]
// #[derive(Debug)]
// pub struct History<'a> {
//     pub status: &'a str,
//     pub barcode: &'a str,
//     pub timestamp: &'a str,
//     pub synced: &'a bool,
//     pub user_id: &'a i32,
//     pub offline: bool,
//     pub lager_user_ids: &'a str,
// }
export interface Verlauf {
    status: string;
    barcode: string;
    timestamp: string;
    synced: boolean;
    user_id: number;
    offline: boolean;
    lager_user_ids: number[];
}