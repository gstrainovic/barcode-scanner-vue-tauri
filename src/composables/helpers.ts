    // def isOnline(self) -> bool:
    //     url = STRAPI_URL.replace('/api', '')
    //     try:
    //         get = requests.get(url)
    //         text = get.text
    //         if get.status_code == 200 and 'The server is running successfully ' in text:
    //             print('Server is online')
    //             return True
    //     except requests.RequestException as e:
    //         print(f"An error occurred: {e}")
    //     print('Server is offline')
    //     return False

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
