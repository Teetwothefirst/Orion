import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api, socket } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

interface Message {
    id: number;
    content: string;
    sender_id: number;
    type?: 'text' | 'image' | 'video' | 'document';
    media_url?: string;
    status?: 'sent' | 'delivered' | 'read';
    reply_to_id?: number;
    reply_content?: string;
    reply_sender_id?: number;
    forwarded_from_id?: number;
    created_at: string;
    username: string;
    avatar: string;
}

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Record<number, any>>({});
    const [chatInfo, setChatInfo] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || !id) return;

        fetchChatInfo();
        fetchMessages();

        // Join chat room
        socket.emit('join_room', id);

        // Listen for new messages
        socket.on('receive_message', (message: Message) => {
            if (message.sender_id !== user.id) {
                socket.emit('message_read', { chatId: id, userId: user.id });
            }
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        socket.on('status_update', (data: { messageId: number, status: string }) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status as any } : m));
        });

        socket.on('chat_read', (data: { chatId: string, userId: number }) => {
            if (data.chatId === id) {
                setMessages(prev => prev.map(m => m.sender_id === user.id ? { ...m, status: 'read' } : m));
            }
        });

        socket.on('user_status', (data) => {
            setOnlineUsers(prev => ({
                ...prev,
                [data.userId]: { status: data.status, lastSeen: data.lastSeen }
            }));
        });

        // Mark current chat as read when focused
        socket.emit('message_read', { chatId: id, userId: user.id });

        return () => {
            socket.off('receive_message');
            socket.off('status_update');
            socket.off('chat_read');
            socket.off('user_status');
        };
    }, [id, user]);

    const fetchChatInfo = async () => {
        try {
            const response = await api.get(`/chats?userId=${user?.id}`);
            const chat = response.data.find((c: any) => c.id.toString() === id);
            if (chat) {
                setChatInfo(chat);
            }
        } catch (error) {
            console.error('Error fetching chat info:', error);
        }
    };

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

    const sendMessage = (overrideData = {}) => {
        if ((newMessage.trim() === '' && !overrideData.hasOwnProperty('media_url')) || !user) return;

        const messageData: any = {
            chatId: id,
            senderId: user.id,
            content: newMessage,
            type: 'text',
            ...overrideData
        };

        if (replyTo) {
            messageData.reply_to_id = replyTo.id;
            setReplyTo(null);
        }

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            const formData = new FormData();
            const asset = result.assets[0];

            // @ts-ignore
            formData.append('file', {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || 'upload.jpg',
            });

            setIsUploading(true);
            try {
                const response = await api.post('/chats/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                sendMessage({
                    content: `Sent a ${response.data.type}`,
                    type: response.data.type,
                    media_url: response.data.url
                });
            } catch (error) {
                console.error('Error uploading file:', error);
                Alert.alert('Error', 'Failed to upload file');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleForward = async (message: Message) => {
        setForwardingMessage(message);
        try {
            const response = await api.get(`/chats?userId=${user?.id}`);
            setContacts(response.data);
            setShowForwardModal(true);
        } catch (error) {
            console.error('Error fetching contacts for forwarding:', error);
            Alert.alert('Error', 'Failed to load contacts');
        }
    };

    const confirmForward = (chatId: number) => {
        if (!forwardingMessage) return;

        const messageData = {
            chatId: chatId,
            senderId: user?.id,
            content: forwardingMessage.content,
            type: forwardingMessage.type || 'text',
            media_url: forwardingMessage.media_url,
            forwarded_from_id: forwardingMessage.id
        };

        socket.emit('send_message', messageData);
        setShowForwardModal(false);
        setForwardingMessage(null);

        // Optionally navigate to the new chat
        router.replace(`/chat/${chatId}` as any);
    };

    const handleMessagePress = (item: Message) => {
        Alert.alert(
            'Message Actions',
            'Select an action',
            [
                { text: 'Reply', onPress: () => setReplyTo(item) },
                { text: 'Forward', onPress: () => handleForward(item) },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
                {!isMyMessage && (
                    <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                )}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => handleMessagePress(item)}
                    style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}
                >
                    {!isMyMessage && <Text style={styles.senderName}>{item.username}</Text>}

                    {item.reply_to_id && (
                        <View style={styles.replyContext}>
                            <Text style={styles.replySender}>{item.reply_sender_id === user?.id ? 'You' : 'Reply'}</Text>
                            <Text style={styles.replySnippet} numberOfLines={1}>{item.reply_content}</Text>
                        </View>
                    )}

                    {item.type === 'image' && (
                        <Image source={{ uri: item.media_url }} style={styles.mediaImage} resizeMode="cover" />
                    )}

                    {item.type === 'video' && (
                        <View style={styles.mediaPlaceholder}>
                            <Ionicons name="play-circle" size={40} color="white" />
                            <Text style={{ color: 'white', marginTop: 4 }}>Video</Text>
                        </View>
                    )}

                    {item.type === 'document' && (
                        <View style={styles.mediaPlaceholder}>
                            <Ionicons name="document" size={40} color="white" />
                            <Text style={{ color: 'white', marginTop: 4 }} numberOfLines={1}>{item.content}</Text>
                        </View>
                    )}

                    {item.type === 'text' && (
                        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                            {item.content}
                        </Text>
                    )}

                    <View style={styles.messageFooter}>
                        <Text style={styles.timestamp}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isMyMessage && (
                            <Ionicons
                                name={item.status === 'read' ? "checkmark-done" : item.status === 'delivered' ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={item.status === 'read' ? "#4FC3F7" : "rgba(255,255,255,0.6)"}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderHeaderTitle = () => {
        const otherUserId = chatInfo?.other_user_id || messages.find(m => m.sender_id !== user?.id)?.sender_id;
        const status = otherUserId ? onlineUsers[otherUserId] : null;

        return (
            <View style={{ alignItems: 'center' }}>
                <Text style={styles.headerTitle}>{chatInfo?.name || 'Chat'}</Text>
                {status && (
                    <Text style={[styles.statusText, status.status === 'online' && { color: '#4CD964' }]}>
                        {status.status === 'online' ? 'Online' :
                            status.lastSeen ? `Last seen ${new Date(status.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                                'Offline'}
                    </Text>
                )}
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
                {renderHeaderTitle()}
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
                {replyTo && (
                    <View style={styles.replyPreview}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.replyPreviewSender}>Replying to {replyTo.username}</Text>
                            <Text style={styles.replyPreviewText} numberOfLines={1}>{replyTo.content}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyTo(null)}>
                            <Ionicons name="close-circle" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.attachButton} disabled={isUploading}>
                        {isUploading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Ionicons name="add" size={28} color="#007AFF" />
                        )}
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        multiline
                    />
                    <TouchableOpacity onPress={() => sendMessage()} style={styles.sendButton}>
                        <Ionicons name="send" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            {/* Bug Report Modal if needed? No, separate task */}

            {/* Forward Selection Modal */}
            {showForwardModal && (
                <View style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: '#1E1E1E', width: '100%', borderRadius: 16, padding: 20, maxHeight: '80%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Forward To</Text>
                                <TouchableOpacity onPress={() => setShowForwardModal(false)}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={contacts}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
                                        onPress={() => confirmForward(item.id)}
                                    >
                                        <Text style={{ color: 'white', fontSize: 16 }}>{item.name || item.group_name}</Text>
                                        <Text style={{ color: '#888', fontSize: 12 }} numberOfLines={1}>{item.last_message}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </View>
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
    statusText: {
        fontSize: 12,
        color: '#888',
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
    attachButton: {
        marginRight: 8,
        padding: 4,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1E1E1E',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2C',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    replyPreviewSender: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 2,
    },
    replyPreviewText: {
        fontSize: 14,
        color: '#A0A0A0',
    },
    replyContext: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    replySender: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 2,
    },
    replySnippet: {
        fontSize: 13,
        color: '#A0A0A0',
    },
    mediaImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
    },
    mediaPlaceholder: {
        width: 200,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
});
