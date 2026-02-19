import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/config';

export interface User {
    _id: string;
    username: string;
    email: string;
    status: 'online' | 'offline';
}

export interface Message {
    senderId: string;
    receiverId?: string;
    groupId?: string;
    content: string;
    timestamp: string;
    senderUsername?: string;
}

export interface Group {
    _id: string;
    name: string;
    description: string;
    members: string[];
    admin: string;
}

export const useSocket = (sessionId: string | null) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!sessionId) return;

        const socket = io(API_BASE_URL, {
            auth: { sessionId }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to socket');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from socket');
        });

        socket.on('users_update', (updatedUsers: User[]) => {
            setUsers(updatedUsers);
        });

        socket.on('groups_update', (updatedGroups: Group[]) => {
            setGroups(updatedGroups);
        });

        socket.on('receive_message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('user_typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
            setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId]);

    const sendMessage = useCallback((content: string, receiverId?: string, groupId?: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send_message', {
                receiverId,
                groupId,
                content
            });
        }
    }, [isConnected]);

    const emitTyping = useCallback((isTyping: boolean, receiverId?: string, groupId?: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('typing', {
                isTyping,
                receiverId,
                groupId
            });
        }
    }, [isConnected]);

    return {
        isConnected,
        users,
        groups,
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        emitTyping
    };
};
