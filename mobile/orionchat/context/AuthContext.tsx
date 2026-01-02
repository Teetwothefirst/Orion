import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, socket } from '../services/api';
import { useRouter } from 'expo-router';

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    last_seen?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    signOut: () => void;
    isLoading: boolean;
    forgotPassword: (email: string) => Promise<any>;
    resetPassword: (token: string, newPassword: string) => Promise<any>;
    updateProfile: (username: string, bio: string, avatarFile?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            setToken(token);
            setUser(user);

            // Connect socket
            socket.connect();

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', { username, email, password });
            const { token, user } = response.data;
            setToken(token);
            setUser(user);

            // Connect socket
            socket.connect();

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (token: string, newPassword: string) => {
        const response = await api.post('/auth/reset-password', { token, newPassword });
        return response.data;
    };

    const signOut = () => {
        setUser(null);
        setToken(null);
        socket.disconnect();
        router.replace('/login');
    };

    const updateProfile = async (username: string, bio: string, avatarFile?: any) => {
        const formData = new FormData();
        formData.append('userId', user?.id.toString() || '');
        formData.append('username', username);
        formData.append('bio', bio);
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        try {
            const response = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, signIn, register, signOut, isLoading, forgotPassword, resetPassword, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
