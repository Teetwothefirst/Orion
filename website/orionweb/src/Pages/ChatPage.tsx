import React, { useState, useEffect, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import type { User, Message } from '../hooks/useSocket';
import { useSocket } from '../hooks/useSocket';
import { API_URL } from '../lib/config';
import { LogOut, Users, MessageSquare, Settings, Send, Plus, X } from 'lucide-react';

interface ChatPageProps {
    onBackToHome: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onBackToHome }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    const [selectedChat, setSelectedChat] = useState<{ id: number; type: 'private' | 'group', name: string } | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
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
    } = useSocket(token);

    // Sync user from local storage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Fetch initial users and chats
    useEffect(() => {
        if (!user || !token) return;

        const fetchData = async () => {
            try {
                const [usersRes, chatsRes] = await Promise.all([
                    fetch(`${API_URL}/auth/users?currentUserId=${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/chats?userId=${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (usersRes.ok) setUsers(await usersRes.json());
                if (chatsRes.ok) setChats(await chatsRes.json());
            } catch (err) {
                console.error('Failed to fetch initial data', err);
            }
        };

        fetchData();
    }, [user, token, setUsers, setChats]);

    // Fetch message history when selectedChat changes
    useEffect(() => {
        if (!selectedChat || !token) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/chats/${selectedChat.id}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const history: Message[] = await response.json();
                    setMessages(history);
                    joinRoom(selectedChat.id);
                }
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };

        fetchHistory();

        return () => {
            leaveRoom(selectedChat.id);
        };
    }, [selectedChat, token, setMessages, joinRoom, leaveRoom]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAuthSuccess = (authUser: any, tkn: string) => {
        setUser(authUser);
        setToken(tkn);
        localStorage.setItem('token', tkn);
        localStorage.setItem('user', JSON.stringify(authUser));
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    if (!token || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
                <div className="absolute top-6 left-6">
                    <button onClick={onBackToHome} className="text-gray-400 hover:text-white flex items-center gap-2">
                        <LogOut size={20} className="rotate-180" /> Back to Home
                    </button>
                </div>
                <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
        );
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        sendMessage({
            chatId: selectedChat.id,
            senderId: user.id,
            content: messageInput
        });
        setMessageInput('');
    };

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/50">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg truncate">{user.username}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">{isConnected ? 'Online' : 'Disconnected'}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="flex p-2 bg-gray-900 mx-4 mt-4 rounded-xl border border-gray-800">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Users size={16} /> Discovery
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <MessageSquare size={16} /> Chats
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {activeTab === 'users' ? (
                        users.map((u) => (
                            <button
                                key={u.id}
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_URL}/chats`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ userId: user.id, otherUserId: u.id, type: 'private' })
                                        });
                                        if (res.ok) {
                                            const chat = await res.json();
                                            setSelectedChat({ id: chat.id, type: 'private', name: u.username || 'Private Chat' });
                                            const chatsRes = await fetch(`${API_URL}/chats?userId=${user.id}`, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (chatsRes.ok) setChats(await chatsRes.json());
                                        }
                                    } catch (err) {
                                        console.error('Failed to start chat', err);
                                    }
                                }}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all hover:bg-gray-900 border border-transparent hover:border-gray-800`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-gray-900 rounded-full ${onlineUsers[u.id] === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm">{u.username}</p>
                                    <p className="text-xs text-gray-500">{onlineUsers[u.id] || 'offline'}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <>
                            <button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="w-full py-3 mb-2 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus size={16} /> New Group
                            </button>
                            {chats.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedChat({ id: c.id, type: c.type, name: c.name || 'Private Chat' })}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedChat?.id === c.id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-900 border border-transparent hover:border-gray-800'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${c.type === 'private' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                        {(c.name || 'P')[0].toUpperCase()}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{c.name || 'Private Chat'}</p>
                                        <p className="text-xs text-gray-400 truncate capitalize">{c.type}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-950">
                {selectedChat ? (
                    <>
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${selectedChat.type === 'private' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                    {selectedChat.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">{selectedChat.name}</h3>
                                </div>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                <Settings size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.filter(m => m.chat_id === selectedChat.id).map((m, i) => {
                                const isOwn = m.sender_id === user.id;
                                return (
                                    <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{m.content}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right opacity-50">
                                                {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-800 flex gap-4">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                className="flex-1 px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Type a message..."
                            />
                            <button
                                type="submit"
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <Send size={24} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-800 shadow-inner">
                            <Users size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Welcome to Orion Web Chat</h3>
                        <p className="max-w-xs leading-relaxed text-sm">Select a chat from the sidebar to start your conversation.</p>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateGroupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">New Group</h3>
                            <button onClick={() => setIsCreateGroupOpen(false)} className="p-2 hover:text-red-400"><X /></button>
                        </div>
                        <input
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                        />
                        <button
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
                            onClick={async () => {
                                if (!newGroupName.trim()) return;
                                try {
                                    const res = await fetch(`${API_URL}/chats`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            userId: user.id,
                                            name: newGroupName,
                                            type: 'group',
                                            participantIds: []
                                        })
                                    });
                                    if (res.ok) {
                                        setIsCreateGroupOpen(false);
                                        setNewGroupName('');
                                        const chatsRes = await fetch(`${API_URL}/chats?userId=${user.id}`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (chatsRes.ok) setChats(await chatsRes.json());
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                        >
                            Create Group
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
