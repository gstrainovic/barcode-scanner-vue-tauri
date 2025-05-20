import config from './config';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { storeToRefs } from 'pinia';



export const useApi = async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    const { userToken } = storeToRefs(authStore);

    if (!userToken.value) {
        throw new Error('User token is not available. Please log in first.');
    }
    const configData = await config();
    await appStore.onlineCheck();

    const fetchWithAuth = async (endpoint: string, data: unknown = null) => {
        try {
            const response = await fetch(configData.api.strapi + endpoint, {
                headers: {
                    'Authorization': `Bearer ${userToken.value}`,
                    'Content-Type': 'application/json'
                },
                method: data ? 'POST' : 'GET',
                body: data ? JSON.stringify({data}) : null
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch data:', error);
            throw error;
        }
    };
    
    return {
        fetchWithAuth,
    };
}
