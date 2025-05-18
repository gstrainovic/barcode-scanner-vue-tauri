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
