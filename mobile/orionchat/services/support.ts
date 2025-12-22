import { api } from './api';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const reportBug = async (data: {
    user?: string;
    description: string;
    isCrash: boolean;
    stackTrace?: string;
}) => {
    try {
        const response = await api.post('/support/report-bug', {
            ...data,
            deviceInfo: {
                platform: Platform.OS,
                version: Platform.Version,
                deviceName: Constants.deviceName,
                expoVersion: Constants.expoVersion,
                appVersion: Constants.nativeAppVersion,
                modelName: Constants.deviceName
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error reporting bug:', error);
        throw error;
    }
};
