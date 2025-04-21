import config from './config';
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();
const { userToken } = authStore;
import { onlineCheck } from '@/composables/helpers';

export const useMyFetch = () => {
    const token = userToken;

    console.log('useMyFetch token', token);

    const fetchWithAuth: FetchWithAuth = async (endpoint, queryList = null, body = null) => {
        console.log('fetchWithAuth', endpoint, queryList, body);
        try {
            const response = await fetch(endpoint, {
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


    const getHinweiseFromBarcode = async (barcode: string) => {
        const isOnline: Boolean = await onlineCheck();
        let result = null;
        console.log('barcode', barcode);
        console.log('getHinweiseFromBarcode isOnline', isOnline);

        if (isOnline) {
            console.log('getHinweiseFromBarcode fetchWithAuth', fetchWithAuth);
            const configData = await config();
            const response = await fetchWithAuth(configData.api.strapi + 'barcodes?filters[barcode][$eq]=' + barcode);
            console.log('getHinweiseFromBarcode response', response);

            // Extrahiere die Hinweise aus der API-Antwort
            const attributes = response.data.map((item: { attributes: any }) => item.attributes);
            console.log('getHinweiseFromBarcode attributes', attributes);

            // Verkette die Hinweise
            const hinweiseString = attributes
                .map((item: { hinweise: any }) => item.hinweise)
                .filter((hinweis: string) => hinweis && hinweis.trim() !== '')
                .join('\n\n--------------------\n\n');
            console.log('getHinweiseFromBarcode hinweiseList', hinweiseString);
            return hinweiseString;
        } else {
            throw new Error('Offline mode not implemented yet!');
        }
    };

    const getUsersLager = async () => {
        const isOnline : Boolean = await onlineCheck();
        let result = [];
        console.log('getUsersLager isOnline', isOnline);
        if (isOnline) {
            console.log('getUsersLager fetchWithAuth', fetchWithAuth);
            const configData = await config();
            const response = await fetchWithAuth(configData.api.strapi + 'users?filters[rolle][$eq]=Lager');
            result = Array.isArray(response) ? response : [];
        } else {
            // result = await window.pywebview.api.get_lager_users();
            throw new Error('Offline mode not implemented yet!');
            // TODO: Implement offline mode for getUsersLager
        }   
        console.log('getUsersLager result', result);
        const userNameIds = result.map((user: { username: any; id: any; }) => {
            return {
                username: user.username,
                id: user.id,
            }
        });
        console.log('getUsersLager usernames', userNameIds);
        return await userNameIds;
    }

    const writeBarcode = async (barcode: any,
        user: any,
        jwt: any,
        lagerUserIds: any,
        sync: any) => {
        const configData = await config();
        const url = `${configData.api.strapi}barcodes`;

        const body = {
            barcode,
            user,
            jwt,
            lagerUserIds,
            sync,
        };

        const result = await fetchWithAuth(url, null, body);
        console.log('writeBarcode result', result);
        return result;
    }

    return {
        getUsersLager,
        writeBarcode,
        getHinweiseFromBarcode,
    };
}
