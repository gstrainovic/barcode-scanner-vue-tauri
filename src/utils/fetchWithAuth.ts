import Config from './config';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';

export const fetchWithAuth = async (endpoint: string, data: unknown = null) => {
    const authStore = useAuthStore();
    const { userToken } = storeToRefs(authStore);

    if (!userToken.value) {
        throw new Error('User token is not available. Please log in first.');
    }
    const configData = await Config();

    try {
        const response = await fetch(configData.api.strapi + endpoint, {
            headers: {
                'Authorization': `Bearer ${userToken.value}`,
                'Content-Type': 'application/json'
            },
            method: data ? 'POST' : 'GET',
            body: data ? JSON.stringify({ data }) : null
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw error;
    }
};
