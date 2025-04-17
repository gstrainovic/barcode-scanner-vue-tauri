import config from './config';

export const onlineCheck = async () => {
    const url = config.api.strapi.replace('/api', '');
    try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();
        if (response.status === 200 && text.includes('The server is running successfully')) {
            console.log('Server is online');
            return true;
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
    console.log('Server is offline');
    return false;
}
