import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '@/components/auth/LoginScreen';
import { useAuth } from '@/context/AuthContext';
import { Alert } from 'react-native';

export default function LoginRoute() {
    const router = useRouter();
    const { signIn, register, isLoading } = useAuth();

    const handleLoginWithGoogle = () => {
        console.log('Login with Google');
        // Implement Google Sign-In logic here
        // router.replace('/(tabs)');
    };

    const handleLoginWithPasskey = () => {
        console.log('Login with Passkey');
        // Implement Passkey logic here
    };

    const handleLoginWithEmail = async (email: string, password: string, isRegister: boolean, username?: string) => {
        try {
            if (isRegister) {
                if (!username) {
                    Alert.alert('Error', 'Username is required for registration');
                    return;
                }
                await register(username, email, password);
            } else {
                await signIn(email, password);
            }
        } catch (error: any) {
            console.error('Authentication error:', error);
            let message = 'Authentication failed. Please check your credentials.';

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                message = error.response.data || message;

                // If message is an object (like for 401), stringify it or extract a field
                if (typeof message === 'object') {
                    message = JSON.stringify(message);
                }
            } else if (error.request) {
                // The request was made but no response was received
                message = 'Network error. Please check your connection.';
            }

            Alert.alert('Error', message);
        }
    };

    return (
        <LoginScreen
            onLoginWithGoogle={handleLoginWithGoogle}
            onLoginWithPasskey={handleLoginWithPasskey}
            onLoginWithEmail={handleLoginWithEmail}
            isLoading={isLoading}
        />
    );
}
