import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/config';

export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline';
}

export interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    type: string;
    timestamp: string;
    username?: string;
    avatar?: string;
}

export interface Chat {
    id: number;
    name: string;
    type: 'private' | 'group';
    other_user_id?: number;
    last_message?: string;
    last_message_time?: string;
}

export const useSocket = (token: string | null) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!token) return;

        const socket = io(API_BASE_URL, {
            query: { token }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to socket');
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                socket.emit('user_online', user.id);
            }
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setOnlineUsers({});
            console.log('Disconnected from socket');
        });

        socket.on('user_status', ({ userId, status }: { userId: number; status: string }) => {
            setOnlineUsers(prev => ({ ...prev, [userId]: status }));
        });

        socket.on('receive_message', (message: Message) => {
            setMessages((prev) => {
                // Prevent duplicates
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    const joinRoom = useCallback((chatId: number) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join_room', chatId.toString());
        }
    }, [isConnected]);

    const leaveRoom = useCallback((chatId: number) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave_room', chatId.toString());
        }
    }, [isConnected]);

    const sendMessage = useCallback((data: {
        chatId: number,
        senderId: number,
        content: string,
        type?: string
    }) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send_message', {
                ...data,
                type: data.type || 'text'
            });
        }
    }, [isConnected]);

    return {
        isConnected,
        users,
        setUsers,
        chats,
        setChats,
        messages,
        setMessages,
        onlineUsers,
        sendMessage,
        joinRoom,
        leaveRoom
    };
};
