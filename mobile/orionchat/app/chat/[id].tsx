import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, socket } from '@/services/api';

interface Message {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
    username: string;
    avatar: string;
}

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || !id) return;

        fetchMessages();

        // Join chat room
        socket.emit('join_room', id);

        // Listen for new messages
        socket.on('receive_message', (message: Message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        return () => {
            socket.off('receive_message');
        };
    }, [id, user]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/chats/${id}/messages`);
            setMessages(response.data);
            setLoading(false);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const sendMessage = () => {
        if (newMessage.trim() === '' || !user) return;

        const messageData = {
            chatId: id,
            senderId: user.id,
            content: newMessage,
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
                {!isMyMessage && (
                    <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                )}
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    {!isMyMessage && <Text style={styles.senderName}>{item.username}</Text>}
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={scrollToBottom}
                />
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        multiline
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Ionicons name="send" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#333',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
    },
    myMessageBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#2C2C2C',
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 12,
        color: '#A0A0A0',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: 'white',
    },
    otherMessageText: {
        color: 'white',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2C',
        backgroundColor: '#1E1E1E',
    },
    input: {
        flex: 1,
        backgroundColor: '#2C2C2C',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: 'white',
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    },
});
