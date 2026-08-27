import React, { useState, useEffect, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import type { User, Message } from '../hooks/useSocket';
import { useSocket } from '../hooks/useSocket';
import { API_URL } from '../lib/config';
import {
    LogOut, Users, MessageSquare, Settings, Send, Plus, X,
    FileText, Image as ImageIcon, Camera, Music, BarChart2, UserCheck,
    Download, Play, Pause, Smile, Search, MoreVertical, Paperclip,
    Mic, Check, CheckCheck
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
    const [searchQuery, setSearchQuery] = useState('');

    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    
    const [showContactModal, setShowContactModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

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

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user || !token) return;
        const fetchData = async () => {
            try {
                const [usersRes, chatsRes] = await Promise.all([
                    fetch(`${API_URL}/auth/users?currentUserId=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/chats?userId=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (usersRes.ok) setUsers(await usersRes.json());
                if (chatsRes.ok) setChats(await chatsRes.json());
            } catch (err) {
                console.error('Failed to fetch initial data', err);
            }
        };
        fetchData();
    }, [user, token, setUsers, setChats]);

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
        return () => leaveRoom(selectedChat.id);
    }, [selectedChat, token, setMessages, joinRoom, leaveRoom]);

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
        sendMessage({ chatId: selectedChat.id, senderId: user.id, content: messageInput });
        setMessageInput('');
    };

    const handleFileUpload = async (file: File) => {
        if (!selectedChat || !user || !token) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);

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
            } else {
                alert("Upload failed. Please try again.");
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            alert("Error uploading file.");
        } finally {
            setUploading(false);
            setShowAttachmentMenu(false);
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
        e.target.value = ''; // Reset input to allow selecting the same file again
    };

    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!token || !user) return;
        const targetMsg = messages.find(m => m.id === messageId);
        if (targetMsg && targetMsg.sender_id === user.id) {
            setActiveReactionMsgId(null);
            return; 
        }
        try {
            await fetch(`${API_URL}/chats/messages/${messageId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id, emoji })
            });
        } catch (err) {
            console.error('Error toggling reaction:', err);
        }
        setActiveReactionMsgId(null);
    };

    const handlePollVote = async (messageId: number, optionId: string) => {
        if (!token || !user) return;
        try {
            await fetch(`${API_URL}/chats/messages/${messageId}/poll/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id, optionId })
            });
        } catch (err) {}
    };

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
        sendMessage({ chatId: selectedChat.id, senderId: user.id, content: JSON.stringify(pollData), type: 'poll' });
        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowAttachmentMenu(false);
    };

    const handleShareContact = (contactUser: User) => {
        if (!selectedChat || !user) return;
        const contactData = { id: contactUser.id, username: contactUser.username, email: contactUser.email };
        sendMessage({ chatId: selectedChat.id, senderId: user.id, content: JSON.stringify(contactData), type: 'contact' });
        setShowContactModal(false);
        setShowAttachmentMenu(false);
    };

    const startCamera = async () => {
        setShowCameraModal(true);
        setShowAttachmentMenu(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {}
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
        stopCamera();
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
                <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
        );
    }

    const filteredChats = chats.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-screen bg-[var(--wa-bg-default)] text-[var(--wa-text-primary)] font-sans overflow-hidden">
            <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt,.zip" onChange={onFileInputChange} />
            <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={onFileInputChange} />
            <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={onFileInputChange} />

            {/* Left Sidebar */}
            <div className="w-[30%] min-w-[300px] max-w-[400px] flex flex-col bg-[var(--wa-sidebar)] border-r border-[var(--wa-border)]">
                {/* Header */}
                <div className="h-[59px] px-4 py-2.5 bg-[var(--wa-bg-default)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                            {user.username[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[var(--wa-text-secondary)]">
                        <Users size={20} className="cursor-pointer hover:opacity-80" onClick={() => setActiveTab('users')} />
                        <MessageSquare size={20} className="cursor-pointer hover:opacity-80" onClick={() => setActiveTab('groups')} />
                        <MoreVertical size={20} className="cursor-pointer hover:opacity-80" />
                        <LogOut size={20} className="cursor-pointer hover:opacity-80" onClick={handleLogout} />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-2 border-b border-[var(--wa-border)] bg-[var(--wa-sidebar)] flex items-center h-[50px]">
                    <div className="bg-[var(--wa-bg-default)] rounded-lg flex items-center px-3 h-[35px] w-full">
                        <Search size={18} className="text-[var(--wa-text-secondary)] mr-3" />
                        <input
                            type="text"
                            placeholder={activeTab === 'users' ? "Search or start new chat" : "Search chats"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-sm text-[var(--wa-text-primary)] placeholder-[var(--wa-text-secondary)]"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto bg-[var(--wa-sidebar)]">
                    {activeTab === 'users' ? (
                        filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_URL}/chats`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                            body: JSON.stringify({ userId: user.id, otherUserId: u.id, type: 'private' })
                                        });
                                        if (res.ok) {
                                            const chat = await res.json();
                                            setSelectedChat({ id: chat.id, type: 'private', name: u.username });
                                            const chatsRes = await fetch(`${API_URL}/chats?userId=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                            if (chatsRes.ok) setChats(await chatsRes.json());
                                        }
                                    } catch (err) {}
                                }}
                                className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[var(--wa-hover)] ${selectedChat?.name === u.username ? 'bg-[var(--wa-hover)]' : ''}`}
                            >
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold mr-3 relative shrink-0">
                                    {u.username[0].toUpperCase()}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${onlineUsers[u.id] === 'online' ? 'bg-[#00a884]' : 'bg-gray-400'}`}></div>
                                </div>
                                <div className="flex-1 border-b border-[var(--wa-border)] pb-3 pr-2 h-full flex flex-col justify-center">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[17px] font-normal">{u.username}</span>
                                    </div>
                                    <span className="text-sm text-[var(--wa-text-secondary)] capitalize">{onlineUsers[u.id] || 'offline'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="p-3 text-center border-b border-[var(--wa-border)]">
                                <button onClick={() => setIsCreateGroupOpen(true)} className="text-[#00a884] font-semibold text-sm hover:underline">
                                    + Create New Group
                                </button>
                            </div>
                            {filteredChats.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedChat({ id: c.id, type: c.type, name: c.name || 'Private Chat' })}
                                    className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[var(--wa-hover)] ${selectedChat?.id === c.id ? 'bg-[var(--wa-hover)]' : ''}`}
                                >
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0">
                                        {(c.name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 border-b border-[var(--wa-border)] pb-3 pr-2 h-full flex flex-col justify-center overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[17px] font-normal truncate">{c.name || 'Private Chat'}</span>
                                        </div>
                                        <span className="text-sm text-[var(--wa-text-secondary)] capitalize truncate">{c.type}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col relative w-full h-full bg-[var(--wa-bg-chat)] wa-bg-pattern">
                    {/* Header */}
                    <div className="h-[59px] px-4 py-2.5 bg-[var(--wa-bg-default)] flex items-center justify-between shrink-0 shadow-sm z-10 relative border-l border-[var(--wa-border)]">
                        <div className="flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                {(selectedChat.name || 'C')[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h3 className="font-normal text-[16px] leading-5">{selectedChat.name}</h3>
                                <p className="text-[13px] text-[var(--wa-text-secondary)]">click here for contact info</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 text-[var(--wa-text-secondary)]">
                            <Search size={20} className="cursor-pointer" />
                            <MoreVertical size={20} className="cursor-pointer" />
                        </div>
                    </div>

                    {/* Message Feed */}
                    <div className="flex-1 overflow-y-auto px-[5%] py-4 space-y-2 relative z-10">
                        {messages.filter(m => m.chat_id === selectedChat.id).map((m, i) => {
                            const isOwn = m.sender_id === user.id;

                            let pollData: any = null;
                            if (m.type === 'poll') {
                                try { pollData = typeof m.content === 'string' ? JSON.parse(m.content) : m.content; } catch (e) {}
                            }

                            let contactData: any = null;
                            if (m.type === 'contact') {
                                try { contactData = typeof m.content === 'string' ? JSON.parse(m.content) : m.content; } catch (e) {}
                            }

                            return (
                                <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
                                    <div className={`max-w-[65%] px-2.5 py-1.5 rounded-lg relative shadow-sm ${isOwn ? 'bg-[var(--wa-outgoing)] rounded-tr-none' : 'bg-[var(--wa-incoming)] rounded-tl-none'} text-[14.2px] text-[var(--wa-text-primary)]`}>
                                        
                                        {!isOwn && selectedChat.type === 'group' && (
                                            <p className="text-[12.5px] font-medium text-[#00a884] mb-0.5">{m.username || `User`}</p>
                                        )}

                                        <div className="mb-[15px]">
                                            {m.type === 'image' ? (
                                                <img src={m.content} alt="Media" className="rounded-md max-h-72 object-cover cursor-pointer hover:opacity-95 mt-1" onClick={() => window.open(m.content, '_blank')} />
                                            ) : m.type === 'video' ? (
                                                <video src={m.content} controls className="rounded-md max-h-72 mt-1" />
                                            ) : m.type === 'audio' ? (
                                                <div className="flex items-center gap-3 p-1 rounded-md min-w-[200px]">
                                                    <button onClick={() => setPlayingAudioId(playingAudioId === m.id ? null : m.id)} className="text-[var(--wa-text-secondary)]">
                                                        {playingAudioId === m.id ? <Pause size={24} /> : <Play size={24} />}
                                                    </button>
                                                    <audio src={m.content} className="w-full h-8" controls />
                                                </div>
                                            ) : m.type === 'document' ? (
                                                <a href={m.content} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-black/5 rounded-md mt-1">
                                                    <FileText size={24} className="text-[var(--wa-text-secondary)]" />
                                                    <div className="flex-1 truncate max-w-[200px]">
                                                        <p className="text-sm font-normal truncate">{m.content.split('/').pop() || 'Document'}</p>
                                                    </div>
                                                    <Download size={20} className="text-[var(--wa-text-secondary)]" />
                                                </a>
                                            ) : m.type === 'poll' && pollData ? (
                                                <div className="space-y-2 min-w-[240px] mt-1">
                                                    <div className="font-medium">{pollData.question}</div>
                                                    <div className="space-y-1">
                                                        {pollData.options?.map((opt: any) => {
                                                            const totalVotes = pollData.options.reduce((acc: number, cur: any) => acc + (cur.voters?.length || 0), 0);
                                                            const optVotes = opt.voters?.length || 0;
                                                            const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                                            const hasVoted = opt.voters?.includes(user.id);
                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => handlePollVote(m.id, opt.id)}
                                                                    className={`w-full text-left px-2 py-1.5 rounded-md relative overflow-hidden text-sm bg-black/5 ${hasVoted ? 'bg-[#00a884]/20' : ''}`}
                                                                >
                                                                    <div className="absolute top-0 left-0 bottom-0 bg-[#00a884]/30 transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                                                    <div className="relative z-10 flex justify-between items-center">
                                                                        <span>{opt.text}</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : m.type === 'contact' && contactData ? (
                                                <div className="p-2 border-b border-[var(--wa-border)] mt-1 min-w-[200px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold text-white">
                                                            {contactData.username[0].toUpperCase()}
                                                        </div>
                                                        <p className="font-normal text-[15px]">{contactData.username}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="whitespace-pre-wrap break-words">{m.content}</span>
                                            )}
                                        </div>

                                        {/* Reactions display */}
                                        {m.reactions && m.reactions.length > 0 && (
                                            <div className="absolute -bottom-2 left-2 flex bg-white dark:bg-gray-800 rounded-full border border-[var(--wa-border)] shadow-sm px-1 py-0.5 z-10">
                                                {m.reactions.map((r, idx) => (
                                                    <span key={idx} className="text-xs flex items-center px-0.5">
                                                        {r.emoji} <span className="text-[10px] ml-0.5 text-gray-500">{r.count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="float-right -mb-1 mt-1 ml-3 flex items-center gap-1 text-[11px] text-[var(--wa-text-secondary)]">
                                            <span>{new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isOwn && <CheckCheck size={14} className="text-[#53bdeb]" />}
                                        </div>

                                        {!isOwn && (
                                            <button
                                                onClick={() => setActiveReactionMsgId(activeReactionMsgId === m.id ? null : m.id)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[var(--wa-text-secondary)] bg-white/80 rounded-full p-1 shadow-sm"
                                            >
                                                <Smile size={16} />
                                            </button>
                                        )}

                                        {!isOwn && activeReactionMsgId === m.id && (
                                            <div ref={reactionPickerRef} className="absolute -top-10 left-0 z-40 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg flex gap-1 animate-in zoom-in-95">
                                                {REACTION_EMOJIS.map((emoji) => (
                                                    <button key={emoji} onClick={() => handleToggleReaction(m.id, emoji)} className="text-lg hover:scale-125 transition-transform px-1">
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {uploading && (
                            <div className="flex justify-end">
                                <div className="bg-[var(--wa-outgoing)] text-[var(--wa-text-primary)] px-3 py-2 rounded-lg text-[14.2px] shadow-sm">
                                    <span className="animate-pulse">Uploading attachment...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="px-4 py-2.5 bg-[var(--wa-bg-default)] flex items-end gap-2 shrink-0 relative z-20 border-l border-[var(--wa-border)] min-h-[62px]">
                        {showAttachmentMenu && (
                            <div ref={attachmentMenuRef} className="absolute bottom-16 left-4 z-40 bg-[var(--wa-sidebar)] rounded-2xl shadow-xl border border-[var(--wa-border)] p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-2 w-64">
                                <button onClick={() => docInputRef.current?.click()} className="flex items-center gap-3 hover:bg-[var(--wa-hover)] p-2 rounded-lg text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center"><FileText size={20} /></div> Document
                                </button>
                                <button onClick={() => mediaInputRef.current?.click()} className="flex items-center gap-3 hover:bg-[var(--wa-hover)] p-2 rounded-lg text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center"><ImageIcon size={20} /></div> Photos & Videos
                                </button>
                                <button onClick={startCamera} className="flex items-center gap-3 hover:bg-[var(--wa-hover)] p-2 rounded-lg text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center"><Camera size={20} /></div> Camera
                                </button>
                                <button onClick={() => { setShowContactModal(true); setShowAttachmentMenu(false); }} className="flex items-center gap-3 hover:bg-[var(--wa-hover)] p-2 rounded-lg text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center"><UserCheck size={20} /></div> Contact
                                </button>
                                <button onClick={() => { setShowPollModal(true); setShowAttachmentMenu(false); }} className="flex items-center gap-3 hover:bg-[var(--wa-hover)] p-2 rounded-lg text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center"><BarChart2 size={20} /></div> Poll
                                </button>
                            </div>
                        )}

                        <div className="flex gap-4 items-center text-[var(--wa-text-secondary)] mb-2.5 ml-2 shrink-0">
                            <Smile size={26} className="cursor-pointer hover:text-[var(--wa-text-primary)]" />
                            <Paperclip size={24} className={`cursor-pointer transition-transform ${showAttachmentMenu ? 'rotate-45 text-[var(--wa-text-primary)]' : 'hover:text-[var(--wa-text-primary)]'}`} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} />
                        </div>

                        <form onSubmit={handleSendMessage} className="flex-1 ml-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                className="w-full bg-white dark:bg-[#2a3942] border-none outline-none px-4 py-[9px] rounded-lg text-[15px] placeholder-[var(--wa-text-secondary)] mb-1 shadow-sm"
                                placeholder="Type a message"
                            />
                        </form>

                        <div className="mb-2.5 mr-2 ml-2 shrink-0">
                            {messageInput.trim() ? (
                                <button onClick={handleSendMessage} className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-primary)]">
                                    <Send size={24} />
                                </button>
                            ) : (
                                <button className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]">
                                    <Mic size={24} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-[var(--wa-bg-default)] border-b-[6px] border-[#00a884]">
                    <div className="mb-8 opacity-20 dark:opacity-40 text-[var(--wa-text-primary)]">
                        {/* Placeholder graphic for empty state */}
                        <MessageSquare size={120} />
                    </div>
                    <h2 className="text-[32px] font-light text-[var(--wa-text-primary)] mb-4">Orion Web</h2>
                    <p className="text-[14px] text-[var(--wa-text-secondary)] max-w-[460px] leading-6">
                        Send and receive messages without keeping your phone online.<br/>
                        Use Orion on up to 4 linked devices and 1 phone at the same time.
                    </p>
                </div>
            )}

            {/* Modals */}
            {/* Poll Modal */}
            {showPollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)]">
                            <h3 className="text-xl font-medium">Create Poll</h3>
                            <button onClick={() => setShowPollModal(false)}><X size={24} /></button>
                        </div>
                        <input className="w-full bg-[var(--wa-bg-default)] border-none rounded-lg p-3 text-[15px] outline-none mb-4 text-[var(--wa-text-primary)]" placeholder="Ask a question" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                        <div className="space-y-3 mb-6">
                            {pollOptions.map((opt, i) => (
                                <input key={i} className="w-full bg-[var(--wa-bg-default)] border-none rounded-lg p-3 text-[15px] outline-none text-[var(--wa-text-primary)]" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                    const newOpts = [...pollOptions];
                                    newOpts[i] = e.target.value;
                                    setPollOptions(newOpts);
                                }} />
                            ))}
                            {pollOptions.length < 5 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[#00a884] font-medium text-sm mt-2">+ Add Option</button>}
                        </div>
                        <button onClick={handleCreatePoll} className="w-full py-3 bg-[#00a884] hover:bg-[#017561] text-white rounded-lg font-medium shadow-sm">Send</button>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)]">
                            <h3 className="text-xl font-medium">Send Contact</h3>
                            <button onClick={() => setShowContactModal(false)}><X size={24} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {users.map(u => (
                                <button key={u.id} onClick={() => handleShareContact(u)} className="w-full flex items-center gap-4 p-3 hover:bg-[var(--wa-hover)] border-b border-[var(--wa-border)] text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">{u.username[0].toUpperCase()}</div>
                                    <span className="font-medium text-[16px]">{u.username}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
                    <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden relative">
                        <button onClick={stopCamera} className="absolute top-4 right-4 text-white z-10 bg-black/50 p-2 rounded-full"><X size={24} /></button>
                        <video ref={videoRef} autoPlay playsInline className="w-full bg-black"></video>
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                            <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-colors"></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
