import React, { useState, useEffect, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import type { User, Message } from '../hooks/useSocket';
import { useSocket } from '../hooks/useSocket';
import { API_URL } from '../lib/config';
import {
    LogOut, Users, MessageSquare, Send, X, Check,
    FileText, Image as ImageIcon, Camera, BarChart2, UserCheck,
    Download, Play, Pause, Smile, Search, MoreVertical, Paperclip,
    Mic, CheckCheck, ChevronDown, Trash2, Forward, Sun, Moon, User as UserIcon, BellOff, Settings
} from 'lucide-react';

interface ChatPageProps {
    onBackToHome?: () => void;
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const EMOJI_CATEGORIES = [
    { category: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'] },
    { category: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🖐️', '🖐'] },
    { category: 'Hearts & Expressions', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨'] },
    { category: 'Celebration & Symbols', emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '🌟', '💥', '💯', '✅', '❌', '⚠️', '⚡', '💡', '🎵', '🎶', '📌', '📍', '💬', '📢'] }
];

const ChatPage: React.FC<ChatPageProps> = ({ onBackToHome }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    const [selectedChat, setSelectedChat] = useState<{ id: number; type: 'private' | 'group', name: string } | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState<number | null>(null);
    const [activeMsgMenu, setActiveMsgMenu] = useState<number | null>(null);
    const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
    const [uploading, setUploading] = useState(false);

    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    
    const [showContactModal, setShowContactModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMainDropdown, setShowMainDropdown] = useState(false);
    const [showContactDrawer, setShowContactDrawer] = useState(false);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [userStatusBio, setUserStatusBio] = useState('Hey there! I am using Orion.');
    const [isMuted, setIsMuted] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);
    const msgMenuRef = useRef<HTMLDivElement>(null);
    const mainDropdownRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const {
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

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDarkMode(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setActiveReactionMsgId(null);
            }
            if (msgMenuRef.current && !msgMenuRef.current.contains(event.target as Node)) {
                setActiveMsgMenu(null);
            }
            if (mainDropdownRef.current && !mainDropdownRef.current.contains(event.target as Node)) {
                setShowMainDropdown(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateGroup = async () => {
        if (!groupName.trim() || !user || !token) return;
        try {
            const res = await fetch(`${API_URL}/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id, name: groupName.trim(), type: 'group', memberIds: selectedGroupMembers })
            });
            if (res.ok) {
                const newGroup = await res.json();
                setSelectedChat({ id: newGroup.id, type: 'group', name: newGroup.name });
                const chatsRes = await fetch(`${API_URL}/chats?userId=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (chatsRes.ok) setChats(await chatsRes.json());
                setIsCreateGroupOpen(false);
                setGroupName('');
                setSelectedGroupMembers([]);
            }
        } catch (err) {
            console.error('Failed to create group', err);
        }
    };

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
                const response = await fetch(`${API_URL}/chats/${selectedChat.id}/messages?userId=${user?.id}`, {
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
        if (onBackToHome) onBackToHome();
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

    const handleDeleteForEveryone = async (messageId: number) => {
        if (!token || !user) return;
        try {
            const res = await fetch(`${API_URL}/chats/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
        } catch (err) {}
        setActiveMsgMenu(null);
    };

    const handleDeleteForMe = async (messageId: number) => {
        if (!token || !user) return;
        try {
            const res = await fetch(`${API_URL}/chats/messages/${messageId}/delete-for-me`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id })
            });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            }
        } catch (err) {}
        setActiveMsgMenu(null);
    };

    const handleForward = (chatId: number) => {
        if (!forwardMsg || !user) return;
        sendMessage({
            chatId: chatId,
            senderId: user.id,
            content: forwardMsg.content,
            type: forwardMsg.type
        });
        setForwardMsg(null);
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
                        <div className="w-10 h-10 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold cursor-pointer">
                            {user.username[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[var(--wa-text-secondary)]">
                        <Users size={20} className="cursor-pointer hover:opacity-80" onClick={() => setActiveTab('users')} />
                        <MessageSquare size={20} className="cursor-pointer hover:opacity-80" onClick={() => setActiveTab('groups')} />
                        <div className="relative">
                            <MoreVertical
                                size={20}
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => setShowMainDropdown(!showMainDropdown)}
                            />
                            {showMainDropdown && (
                                <div ref={mainDropdownRef} className="absolute top-8 right-0 w-52 bg-[var(--wa-sidebar)] rounded-lg shadow-xl border border-[var(--wa-border)] py-2 z-50 animate-in fade-in zoom-in-95">
                                    <button onClick={() => { setShowProfileModal(true); setShowMainDropdown(false); }} className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--wa-hover)] text-sm text-[var(--wa-text-primary)]">
                                        <UserIcon size={18} /> Profile & Bio
                                    </button>
                                    <button onClick={() => { toggleDarkMode(); setShowMainDropdown(false); }} className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--wa-hover)] text-sm text-[var(--wa-text-primary)]">
                                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                    </button>
                                    <button onClick={() => { setShowSettingsModal(true); setShowMainDropdown(false); }} className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--wa-hover)] text-sm text-[var(--wa-text-primary)]">
                                        <Settings size={18} /> Settings
                                    </button>
                                    <div className="border-t border-[var(--wa-border)] my-1"></div>
                                    <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-[var(--wa-hover)] text-sm text-red-500 font-medium">
                                        <LogOut size={18} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
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
                                <div className="w-12 h-12 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold mr-3 relative shrink-0">
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
                                    <div className="w-12 h-12 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold mr-3 shrink-0">
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
                <div className="flex-1 flex flex-row h-full overflow-hidden">
                    {/* Active Chat Column */}
                    <div className="flex-1 flex flex-col relative w-full h-full bg-[var(--wa-bg-chat)] wa-bg-pattern border-r border-[var(--wa-border)]">
                        {/* Header */}
                        <div className="h-[59px] px-4 py-2.5 bg-[var(--wa-bg-default)] flex items-center justify-between shrink-0 shadow-sm z-10 relative border-l border-[var(--wa-border)]">
                            <div
                                onClick={() => setShowContactDrawer(!showContactDrawer)}
                                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                <div className="w-10 h-10 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold shrink-0">
                                    {(selectedChat.name || 'C')[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-normal text-[16px] leading-5">{selectedChat.name}</h3>
                                    <p className="text-[13px] text-[var(--wa-primary)] font-medium hover:underline">click here for contact info</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 text-[var(--wa-text-secondary)]">
                                <Search size={20} className="cursor-pointer" />
                                <MoreVertical size={20} className="cursor-pointer hover:opacity-80" onClick={() => setShowContactDrawer(!showContactDrawer)} />
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
                                    <div key={m.id || i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-1`}>
                                        <div
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setActiveReactionMsgId(activeReactionMsgId === m.id ? null : m.id);
                                            }}
                                            className={`relative max-w-[65%] px-3 py-1.5 rounded-lg text-[14.2px] leading-[19px] shadow-sm group cursor-pointer ${
                                                isOwn ? 'bg-[var(--wa-outgoing)] text-[var(--wa-text-primary)] rounded-tr-none' : 'bg-[var(--wa-incoming)] text-[var(--wa-text-primary)] rounded-tl-none'
                                            }`}
                                        >
                                            {/* Message dropdown menu button */}
                                            <button
                                                onClick={() => setActiveMsgMenu(activeMsgMenu === m.id ? null : m.id)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[var(--wa-text-secondary)] p-0.5 rounded hover:bg-black/10 transition-opacity z-10"
                                            >
                                                <ChevronDown size={14} />
                                            </button>

                                            {/* Message context menu */}
                                            {activeMsgMenu === m.id && (
                                                <div ref={msgMenuRef} className="absolute right-0 top-6 z-50 bg-[var(--wa-sidebar)] rounded-lg shadow-lg border border-[var(--wa-border)] py-1 text-xs w-36 animate-in fade-in">
                                                    <button onClick={() => { setForwardMsg(m); setActiveMsgMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-[var(--wa-hover)] flex items-center gap-2 text-[var(--wa-text-primary)]">
                                                        <Forward size={12} /> Forward
                                                    </button>
                                                    <button onClick={() => handleDeleteForMe(m.id)} className="w-full text-left px-3 py-1.5 hover:bg-[var(--wa-hover)] flex items-center gap-2 text-red-500">
                                                        <Trash2 size={12} /> Delete for me
                                                    </button>
                                                    {isOwn && (
                                                        <button onClick={() => handleDeleteForEveryone(m.id)} className="w-full text-left px-3 py-1.5 hover:bg-[var(--wa-hover)] flex items-center gap-2 text-red-500">
                                                            <Trash2 size={12} /> Delete for all
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reaction picker overlay */}
                                            {activeReactionMsgId === m.id && (
                                                <div ref={reactionPickerRef} className="absolute -top-10 left-0 z-40 flex bg-[var(--wa-sidebar)] rounded-full border border-[var(--wa-border)] shadow-lg px-2 py-1 gap-1 animate-in fade-in">
                                                    {REACTION_EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleToggleReaction(m.id, emoji)}
                                                            className="hover:scale-125 transition-transform text-base px-1"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Message content types */}
                                            <div className="pr-3">
                                                {m.type === 'image' ? (
                                                    <div className="mb-1 rounded overflow-hidden max-w-[280px]">
                                                        <img src={m.content} alt="Attachment" className="w-full object-cover max-h-[250px]" />
                                                    </div>
                                                ) : m.type === 'video' ? (
                                                    <div className="mb-1 rounded overflow-hidden max-w-[280px]">
                                                        <video src={m.content} controls className="w-full max-h-[250px]" />
                                                    </div>
                                                ) : m.type === 'audio' ? (
                                                    <div className="flex items-center gap-2 py-1 min-w-[200px]">
                                                        <button
                                                            onClick={() => setPlayingAudioId(playingAudioId === m.id ? null : m.id)}
                                                            className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0"
                                                        >
                                                            {playingAudioId === m.id ? <Pause size={16} /> : <Play size={16} />}
                                                        </button>
                                                        <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                            <div className={`h-full bg-[#00a884] ${playingAudioId === m.id ? 'w-3/4 transition-all duration-1000' : 'w-0'}`}></div>
                                                        </div>
                                                        <audio src={m.content} id={`audio-${m.id}`} onEnded={() => setPlayingAudioId(null)} />
                                                    </div>
                                                ) : m.type === 'document' ? (
                                                    <div className="flex items-center gap-3 p-2 bg-black/5 rounded-lg my-1">
                                                        <FileText size={24} className="text-[#00a884]" />
                                                        <div className="flex-1 truncate text-xs">
                                                            <p className="font-medium truncate">{m.content.split('/').pop() || 'Document'}</p>
                                                        </div>
                                                        <a href={m.content} download target="_blank" rel="noreferrer" className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]">
                                                            <Download size={16} />
                                                        </a>
                                                    </div>
                                                ) : m.type === 'poll' && pollData ? (
                                                    <div className="p-2 border-b border-[var(--wa-border)] mt-1 min-w-[220px]">
                                                        <p className="font-medium text-[15px] mb-2">{pollData.question}</p>
                                                        <div className="space-y-1.5">
                                                            {pollData.options.map((opt: any) => {
                                                                const totalVotes = pollData.options.reduce((sum: number, o: any) => sum + (o.voters?.length || 0), 0);
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
                                                            <div className="w-10 h-10 bg-[var(--wa-border)] rounded-full flex items-center justify-center font-bold text-[var(--wa-text-primary)]">
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
                                                <div className="absolute -bottom-2 left-2 flex bg-[var(--wa-sidebar)] rounded-full border border-[var(--wa-border)] shadow-sm px-1 py-0.5 z-10">
                                                    {m.reactions.map((r, idx) => (
                                                        <span key={idx} className="text-xs flex items-center px-0.5">
                                                            {r.emoji} <span className="text-[10px] ml-0.5 text-[var(--wa-text-secondary)]">{r.count}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="float-right -mb-1 mt-1 ml-3 flex items-center gap-1 text-[11px] text-[var(--wa-text-secondary)]">
                                                <span>{new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isOwn && <CheckCheck size={14} className="text-[#53bdeb]" />}
                                            </div>
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

                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-40 bg-[var(--wa-sidebar)] rounded-2xl shadow-2xl border border-[var(--wa-border)] p-3 w-80 max-h-72 overflow-y-auto animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center pb-2 border-b border-[var(--wa-border)] mb-2">
                                        <span className="text-xs font-semibold text-[var(--wa-text-secondary)] uppercase">Pick an Emoji</span>
                                        <button onClick={() => setShowEmojiPicker(false)} className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {EMOJI_CATEGORIES.map((cat, idx) => (
                                        <div key={idx} className="mb-3">
                                            <div className="text-[11px] font-medium text-[var(--wa-text-secondary)] mb-1 px-1">{cat.category}</div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {cat.emojis.map((emoji, eIdx) => (
                                                    <button
                                                        key={eIdx}
                                                        type="button"
                                                        onClick={() => {
                                                            setMessageInput(prev => prev + emoji);
                                                        }}
                                                        className="text-xl hover:bg-[var(--wa-hover)] p-1 rounded transition-transform hover:scale-125 flex items-center justify-center"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-4 items-center text-[var(--wa-text-secondary)] mb-2.5 ml-2 shrink-0">
                                <Smile
                                    size={26}
                                    className={`cursor-pointer transition-colors ${showEmojiPicker ? 'text-[var(--wa-primary)]' : 'hover:text-[var(--wa-text-primary)]'}`}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                />
                                <Paperclip size={24} className={`cursor-pointer transition-transform ${showAttachmentMenu ? 'rotate-45 text-[var(--wa-text-primary)]' : 'hover:text-[var(--wa-text-primary)]'}`} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} />
                            </div>

                            <form onSubmit={handleSendMessage} className="flex-1 ml-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="w-full bg-white dark:bg-[#2a3942] border-none outline-none px-4 py-[9px] rounded-lg text-[15px] placeholder-[var(--wa-text-secondary)] mb-1 shadow-sm text-[var(--wa-text-primary)]"
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

                    {/* Right Side Contact Info Drawer */}
                    {showContactDrawer && (
                        <div className="w-[340px] shrink-0 bg-[var(--wa-sidebar)] border-l border-[var(--wa-border)] flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-200">
                            <div className="h-[59px] px-4 bg-[var(--wa-bg-default)] flex items-center justify-between border-b border-[var(--wa-border)] shrink-0">
                                <h3 className="font-medium text-[16px]">Contact Info</h3>
                                <button onClick={() => setShowContactDrawer(false)} className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] p-1 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center p-6 border-b border-[var(--wa-border)] bg-[var(--wa-sidebar)]">
                                <div className="w-24 h-24 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] text-3xl font-bold mb-4 shadow-inner">
                                    {(selectedChat.name || 'C')[0].toUpperCase()}
                                </div>
                                <h2 className="text-xl font-medium text-[var(--wa-text-primary)]">{selectedChat.name}</h2>
                                <p className="text-sm text-[var(--wa-text-secondary)] mt-1 capitalize">
                                    {selectedChat.type === 'group' ? 'Group Chat' : (onlineUsers[selectedChat.id] || 'offline')}
                                </p>
                            </div>

                            <div className="p-4 border-b border-[var(--wa-border)] space-y-3">
                                <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--wa-text-secondary)]">About / Details</h4>
                                <p className="text-sm text-[var(--wa-text-primary)]">
                                    {selectedChat.type === 'group' ? 'Orion Group Conversation' : 'Hey there! I am using Orion.'}
                                </p>
                            </div>

                            {selectedChat.type === 'group' && (
                                <div className="p-4 border-b border-[var(--wa-border)] space-y-3">
                                    <h4 className="text-xs uppercase tracking-wider font-semibold text-[var(--wa-text-secondary)]">Group Members</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {users.map(m => (
                                            <div key={m.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[var(--wa-hover)]">
                                                <div className="w-8 h-8 bg-[var(--wa-border)] rounded-full flex items-center justify-center font-bold text-xs">
                                                    {m.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 text-sm font-medium text-[var(--wa-text-primary)] truncate">{m.username}</div>
                                                <span className={`w-2 h-2 rounded-full ${onlineUsers[m.id] === 'online' ? 'bg-[#00a884]' : 'bg-gray-400'}`}></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 space-y-2">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--wa-hover)] text-sm text-[var(--wa-text-primary)]"
                                >
                                    <BellOff size={18} />
                                    <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setMessages([]);
                                        setShowContactDrawer(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--wa-hover)] text-sm text-red-500"
                                >
                                    <Trash2 size={18} />
                                    <span>Clear Messages</span>
                                </button>
                            </div>
                        </div>
                    )}
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
                                    <div className="w-10 h-10 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold">{u.username[0].toUpperCase()}</div>
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

            {/* Forward Message Modal */}
            {forwardMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)]">
                            <h3 className="text-xl font-medium">Forward message to</h3>
                            <button onClick={() => setForwardMsg(null)}><X size={24} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {chats.map(c => (
                                <button key={c.id} onClick={() => handleForward(c.id)} className="w-full flex items-center gap-4 p-3 hover:bg-[var(--wa-hover)] border-b border-[var(--wa-border)] text-[var(--wa-text-primary)]">
                                    <div className="w-10 h-10 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] font-bold">{(c.name || 'C')[0].toUpperCase()}</div>
                                    <span className="font-medium text-[16px] truncate">{c.name || 'Private Chat'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreateGroupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)]">
                            <h3 className="text-xl font-medium">Create New Group</h3>
                            <button onClick={() => setIsCreateGroupOpen(false)}><X size={24} /></button>
                        </div>
                        <input
                            type="text"
                            className="w-full bg-[var(--wa-bg-default)] border border-[var(--wa-border)] rounded-lg p-3 text-[15px] outline-none mb-4 text-[var(--wa-text-primary)]"
                            placeholder="Enter Group Name"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                        />
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--wa-text-secondary)] mb-2">Select Group Members</p>
                        <div className="overflow-y-auto flex-1 space-y-2 mb-6 border border-[var(--wa-border)] rounded-lg p-2 max-h-48">
                            {users.map(u => {
                                const isSelected = selectedGroupMembers.includes(u.id);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedGroupMembers(prev => prev.filter(id => id !== u.id));
                                            } else {
                                                setSelectedGroupMembers(prev => [...prev, u.id]);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-[var(--wa-hover)] text-[var(--wa-text-primary)] ${isSelected ? 'bg-[#00a884]/15' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[var(--wa-border)] rounded-full flex items-center justify-center font-bold text-xs">{u.username[0].toUpperCase()}</div>
                                            <span className="font-medium text-sm">{u.username}</span>
                                        </div>
                                        {isSelected && <Check size={18} className="text-[#00a884]" />}
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim()}
                            className="w-full py-3 bg-[#00a884] hover:bg-[#017561] disabled:opacity-50 text-white rounded-lg font-medium shadow-sm transition-colors"
                        >
                            Create Group
                        </button>
                    </div>
                </div>
            )}

            {/* Profile & Bio Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)] border-b border-[var(--wa-border)] pb-3">
                            <h3 className="text-xl font-medium">Your Profile</h3>
                            <button onClick={() => setShowProfileModal(false)}><X size={24} /></button>
                        </div>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 bg-[var(--wa-border)] rounded-full flex items-center justify-center text-[var(--wa-text-primary)] text-3xl font-bold mb-3 shadow-inner">
                                {user?.username ? user.username[0].toUpperCase() : 'U'}
                            </div>
                            <h2 className="text-xl font-semibold text-[var(--wa-text-primary)]">{user?.username}</h2>
                            <p className="text-sm text-[var(--wa-text-secondary)]">{user?.email}</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--wa-text-secondary)] mb-1">About / Bio</label>
                                <input
                                    type="text"
                                    value={userStatusBio}
                                    onChange={e => setUserStatusBio(e.target.value)}
                                    className="w-full bg-[var(--wa-bg-default)] border border-[var(--wa-border)] rounded-lg p-3 text-[15px] outline-none text-[var(--wa-text-primary)]"
                                />
                            </div>
                        </div>
                        <button onClick={() => setShowProfileModal(false)} className="w-full py-2.5 bg-[#00a884] text-white rounded-lg font-medium">Save & Close</button>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-[var(--wa-sidebar)] w-full max-w-md rounded-lg shadow-xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-4 text-[var(--wa-text-primary)] border-b border-[var(--wa-border)] pb-3">
                            <h3 className="text-xl font-medium">Settings</h3>
                            <button onClick={() => setShowSettingsModal(false)}><X size={24} /></button>
                        </div>
                        <div className="space-y-4 mb-6 text-[var(--wa-text-primary)]">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--wa-bg-default)]">
                                <span className="font-medium text-sm">Theme Preference</span>
                                <button onClick={toggleDarkMode} className="px-3 py-1.5 bg-[#00a884] text-white text-xs font-semibold rounded-md">
                                    {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--wa-bg-default)]">
                                <span className="font-medium text-sm">Notifications</span>
                                <button onClick={() => setIsMuted(!isMuted)} className="px-3 py-1.5 border border-[var(--wa-border)] text-xs font-semibold rounded-md">
                                    {isMuted ? 'Muted' : 'Active'}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setShowSettingsModal(false)} className="w-full py-2.5 bg-[#00a884] text-white rounded-lg font-medium">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
