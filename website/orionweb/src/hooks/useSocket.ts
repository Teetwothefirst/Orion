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

export interface Reaction {
    emoji: string;
    count: number;
    user_ids: number[];
}

export interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    type: string;
    timestamp: string;
    media_url?: string;
    username?: string;
    avatar?: string;
    reactions?: Reaction[];
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
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        });

        socket.on('reaction_update', (data: { messageId: number; userId: number; emoji: string; action: 'added' | 'removed' }) => {
            setMessages(prev => prev.map(m => {
                if (m.id !== data.messageId) return m;
                const currentReactions = m.reactions || [];
                let newReactions = [...currentReactions];
                const rIndex = newReactions.findIndex(r => r.emoji === data.emoji);

                if (data.action === 'added') {
                    if (rIndex > -1) {
                        const r = newReactions[rIndex];
                        if (!r.user_ids.includes(data.userId)) {
                            newReactions[rIndex] = {
                                ...r,
                                count: r.count + 1,
                                user_ids: [...r.user_ids, data.userId]
                            };
                        }
                    } else {
                        newReactions.push({ emoji: data.emoji, count: 1, user_ids: [data.userId] });
                    }
                } else if (data.action === 'removed') {
                    if (rIndex > -1) {
                        const r = newReactions[rIndex];
                        const updatedUserIds = r.user_ids.filter(id => id !== data.userId);
                        if (updatedUserIds.length > 0) {
                            newReactions[rIndex] = {
                                ...r,
                                count: updatedUserIds.length,
                                user_ids: updatedUserIds
                            };
                        } else {
                            newReactions.splice(rIndex, 1);
                        }
                    }
                }
                return { ...m, reactions: newReactions };
            }));
        });

        socket.on('poll_update', (data: { messageId: number; pollData: any }) => {
            setMessages(prev => prev.map(m => {
                if (m.id !== data.messageId) return m;
                return { ...m, content: JSON.stringify(data.pollData) };
            }));
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
