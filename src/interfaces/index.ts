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