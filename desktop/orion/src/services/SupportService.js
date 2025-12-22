import { api } from './api';

export const reportBug = async (data) => {
    try {
        const response = await api.post('/support/report-bug', {
            ...data,
            deviceInfo: {
                ...data.deviceInfo,
                type: 'Desktop',
                userAgent: navigator.userAgent,
                platform: navigator.platform,
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error reporting bug:', error);
        throw error;
    }
};
