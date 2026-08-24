import React, { useState, useEffect, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import type { User, Message } from '../hooks/useSocket';
import { useSocket } from '../hooks/useSocket';
import { API_URL } from '../lib/config';
import {
    LogOut, Users, MessageSquare, Settings, Send, Plus, X,
    FileText, Image as ImageIcon, Camera, Music, BarChart2, UserCheck,
    Download, Play, Pause, Smile
} from 'lucide-react';

interface ChatPageProps {
    onBackToHome: () => void;
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const ChatPage: React.FC<ChatPageProps> = ({ onBackToHome }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    const [selectedChat, setSelectedChat] = useState<{ id: number; type: 'private' | 'group', name: string } | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Attachment & Picker States
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);

    // Modal States for Attachments
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    
    const [showContactModal, setShowContactModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

    // Audio Playback state
    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

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

    // Global Click-Outside Listener to dismiss menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setActiveReactionMsgId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat || !user) return;

        sendMessage({
            chatId: selectedChat.id,
            senderId: user.id,
            content: messageInput
        });
        setMessageInput('');
    };

    // File Upload Handler
    const handleFileUpload = async (file: File) => {
        if (!selectedChat || !user || !token) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/chats/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                sendMessage({
                    chatId: selectedChat.id,
                    senderId: user.id,
                    content: data.url,
                    type: data.type
                });
            }
        } catch (err) {
            console.error('Error uploading file:', err);
        }
        setShowAttachmentMenu(false);
    };

    // Reaction Handler (prevent self-reaction)
    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!token || !user) return;
        const targetMsg = messages.find(m => m.id === messageId);
        if (targetMsg && targetMsg.sender_id === user.id) {
            setActiveReactionMsgId(null);
            return; // Cannot react to own message
        }

        try {
            await fetch(`${API_URL}/chats/messages/${messageId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user.id, emoji })
            });
        } catch (err) {
            console.error('Error toggling reaction:', err);
        }
        setActiveReactionMsgId(null);
    };

    // Poll Vote Handler
    const handlePollVote = async (messageId: number, optionId: string) => {
        if (!token || !user) return;
        try {
            await fetch(`${API_URL}/chats/messages/${messageId}/poll/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user.id, optionId })
            });
        } catch (err) {
            console.error('Error voting on poll:', err);
        }
    };

    // Poll Creation Submit
    const handleCreatePoll = () => {
        if (!selectedChat || !user || !pollQuestion.trim()) return;
        const validOptions = pollOptions.filter(o => o.trim().length > 0);
        if (validOptions.length < 2) return;

        const pollData = {
            question: pollQuestion.trim(),
            options: validOptions.map((opt, idx) => ({
                id: `opt_${idx}_${Date.now()}`,
                text: opt.trim(),
                voters: []
            }))
        };

        sendMessage({
            chatId: selectedChat.id,
            senderId: user.id,
            content: JSON.stringify(pollData),
            type: 'poll'
        });

        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowAttachmentMenu(false);
    };

    // Contact Share Handler
    const handleShareContact = (contactUser: User) => {
        if (!selectedChat || !user) return;
        const contactData = {
            id: contactUser.id,
            username: contactUser.username,
            email: contactUser.email
        };

        sendMessage({
            chatId: selectedChat.id,
            senderId: user.id,
            content: JSON.stringify(contactData),
            type: 'contact'
        });

        setShowContactModal(false);
        setShowAttachmentMenu(false);
    };

    // Camera WebCam Start & Capture
    const startCamera = async () => {
        setShowCameraModal(true);
        setShowAttachmentMenu(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `camera_${Date.now()}.png`, { type: 'image/png' });
                    handleFileUpload(file);
                }
            }, 'image/png');
        }
        if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setShowCameraModal(false);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
        setShowCameraModal(false);
    };

    if (!token || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
                <div className="absolute top-6 left-6">
                    <button onClick={onBackToHome} className="text-gray-400 hover:text-white flex items-center gap-2">
                        <LogOut size={20} className="rotate-180" /> Back to Home
                    </button>
                </div>
                <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
            {/* Hidden File Inputs for Attachment Types */}
            <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.zip" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

            {/* Sidebar */}
            <div className="w-80 border-r border-gray-800/80 flex flex-col bg-gray-900/40 backdrop-blur-xl">
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg truncate tracking-wide">{user.username}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-rose-500'}`}></span>
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-rose-400 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="flex p-1.5 bg-gray-900/80 mx-4 mt-4 rounded-2xl border border-gray-800">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Users size={16} /> Discovery
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'groups' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}
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
                                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${selectedChat?.name === u.username ? 'bg-blue-600/10 border border-blue-500/30' : 'hover:bg-gray-900/60 border border-transparent hover:border-gray-800'}`}
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-gray-950 rounded-full ${onlineUsers[u.id] === 'online' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div className="text-left overflow-hidden">
                                    <p className="font-semibold text-sm truncate text-gray-200">{u.username}</p>
                                    <p className="text-xs text-gray-400 capitalize">{onlineUsers[u.id] || 'offline'}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <>
                            <button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="w-full py-3 mb-2 rounded-2xl border border-dashed border-gray-700 hover:border-blue-500 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-semibold"
                            >
                                <Plus size={16} /> Create New Group
                            </button>
                            {chats.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedChat({ id: c.id, type: c.type, name: c.name || 'Private Chat' })}
                                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${selectedChat?.id === c.id ? 'bg-gray-800/80 border border-gray-700 shadow-sm' : 'hover:bg-gray-900/60 border border-transparent hover:border-gray-800'}`}
                                >
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${c.type === 'private' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'}`}>
                                        {(c.name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-semibold text-sm truncate text-gray-200">{c.name || 'Private Chat'}</p>
                                        <p className="text-xs text-gray-400 capitalize">{c.type}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-950/80 relative">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 px-6 border-b border-gray-800/80 flex items-center justify-between bg-gray-900/30 backdrop-blur-xl">
                            <div className="flex items-center gap-3.5">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md ${selectedChat.type === 'private' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                                    {(selectedChat.name || 'C')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-100">{selectedChat.name}</h3>
                                    <p className="text-xs text-gray-400 capitalize">{selectedChat.type} room</p>
                                </div>
                            </div>
                            <button className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/60 transition-all">
                                <Settings size={20} />
                            </button>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.filter(m => m.chat_id === selectedChat.id).map((m, i) => {
                                const isOwn = m.sender_id === user.id;

                                // Helper to parse Poll data safely
                                let pollData: any = null;
                                if (m.type === 'poll') {
                                    try {
                                        pollData = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
                                    } catch (e) {
                                        pollData = null;
                                    }
                                }

                                // Helper to parse Contact data safely
                                let contactData: any = null;
                                if (m.type === 'contact') {
                                    try {
                                        contactData = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
                                    } catch (e) {
                                        contactData = null;
                                    }
                                }

                                return (
                                    <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
                                        <div className={`max-w-[75%] p-4 rounded-3xl relative shadow-md transition-all ${isOwn ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none' : 'bg-gray-900 border border-gray-800/80 text-gray-100 rounded-tl-none'}`}>
                                            
                                            {/* Sender Username in Groups */}
                                            {!isOwn && selectedChat.type === 'group' && (
                                                <p className="text-xs font-bold text-indigo-400 mb-1">{m.username || `User #${m.sender_id}`}</p>
                                            )}

                                            {/* Message Content Renderers */}
                                            {m.type === 'image' ? (
                                                <div className="space-y-2">
                                                    <img src={m.content} alt="Media" className="rounded-xl max-h-72 object-cover w-full cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(m.content, '_blank')} />
                                                </div>
                                            ) : m.type === 'video' ? (
                                                <video src={m.content} controls className="rounded-xl max-h-72 w-full" />
                                            ) : m.type === 'audio' ? (
                                                <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl">
                                                    <button
                                                        onClick={() => setPlayingAudioId(playingAudioId === m.id ? null : m.id)}
                                                        className="p-3 bg-blue-500 rounded-full text-white hover:scale-105 transition-transform"
                                                    >
                                                        {playingAudioId === m.id ? <Pause size={18} /> : <Play size={18} />}
                                                    </button>
                                                    <audio src={m.content} className="w-full h-8" controls />
                                                </div>
                                            ) : m.type === 'document' ? (
                                                <a href={m.content} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/20 hover:bg-black/30 rounded-xl transition-colors">
                                                    <FileText size={28} className="text-blue-400" />
                                                    <div className="flex-1 truncate">
                                                        <p className="text-sm font-semibold truncate">{m.content.split('/').pop() || 'Document'}</p>
                                                        <p className="text-[10px] text-gray-300">Click to view file</p>
                                                    </div>
                                                    <Download size={18} className="text-gray-300" />
                                                </a>
                                            ) : m.type === 'poll' && pollData ? (
                                                <div className="space-y-3 min-w-[240px]">
                                                    <div className="flex items-center gap-2 font-bold text-sm text-gray-100">
                                                        <BarChart2 size={18} className="text-amber-400" />
                                                        <span>{pollData.question}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {pollData.options?.map((opt: any) => {
                                                            const totalVotes = pollData.options.reduce((acc: number, cur: any) => acc + (cur.voters?.length || 0), 0);
                                                            const optVotes = opt.voters?.length || 0;
                                                            const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                                            const hasVoted = opt.voters?.includes(user.id);

                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => handlePollVote(m.id, opt.id)}
                                                                    className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all ${hasVoted ? 'border-amber-400 bg-amber-500/10' : 'border-gray-700/60 hover:border-gray-500 bg-black/20'}`}
                                                                >
                                                                    <div className="absolute top-0 left-0 bottom-0 bg-amber-500/20 transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                                                    <div className="relative z-10 flex justify-between items-center text-xs">
                                                                        <span className="font-semibold">{opt.text}</span>
                                                                        <span className="font-bold text-gray-300">{pct}% ({optVotes})</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : m.type === 'contact' && contactData ? (
                                                <div className="p-3 bg-black/20 rounded-xl space-y-2 min-w-[200px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">
                                                            <UserCheck size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{contactData.username}</p>
                                                            <p className="text-xs text-gray-400">{contactData.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                            )}

                                            {/* Reactions Display */}
                                            {m.reactions && m.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {m.reactions.map((r, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => !isOwn && handleToggleReaction(m.id, r.emoji)}
                                                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${r.user_ids.includes(user.id) ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-black/30 border-gray-700 text-gray-300'}`}
                                                        >
                                                            <span>{r.emoji}</span>
                                                            <span className="font-bold text-[10px]">{r.count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Timestamp & Reaction Trigger */}
                                            <div className="flex items-center justify-between gap-3 mt-2">
                                                <span className="text-[10px] text-gray-400 opacity-70">
                                                    {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {!isOwn && (
                                                    <button
                                                        onClick={() => setActiveReactionMsgId(activeReactionMsgId === m.id ? null : m.id)}
                                                        className="text-gray-400 hover:text-amber-400 transition-colors p-1"
                                                        title="React to message"
                                                    >
                                                        <Smile size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reaction Picker Window (Dismisses when clicking outside) */}
                                            {!isOwn && activeReactionMsgId === m.id && (
                                                <div
                                                    ref={reactionPickerRef}
                                                    className="absolute -top-12 left-0 z-40 bg-gray-900 border border-gray-700/80 rounded-2xl p-2 shadow-2xl flex gap-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                                                >
                                                    {REACTION_EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleToggleReaction(m.id, emoji)}
                                                            className="text-lg hover:scale-125 transition-transform p-1 hover:bg-gray-800 rounded-xl"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 px-6 border-t border-gray-800/80 bg-gray-900/40 backdrop-blur-xl relative">
                            {/* Telegram / WhatsApp Style Attachment Grid Drawer */}
                            {showAttachmentMenu && (
                                <div
                                    ref={attachmentMenuRef}
                                    className="absolute bottom-20 left-6 z-40 bg-gray-900/95 border border-gray-800 rounded-3xl p-4 shadow-2xl grid grid-cols-3 gap-4 w-72 backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-200"
                                >
                                    <button
                                        onClick={() => docInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <FileText size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Document</span>
                                    </button>

                                    <button
                                        onClick={() => mediaInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <ImageIcon size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Media</span>
                                    </button>

                                    <button
                                        onClick={startCamera}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <Camera size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Camera</span>
                                    </button>

                                    <button
                                        onClick={() => audioInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <Music size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Audio</span>
                                    </button>

                                    <button
                                        onClick={() => { setShowPollModal(true); setShowAttachmentMenu(false); }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-yellow-500/10 hover:border-yellow-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-yellow-600/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <BarChart2 size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Poll</span>
                                    </button>

                                    <button
                                        onClick={() => { setShowContactModal(true); setShowAttachmentMenu(false); }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                            <UserCheck size={22} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-300">Contact</span>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                                    className={`p-3 rounded-2xl transition-all ${showAttachmentMenu ? 'bg-blue-600 text-white rotate-45' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
                                >
                                    <Plus size={22} />
                                </button>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="flex-1 px-5 py-3 rounded-2xl bg-gray-900 border border-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                    placeholder="Type a message..."
                                />
                                <button
                                    type="submit"
                                    className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-900/60 rounded-3xl flex items-center justify-center mb-6 border border-gray-800/80 shadow-2xl">
                            <MessageSquare size={44} className="text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-200 mb-2">Welcome to Orion Chat</h3>
                        <p className="max-w-xs leading-relaxed text-xs text-gray-400">Select a contact or group room from the left sidebar to start messaging.</p>
                    </div>
                )}
            </div>

            {/* Poll Creation Modal */}
            {showPollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><BarChart2 className="text-yellow-400" /> Create Poll</h3>
                            <button onClick={() => setShowPollModal(false)} className="p-1 hover:text-rose-400"><X size={20} /></button>
                        </div>
                        <input
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ask a question..."
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                        />
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Options</p>
                            {pollOptions.map((opt, idx) => (
                                <input
                                    key={idx}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder={`Option ${idx + 1}`}
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...pollOptions];
                                        newOpts[idx] = e.target.value;
                                        setPollOptions(newOpts);
                                    }}
                                />
                            ))}
                            {pollOptions.length < 5 && (
                                <button
                                    onClick={() => setPollOptions([...pollOptions, ''])}
                                    className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-1 mt-1"
                                >
                                    <Plus size={14} /> Add Option
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleCreatePoll}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 rounded-2xl font-bold transition-all shadow-md"
                        >
                            Send Poll
                        </button>
                    </div>
                </div>
            )}

            {/* Contact Sharing Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="text-cyan-400" /> Share Contact</h3>
                            <button onClick={() => setShowContactModal(false)} className="p-1 hover:text-rose-400"><X size={20} /></button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {users.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleShareContact(u)}
                                    className="w-full p-3 rounded-2xl bg-gray-950 hover:bg-gray-800 flex items-center justify-between transition-colors border border-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 rounded-full flex items-center justify-center font-bold">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-sm">{u.username}</p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-xl font-semibold">Share</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Camera WebCam Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Camera className="text-emerald-400" /> Camera Snapshot</h3>
                            <button onClick={stopCamera} className="p-1 hover:text-rose-400"><X size={20} /></button>
                        </div>
                        <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        </div>
                        <button
                            onClick={capturePhoto}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <Camera size={20} /> Snap Photo & Send
                        </button>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateGroupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl overflow-hidden p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">New Group</h3>
                            <button onClick={() => setIsCreateGroupOpen(false)} className="p-2 hover:text-rose-400"><X size={20} /></button>
                        </div>
                        <input
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                        />
                        <button
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 rounded-2xl font-bold transition-all shadow-md"
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
