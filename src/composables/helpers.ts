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

const privateGetToastMessage = (severity: string, message: string) => {
    return {             
        severity: severity,   
        summary: message,
        life: 3000,
    };
};

export const getWarningToastMessage = (message: string) => {
    return privateGetToastMessage('warn', message);
};

export const getErrorToastMessage = (message: string) => {
    const err = privateGetToastMessage('error', message);
    return err;
};

export const getSuccessToastMessage = (message: string) => {
    return privateGetToastMessage('success', message);
};
