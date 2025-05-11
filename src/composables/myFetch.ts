import config from './config';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
const { userToken } = authStore;
import { onlineCheck } from '@/composables/helpers';
import { strapi } from '@strapi/client';

export const useMyFetch = async () => {
    const token = userToken;
    const configData = await config();
    const isOnline: Boolean = await onlineCheck();

    const client = strapi({
        baseURL: configData.api.strapi,
        auth: token,
    });

    const fetchWithAuth: FetchWithAuth = async (endpoint, body = null) => {
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
            const response = await fetchWithAuth('hinweis-vorlagen');
            const attributes = response.data.map((item: { attributes: any; }) => item.attributes);

            // Füge 'Keine Vorlage' als erstes Element hinzu
            const keinHinweis = { "strg": 0, "text": "-", "createdAt": "2025-05-11T09:19:21.238Z", "updatedAt": "2025-05-11T09:21:12.608Z", "titel": "Kein Hinweis" };
            attributes.unshift(keinHinweis);
            result = Array.isArray(attributes) ? attributes : [];
        } else {
            throw new Error('Offline mode not implemented yet!');
        }

        console.log('Hinweis Vorlagen:', result);

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

    return {
        getUsersLager,
        getHinweisFromBarcode,
        postHinweis,
        getHinweisVorlagen,
    };
}
