import config from './config';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
const { userToken } = authStore;
import { onlineCheck } from '@/composables/helpers';

export const useMyFetch = async () => {
    const token = userToken;
    const configData = await config();
    const isOnline: Boolean = await onlineCheck();

    const fetchWithAuth: FetchWithAuth = async (endpoint, queryList = null, body = null) => {
        console.log('fetchWithAuth', endpoint, queryList, body);
        try {
            const response = await fetch(configData.api.strapi + endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Token im Header verwenden
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

    const postHinweise = async (body: any, barcode: string) => {
        if (isOnline) {
            const response = await fetchWithAuth('barcodes', null, body);
            return response;
        }
    }

    const getHinweiseFromBarcode = async (barcode: string) => {
        if (isOnline) {
            const response = await fetchWithAuth('barcodes?filters[barcode][$eq]=' + barcode + '&populate=*');

            // Extrahiere die Hinweise aus der API-Antwort
            const attributes = response.data.map((item: { attributes: any }) => item.attributes);

            // Verkette die Hinweise
            const hinweiseString = attributes
                .map((item: { hinweise: any }) => item.hinweise)
                .filter((hinweis: string) => hinweis && hinweis.trim() !== '')
                .join('\n\n--------------------\n\n');

            return { hinweiseString };
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
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

    const writeBarcode = async (barcode: any,
        user: any,
        jwt: any,
        lagerUserIds: any,
        sync: any) => {
        const body = {
            barcode,
            user,
            jwt,
            lagerUserIds,
            sync,
        };

        const result = await fetchWithAuth('barcodes', null, body);
        return result;
    }

    return {
        getUsersLager,
        writeBarcode,
        getHinweiseFromBarcode,
        postHinweise,
    };
}
