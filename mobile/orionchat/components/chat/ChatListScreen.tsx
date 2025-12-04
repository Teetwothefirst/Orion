import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

const { width } = Dimensions.get('window');

export default function ChatListScreen() {
    const [activeTab, setActiveTab] = useState<'chat' | 'group'>('chat');
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

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

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item.id)}>
            <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>{item.name}</Text>
                <Text style={styles.chatDesc} numberOfLines={1}>
                    {item.last_message || 'No messages yet'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

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
                <TouchableOpacity>
                    <Ionicons name="add" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={chats}
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
});
