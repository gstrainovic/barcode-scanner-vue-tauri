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