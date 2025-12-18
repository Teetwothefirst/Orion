import axios from 'axios';
import { io } from 'socket.io-client';

// const API_URL = 'http://127.0.0.1:3001';
const API_URL = 'https://orion-mobile-desktop-backend.onrender.com';

export const api = axios.create({
    baseURL: API_URL,
});

export const socket = io(API_URL, {
    autoConnect: false,
});
