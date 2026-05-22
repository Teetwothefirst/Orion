import React, { createContext, useState, useContext } from 'react';
import { api, socket } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            socket.connect();
        }
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            socket.connect();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            const errorData = error.response?.data;
            const message = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || errorData?.error || 'Invalid credentials');
            setError(message);
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
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            socket.connect();
            return true;
        } catch (error) {
            console.error('Register error:', error);
            const errorData = error.response?.data;
            const message = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || errorData?.error || 'Registration failed');
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data;
            const message = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || errorData?.error || 'Failed to send reset link');
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (token, newPassword) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/reset-password', { token, newPassword });
            return response.data;
        } catch (error) {
            const errorData = error.response?.data;
            const message = typeof errorData === 'string'
                ? errorData
                : (errorData?.message || errorData?.error || 'Failed to reset password');
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        socket.disconnect();
    };

    const becomeVendor = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/marketplace/vendor-signup');
            const updatedUser = { ...user, role: 'vendor' };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return true;
        } catch (error) {
            console.error('Vendor signup error:', error);
            setError(error.response?.data?.error || 'Failed to upgrade to vendor');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, forgotPassword, resetPassword, becomeVendor, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
