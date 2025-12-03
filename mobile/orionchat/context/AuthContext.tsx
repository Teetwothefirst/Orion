import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, socket } from '../services/api';
import { useRouter } from 'expo-router';

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    signOut: () => void;
    isLoading: boolean;
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

    const signOut = () => {
        setUser(null);
        setToken(null);
        socket.disconnect();
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, signIn, register, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
