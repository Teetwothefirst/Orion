import React, { useState, useEffect } from 'react';
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
    const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('sessionId'));
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    const [selectedChat, setSelectedChat] = useState<{ id: string; type: 'user' | 'group', name: string } | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const {
        isConnected,
        users,
        groups,
        messages,
        setMessages,
        typingUsers,
        sendMessage,
        emitTyping
    } = useSocket(sessionId);

    // Sync user from local storage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Fetch message history when selectedChat changes
    useEffect(() => {
        if (!selectedChat || !sessionId) return;

        const fetchHistory = async () => {
            const endpoint = selectedChat.type === 'user'
                ? `/messages/${selectedChat.id}`
                : `/groups/${selectedChat.id}/messages`;

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${sessionId}` }
                });
                if (response.ok) {
                    const history: Message[] = await response.json();
                    setMessages(history);
                }
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };

        fetchHistory();
    }, [selectedChat, sessionId, setMessages]);

    const handleAuthSuccess = (authUser: any, sid: string) => {
        setUser(authUser);
        setSessionId(sid);
        localStorage.setItem('sessionId', sid);
        localStorage.setItem('user', JSON.stringify(authUser));
    };

    const handleLogout = () => {
        setUser(null);
        setSessionId(null);
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
    };

    if (!sessionId || !user) {
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

    const filteredMessages = messages.filter(m => {
        if (!selectedChat) return false;
        if (selectedChat.type === 'user') {
            return (m.senderId === user._id && m.receiverId === selectedChat.id) ||
                (m.senderId === selectedChat.id && m.receiverId === user._id);
        } else {
            return m.groupId === selectedChat.id;
        }
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        sendMessage(messageInput, selectedChat.type === 'user' ? selectedChat.id : undefined, selectedChat.type === 'group' ? selectedChat.id : undefined);
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
                        <Users size={16} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <MessageSquare size={16} /> Groups
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {activeTab === 'users' ? (
                        users.filter(u => u._id !== user._id).map((u) => (
                            <button
                                key={u._id}
                                onClick={() => setSelectedChat({ id: u._id, type: 'user', name: u.username })}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedChat?.id === u._id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-900 border border-transparent hover:border-gray-800'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-gray-900 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm">{u.username}</p>
                                    <p className="text-xs text-gray-500">{u.status}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <>
                            <button
                                onClick={() => setIsCreateGroupOpen(true)}
                                className="w-full py-3 mb-2 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Create Group
                            </button>
                            {groups.map((g) => (
                                <button
                                    key={g._id}
                                    onClick={() => setSelectedChat({ id: g._id, type: 'group', name: g.name })}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedChat?.id === g._id ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-900 border border-transparent hover:border-gray-800'}`}
                                >
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-sm">
                                        GP
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">{g.name}</p>
                                        <p className="text-xs text-gray-500">{g.members.length} members</p>
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
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${selectedChat.type === 'user' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                    {selectedChat.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">{selectedChat.name}</h3>
                                    {selectedChat.type === 'user' && typingUsers[selectedChat.id] && (
                                        <p className="text-xs text-blue-400 animate-pulse mt-1 italic">Typing...</p>
                                    )}
                                </div>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                <Settings size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {filteredMessages.map((m, i) => {
                                const isOwn = m.senderId === user._id;
                                return (
                                    <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none'}`}>
                                            {selectedChat.type === 'group' && !isOwn && m.senderUsername && (
                                                <p className="text-xs font-bold text-purple-400 mb-1">{m.senderUsername}</p>
                                            )}
                                            <p className="text-sm leading-relaxed">{m.content}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right opacity-50">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-800 flex gap-4">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => {
                                    setMessageInput(e.target.value);
                                    emitTyping(true, selectedChat.type === 'user' ? selectedChat.id : undefined, selectedChat.type === 'group' ? selectedChat.id : undefined);
                                }}
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
                        <p className="max-w-xs leading-relaxed text-sm">Select a user or group from the sidebar to start your conversation.</p>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateGroupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Create New Group</h3>
                            <button onClick={() => setIsCreateGroupOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Design Team"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                                <textarea
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                                    placeholder="What's this group about?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Members</label>
                                <div className="max-h-40 overflow-y-auto border border-gray-800 rounded-lg bg-gray-950 p-2 space-y-1">
                                    {users.filter(u => u._id !== user._id).map(u => (
                                        <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-md cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(u._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedMembers([...selectedMembers, u._id]);
                                                    else setSelectedMembers(selectedMembers.filter((id: string) => id !== u._id));
                                                }}
                                                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                                            />
                                            <span className="text-sm">{u.username}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-900 border-t border-gray-800 flex gap-3">
                            <button
                                onClick={() => setIsCreateGroupOpen(false)}
                                className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                onClick={() => {
                                    // Handle group creation via socket or API
                                    setIsCreateGroupOpen(false);
                                }}
                            >
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default ChatPage;
