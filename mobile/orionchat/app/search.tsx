import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ messages: any[], chats: any[], users: any[] }>({ messages: [], chats: [], users: [] });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            if (query.trim()) {
                performSearch();
            } else {
                setResults({ messages: [], chats: [], users: [] });
            }
        }, 500);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/chats/search?q=${encodeURIComponent(query)}&userId=${user?.id}`);
            setResults(response.data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatPress = (chatId: number) => {
        router.push(`/chat/${chatId}`);
    };

    const startChat = async (otherUserId: number) => {
        try {
            const response = await api.post('/chats', {
                userId: user?.id,
                otherUserId: otherUserId
            });
            router.push(`/chat/${response.data.id}`);
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const renderSectionHeader = (title: string, data: any[]) => {
        if (data.length === 0) return null;
        return (
            <Text style={styles.sectionHeader}>{title}</Text>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    style={styles.list}
                    data={[
                        { title: 'USERS', data: results.users, type: 'user' },
                        { title: 'CHATS', data: results.chats, type: 'chat' },
                        { title: 'MESSAGES', data: results.messages, type: 'message' }
                    ]}
                    keyExtractor={(item) => item.title}
                    renderItem={({ item }) => (
                        <View>
                            {renderSectionHeader(item.title, item.data)}
                            {item.data.map((result: any) => (
                                <TouchableOpacity
                                    key={result.id}
                                    style={styles.resultItem}
                                    onPress={() => {
                                        if (item.type === 'user') startChat(result.id);
                                        else if (item.type === 'chat') handleChatPress(result.id);
                                        else if (item.type === 'message') handleChatPress(result.chat_id);
                                    }}
                                >
                                    <Image
                                        source={{ uri: result.avatar || (result.type === 'private' ? 'https://i.pravatar.cc/100' : 'https://via.placeholder.com/100') }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultTitle}>
                                            {item.type === 'user' ? result.username :
                                                item.type === 'chat' ? result.name :
                                                    (result.chat_name || result.username)}
                                        </Text>
                                        {item.type === 'message' && (
                                            <Text style={styles.messagePreview} numberOfLines={1}>{result.content}</Text>
                                        )}
                                        {item.type === 'message' && (
                                            <Text style={styles.timestamp}>
                                                {new Date(result.created_at).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                />
            )}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    backButton: {
        marginRight: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        marginRight: 12,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    messagePreview: {
        color: '#888',
        fontSize: 14,
        marginTop: 2,
    },
    timestamp: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    }
});
