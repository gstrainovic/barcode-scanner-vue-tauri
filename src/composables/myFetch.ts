import { useAppStore } from '@/stores/appStore';
import config from './config';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
const { userToken } = authStore;
const appStore = useAppStore();
import { strapi } from '@strapi/client';

export enum ZeiterfassungTypEnum {
    Login = "login",
    Logout = "logout",
    Nutzerwechsel = "nutzerwechsel",
    AppSchliessung = "app_schliessung"
}

export enum LoginOrLogoutEnum {
    Login = "login",
    Logout = "logout"
}


export const useMyFetch = async () => {
    const token = userToken;
    if (!token) {
        throw new Error('User token is not available. Please log in first.');
    }
    const configData = await config();
    await appStore.onlineCheck();

    const client = strapi({
        baseURL: configData.api.strapi,
        auth: token
    });

    const fetchWithAuth = async (endpoint: string, body = null) => {
        try {
            const response = await fetch(configData.api.strapi + endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: body ? 'POST' : 'GET',
                body: body ? JSON.stringify(body) : null
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch data:', error);
            throw error;
        }
    };

    const postHinweis = async (id: string, hinweis: string, erstelltVon: number | null = null, hinweisUmgesetztVon: number[]) => {
        if (appStore.isOnline) {
            const barcodes = client.collection('barcodes');

            const updateData: { hinweis: string; hinweis_erstellt_von?: number; hinweis_umgesetzt_von?: number[] } = { hinweis: hinweis };
            if (erstelltVon !== null && erstelltVon !== undefined) {
                updateData.hinweis_erstellt_von = erstelltVon;
            }

            updateData.hinweis_umgesetzt_von = hinweisUmgesetztVon;

            const updatedBarcode = await barcodes.update(id, updateData);
            return updatedBarcode;
        }
    };

    const getHinweisFromBarcode = async (barcode: string) => {
        if (appStore.isOnline) {
            const response = await fetchWithAuth('barcodes?filters[barcode][$eq]=' + barcode + '&populate=*&pagination[limit]=1&sort=id:asc');
            return response.data[0];
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
    };

    const getHinweisVorlagen = async () => {
        let result = [];
        if (appStore.isOnline) {
            const response = await fetchWithAuth('hinweis-vorlagen?sort=strg:asc');
            type HinweisVorlage = { attributes: { [key: string]: unknown } };
            const attributes = response.data.map((item: HinweisVorlage) => item.attributes);
            result = Array.isArray(attributes) ? attributes : [];
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
        return result;
    };


    const protokolliereArbeitszeit = async (typ: ZeiterfassungTypEnum, teamAndUserIds: number[], login_or_logout: LoginOrLogoutEnum) => {
        const configData = await config();
        const url = configData.api.strapi + 'zeit-erfassungen';
        const jwt = token;
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`,
            },
            body: JSON.stringify({
                data: {
                    typ,
                    mitarbeiter: teamAndUserIds,
                    zeitpunkt: new Date().toISOString(),
                    login_or_logout,
                }
            }),
        });
    }
    
    return {
        fetchWithAuth,
        getHinweisFromBarcode,
        postHinweis,
        getHinweisVorlagen,
        protokolliereArbeitszeit,
    };
}
