import React, { useState, useEffect, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import type { User, Message } from '../hooks/useSocket';
import { useSocket } from '../hooks/useSocket';
import { API_URL } from '../lib/config';
import { LogOut, Users, MessageSquare, Settings, Send, Plus, X, Mic, MicOff, ShoppingBag, Info } from 'lucide-react';
import ProductCard from '../components/ProductCard';

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
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersTab, setOrdersTab] = useState<'buying' | 'selling'>('buying');

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
                {isUploading && (
                    <div className="absolute bottom-4 right-4 bg-blue-600/80 text-white px-4 py-2 rounded-full animate-bounce">
                        Processing voice...
                    </div>
                )}
            </div>
        );
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        const content = messageInput;

        // Agricultural Keywords for AI Search Interception
        const agKeywords = ['find', 'buy', 'search', 'maize', 'yam', 'rice', 'beans', 'poultry', 'cow', 'fertilizer', 'tractor', 'farm', 'price of'];
        const isAgQuery = agKeywords.some(kw => content.toLowerCase().includes(kw));

        sendMessage({
            chatId: selectedChat.id,
            senderId: user.id,
            content: content
        });
        setMessageInput('');

        // If it's an agricultural query, trigger AI discovery
        if (isAgQuery) {
            try {
                const response = await fetch(`${API_URL}/marketplace/ai-search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query: content })
                });

                if (response.ok) {
                    const products = await response.json();
                    if (products && products.length > 0) {
                        setTimeout(() => {
                            products.forEach((product: any) => {
                                sendMessage({
                                    chatId: selectedChat.id,
                                    senderId: user.id,
                                    content: `Found ${product.name} at ${product.location}`,
                                    type: 'product',
                                    // @ts-ignore - sendMessage in useSocket handles this
                                    product_data: product
                                });
                            });
                        }, 800);
                    }
                }
            } catch (err) {
                console.error('AI Discovery failed:', err);
            }
        }
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
                handleVoiceSearch(file);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error('Recording failed:', err);
            alert('Could not access microphone.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const handleVoiceSearch = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await fetch(`${API_URL}/marketplace/voice-search`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.transcription) {
                    setMessageInput(data.transcription);
                }
            }
        } catch (error) {
            console.error('Voice search failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCheckout = async (product: any) => {
        try {
            const response = await fetch(`${API_URL}/marketplace/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product.id, quantity: 1 })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.checkout_url) {
                    window.open(data.checkout_url, '_blank');
                }
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to initiate checkout.');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            alert('Failed to initiate checkout.');
        }
    };

    const handleBecomeVendor = async () => {
        if (!window.confirm('Do you want to upgrade to a Vendor account?')) return;
        try {
            const res = await fetch(`${API_URL}/marketplace/vendor-signup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedUser = { ...user, role: 'vendor' as const };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert('Congratulations! You are now a vendor.');
            }
        } catch (err) {
            console.error('Vendor signup failed', err);
        }
    };

    const fetchOrders = async (role: 'buyer' | 'vendor' = 'buyer') => {
        setOrdersLoading(true);
        try {
            const response = await fetch(`${API_URL}/marketplace/orders?role=${role}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setOrders(await response.json());
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
        try {
            const res = await fetch(`${API_URL}/marketplace/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                alert(`Order marked as ${newStatus}`);
                fetchOrders(ordersTab === 'buying' ? 'buyer' : 'vendor');
            }
        } catch (error) {
            console.error('Status update failed:', error);
        }
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
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{user.role || 'User'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowOrdersModal(true);
                                fetchOrders(ordersTab === 'buying' ? 'buyer' : 'vendor');
                            }}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Orders"
                        >
                            <ShoppingBag size={20} />
                        </button>
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {user.role !== 'vendor' && (
                    <div className="mx-4 p-4 mt-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20">
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">Marketplace</p>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">Upgrade your account to start selling products.</p>
                        <button
                            onClick={handleBecomeVendor}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all"
                        >
                            Become a Vendor
                        </button>
                    </div>
                )}

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
                                    {(selectedChat.name || 'C')[0].toUpperCase()}
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
                                            
                                            {m.type === 'product' && m.product_data && (
                                                <div className="mt-4">
                                                    <ProductCard 
                                                        product={m.product_data} 
                                                        onBuy={() => handleCheckout(m.product_data)}
                                                    />
                                                </div>
                                            )}

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
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="flex-1 px-5 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Type a message..."
                                />
                                {messageInput.trim().length === 0 && (
                                    <button
                                        type="button"
                                        onMouseDown={handleStartRecording}
                                        onMouseUp={handleStopRecording}
                                        onMouseLeave={isRecording ? handleStopRecording : undefined}
                                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                        title="Hold to search by voice"
                                    >
                                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={!messageInput.trim()}
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

            {showOrdersModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <ShoppingBag className="text-blue-500" /> Marketplace Orders
                            </h2>
                            <button onClick={() => setShowOrdersModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-800">
                            <button 
                                onClick={() => { setOrdersTab('buying'); fetchOrders('buyer'); }}
                                className={`flex-1 py-4 text-sm font-semibold transition-all ${ordersTab === 'buying' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >
                                Buying
                            </button>
                            <button 
                                onClick={() => { setOrdersTab('selling'); fetchOrders('vendor'); }}
                                className={`flex-1 py-4 text-sm font-semibold transition-all ${ordersTab === 'selling' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >
                                Selling
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {ordersLoading ? (
                                <div className="flex justify-center p-12">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                                    <ShoppingBag size={64} className="opacity-20" />
                                    <p className="text-xl">No orders found</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl space-y-4 hover:border-gray-600 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Order #{order.id}</span>
                                                <h3 className="font-bold text-lg text-gray-100">
                                                    {ordersTab === 'buying' ? `Vendor: ${order.vendor_name}` : `Buyer: ${order.buyer_name}`}
                                                </h3>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                order.status === 'paid' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-2xl font-black text-white">₦{order.total_amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-blue-500/20">
                                                <Info size={14} />
                                                Escrow: {order.escrow_status === 'held' ? 'Funds Protected' : 'Funds Released'}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-700/50 flex gap-3">
                                            {ordersTab === 'selling' && order.status === 'paid' && (
                                                <button 
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-yellow-600/20"
                                                >
                                                    Mark as Shipped
                                                </button>
                                            )}
                                            {ordersTab === 'buying' && order.status === 'shipped' && (
                                                <button 
                                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/20"
                                                >
                                                    Confirm Delivery
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
