import config from './config';

export const onlineCheck = async () => {
    const configData = await config();
    const url = configData.api.strapi.replace('/api', '');
    try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
            return true;
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
    return false;
}

export const getToastMessage = (erfolg: boolean, message: string) => {
    return {
        severity: erfolg ? 'success' : 'error',
        summary: erfolg ? 'Erfolg' : 'Fehler',
        detail: message,
        life: 3000,
    };
};
