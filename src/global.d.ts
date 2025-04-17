interface FetchWithAuthResponse {
    [key: string]: any;
}

interface FetchWithAuth {
    (endpoint: string, queryList?: any, body?: any): Promise<FetchWithAuthResponse>;
}

interface Window {
    pywebview: any;
}

interface LagerUser {
    username: string;
    id: string;
}
