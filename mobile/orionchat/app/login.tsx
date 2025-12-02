import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '@/components/auth/LoginScreen';

export default function LoginRoute() {
    const router = useRouter();

    const handleLoginWithGoogle = () => {
        console.log('Login with Google');
        // Implement Google Sign-In logic here
        // router.replace('/(tabs)');
    };

    const handleLoginWithPasskey = () => {
        console.log('Login with Passkey');
        // Implement Passkey logic here
    };

    const handleLoginWithEmail = () => {
        console.log('Login with Email');
        router.replace('/(tabs)');
    };

    return (
        <LoginScreen
            onLoginWithGoogle={handleLoginWithGoogle}
            onLoginWithPasskey={handleLoginWithPasskey}
            onLoginWithEmail={handleLoginWithEmail}
        />
    );
}
