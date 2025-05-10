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

    const postHinweise = async ( id: string, hinweise: string) => {
        console.log('postHinweise called with id:', id, 'and hinweise:', hinweise);
        if (isOnline) {
            const barcodes = client.collection('barcodes');

            const updatedBarcode = await barcodes.update(id, {hinweise});

            console.log('Hinweise updated:', updatedBarcode);
            return updatedBarcode;
        }
    }

    const getHinweiseFromBarcode = async (barcode: string) => {
        console.log('Barcode:', barcode);

        if (isOnline) {
            const response = await fetchWithAuth('barcodes?filters[barcode][$eq]=' + barcode + '&populate=*&pagination[limit]=1');
            console.log('Barcode response:', response);

            // Extrahiere die Hinweise aus der API-Antwort
            // const attributes = response.data.map((item: { attributes: any }) => item.attributes);

            // console.log('Hinweise:', attributes);

            // const hinweise = attributes.map((item: { hinweise: any }) => item.hinweise);
            // console.log('Hinweise:', hinweise);

            // const hinweis = attributes.find((item: { hinweise: any }) => item.hinweise);
            // console.log('Hinweis:', hinweis);

            // Verkette die Hinweise
            // const hinweiseString = attributes
            //     .map((item: { hinweise: any }) => item.hinweise)
            //     .filter((hinweis: string) => hinweis && hinweis.trim() !== '')
            //     .join('\n\n--------------------\n\n');

            return response.data[0];
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


    return {
        getUsersLager,
        getHinweiseFromBarcode,
        postHinweise,
    };
}
