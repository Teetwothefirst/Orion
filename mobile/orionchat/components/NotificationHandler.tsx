import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function NotificationHandler() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    api.post('/users/push-token', {
                        userId: user.id,
                        token,
                        platform: Platform.OS
                    }).catch(err => console.error('Error sending push token to backend:', err));
                }
            });
        }
    }, [user]);

    // Handle incoming notifications (e.g., navigate to chat when clicked)
    useEffect(() => {
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received in foreground:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification clicked:', response);

            // Navigate to the chat room
            const chatId = response.notification.request.content.data?.chatId;
            if (chatId) {
                // Ensure the path is correct for expo-router
                router.push({ pathname: '/chat/[id]', params: { id: chatId.toString() } });
            }
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    return null;
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'web') return null;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        // Project ID is required for newer versions of Expo
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

        try {
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) {
            console.error('Error getting Expo push token:', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}
