import axios from 'axios';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
// For physical device, use your computer's IP address (e.g., http://192.168.1.5:3000)
// const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Use your computer's IP address for both emulator and physical device
const API_URL = 'http://10.176.163.168:3001';

export const api = axios.create({
    baseURL: API_URL,
});

export const socket = io(API_URL, {
    autoConnect: false,
});
