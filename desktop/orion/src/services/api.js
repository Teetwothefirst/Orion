import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001';
// const API_URL = 'https://orion-mobile-desktop-backend.onrender.com';

export const api = axios.create({
    baseURL: API_URL,
});

// Add interceptor to include token in headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const socket = io(API_URL, {
    autoConnect: false,
});
