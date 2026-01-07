import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions, ActivityIndicator, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api, socket } from '@/services/api';
import NewChatModal from './NewChatModal';

const { width } = Dimensions.get('window');

export default function ChatListScreen() {
    const [activeTab, setActiveTab] = useState<'chat' | 'group'>('chat');
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Record<number, any>>({});
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchChats();

            socket.on('user_status', (data) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [data.userId]: { status: data.status, lastSeen: data.lastSeen }
                }));
            });

            return () => {
                socket.off('user_status');
            };
        }
    }, [user, activeTab]);

    const handleJoinGroup = async () => {
        if (!inviteCode) return;
        try {
            const response = await api.post(`/chats/join/${inviteCode}`, { userId: user?.id });
            Alert.alert('Success', response.data.message);
            setShowJoinModal(false);
            setInviteCode('');
            fetchChats();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data || 'Failed to join group');
        }
    };

    const handleStartChat = async (selection: any | any[], groupName?: string, isChannel?: boolean) => {
        try {
            if (Array.isArray(selection)) {
                // Group/Channel creation
                const response = await api.post('/chats', {
                    userId: user?.id,
                    type: isChannel ? 'channel' : 'group',
                    name: groupName || (isChannel ? 'New Channel' : 'New Group'),
                    participantIds: selection.map(u => u.id)
                });
                setShowNewChatModal(false);
                fetchChats();
                router.push(`/chat/${response.data.id}` as any);
            } else {
                // Private chat
                const response = await api.post('/chats', {
                    userId: user?.id,
                    otherUserId: selection.id
                });
                setShowNewChatModal(false);
                fetchChats();
                router.push(`/chat/${response.data.id}` as any);
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const fetchChats = async () => {
        try {
            const response = await api.get(`/chats?userId=${user?.id}`);
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatPress = (chatId: string) => {
        router.push(`/chat/${chatId}` as any);
    };

    const getFilteredChats = () => {
        return chats.filter(chat => {
            if (activeTab === 'chat') return chat.type === 'private';
            if (activeTab === 'group') return chat.type !== 'private'; // group
            return true;
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const isOnline = item.type === 'private' && onlineUsers[item.other_user_id]?.status === 'online';

        return (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item.id)}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }}
                        style={styles.chatAvatar}
                    />
                    {isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.chatInfo}>
                    <Text style={styles.chatTitle}>{item.name}</Text>
                    <Text style={styles.chatDesc} numberOfLines={1}>
                        {item.last_message_type === 'image' ? '📷 Photo' :
                            item.last_message_type === 'video' ? '📹 Video' :
                                item.last_message_type === 'document' ? '📄 Document' :
                                    (item.last_message || 'No messages yet')}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/settings')}>
                    <Image
                        source={{ uri: user?.avatar || 'https://i.pravatar.cc/100' }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orion</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity onPress={() => router.push('/search')}>
                        <Ionicons name="search" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowJoinModal(true)}>
                        <Ionicons name="link" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowNewChatModal(true)}>
                        <Ionicons name="add" size={28} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={getFilteredChats()}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No {activeTab === 'chat' ? 'chat rooms' : 'groups'} yet</Text>
                        </View>
                    }
                />
            )}

            {/* Liquid Glass Toggle */}
            <View style={styles.toggleContainer}>
                <View style={styles.glassContainer}>
                    {/* Background for the active tab */}
                    <View style={[styles.activeBackground, activeTab === 'group' && styles.activeRight]} />

                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('chat')}
                    >
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('group')}
                    >
                        <Text style={[styles.tabText, activeTab === 'group' && styles.activeTabText]}>Group</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* New Chat Modal */}
            <NewChatModal
                visible={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onUserSelect={handleStartChat}
            />

            {/* Join Group Modal */}
            <Modal
                visible={showJoinModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowJoinModal(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { height: 'auto', borderRadius: 16, padding: 20 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Join Group</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={{ backgroundColor: '#F0F0F0', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 15 }}
                            placeholder="Enter Invite Code"
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' }}
                            onPress={handleJoinGroup}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Join Community</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        marginLeft: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100, // Space for toggle
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    chatInfo: {
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    chatAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CD964',
        borderWidth: 2,
        borderColor: '#1E1E1E',
    },
    chatTitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
        marginBottom: 4,
    },
    chatDesc: {
        fontSize: 14,
        color: '#888',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Toggle Styles
    toggleContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    glassContainer: {
        flexDirection: 'row',
        width: 280,
        height: 50,
        backgroundColor: 'rgba(50, 50, 50, 0.5)', // Semi-transparent dark
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    activeBackground: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Lighter highlight
        borderRadius: 25,
        left: 0,
    },
    activeRight: {
        left: '50%',
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
    }
});
