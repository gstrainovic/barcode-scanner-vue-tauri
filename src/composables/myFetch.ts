import config from './config';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
const { userToken } = authStore;
import { onlineCheck } from '@/composables/helpers';
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
    const configData = await config();
    const isOnline: Boolean = await onlineCheck();

    const client = strapi({
        baseURL: configData.api.strapi,
        auth: token,
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

    const postHinweis = async (id: string, hinweis: string, erstelltVon: Number | null = null, hinweisUmgesetztVon: Number[]) => {
        if (isOnline) {
            const barcodes = client.collection('barcodes');

            const updateData: Record<string, any> = { hinweis: hinweis };
            if (erstelltVon !== null && erstelltVon !== undefined) {
                updateData.hinweis_erstellt_von = erstelltVon;
            }

            updateData.hinweis_umgesetzt_von = hinweisUmgesetztVon;

            const updatedBarcode = await barcodes.update(id, updateData);
            return updatedBarcode;
        }
    };

    const getHinweisFromBarcode = async (barcode: string) => {
        if (isOnline) {
            const response = await fetchWithAuth('barcodes?filters[barcode][$eq]=' + barcode + '&populate=*&pagination[limit]=1&sort=id:asc');
            return response.data[0];
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
    };

    const getHinweisVorlagen = async () => {
        let result = [];
        if (isOnline) {
            const response = await fetchWithAuth('hinweis-vorlagen?sort=strg:asc');
            const attributes = response.data.map((item: { attributes: any; }) => item.attributes);
            result = Array.isArray(attributes) ? attributes : [];
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
        return result;
    };

    const getUsersLager = async () => {
        let result = [];
        if (isOnline) {
            const response = await fetchWithAuth('users?filters[rolle][$eq]=Lager');
            result = Array.isArray(response) ? response : [];
        } else {
            // result = await window.pywebview.api.get_lager_users();
            throw new Error('Offline mode not implemented yet!');
            // TODO: Implement offline mode for getUsersLager
        }
        const userNameIds = result.map((user: { username: any; id: any; }) => {
            return {
                username: user.username,
                id: user.id,
            }
        });
        return await userNameIds;
    }

    const protokolliereArbeitszeit = async (typ: ZeiterfassungTypEnum, userId: number, login_or_logout: LoginOrLogoutEnum, lagerUserIds : number[] = []) => {
        const configData = await config();
        const url = configData.api.strapi + 'zeit-erfassungen';
        console.log('Protokolliere Arbeitszeit:', typ, userId, login_or_logout, lagerUserIds, url);

        // const body = {
        //     data: {
        //         mitarbeiter: userId,
        //         typ,
        //         zeitpunkt: new Date().toISOString(),
        //         // lager_mitarbeiter: lagerUserIds,
        //         login_or_logout,
        //     }
        // };

        // console.log('Protokolliere Arbeitszeit Body:', body);

        const jwt = token;
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`,
            },
            body: JSON.stringify({
                data: {
                    mitarbeiter: userId,
                    typ,
                    zeitpunkt: new Date().toISOString(),
                    // lager_mitarbeiter: lagerUserIds,
                    login_or_logout,
                }
            }),
        });
        console.log('Protokolliere Arbeitszeit:', result);
    } 


    return {
        getUsersLager,
        getHinweisFromBarcode,
        postHinweis,
        getHinweisVorlagen,
        protokolliereArbeitszeit,
    };
}
