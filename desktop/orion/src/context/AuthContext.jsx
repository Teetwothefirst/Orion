import React, { createContext, useState, useContext } from 'react';
import { api, socket } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            socket.connect();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            setError(
                error.response?.data?.message ||
                error.response?.data ||
                'Unable to connect to server. Please check your connection.'
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register', { username: name, email, password });
            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            socket.connect();
            return true;
        } catch (error) {
            console.error('Register error:', error);
            setError(
                error.response?.data?.message ||
                error.response?.data ||
                'Unable to connect to server. Please check your connection.'
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
