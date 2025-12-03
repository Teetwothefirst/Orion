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
        } catch (error) {
            Alert.alert('Error', 'Authentication failed. Please check your credentials.');
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
