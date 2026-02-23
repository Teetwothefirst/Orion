import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface User {
    id: number;
    username: string;
    email: string;
    avatar: string;
}

interface NewChatModalProps {
    visible: boolean;
    onClose: () => void;
    onUserSelect: (user: User | User[], name?: string, isChannel?: boolean) => void;
    initialMode?: 'chat' | 'group';
}

export default function NewChatModal({ visible, onClose, onUserSelect, initialMode = 'chat' }: NewChatModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isChannel, setIsChannel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'chat' | 'group'>(initialMode);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (visible) {
            setMode(initialMode);
            fetchUsers();
        } else {
            setSearchQuery('');
            setUsers([]);
            setSelectedUsers([]);
            setGroupName('');
            setIsChannel(false);
            setMode('chat');
        }
    }, [visible]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const endpoint = searchQuery
                ? `/users/search?q=${searchQuery}&currentUserId=${currentUser?.id}`
                : `/users?currentUserId=${currentUser?.id}`;

            const response = await api.get(endpoint);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (visible) fetchUsers();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleUserSelection = (user: User) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreateGroup = () => {
        if (selectedUsers.length === 0) return;
        onUserSelect(selectedUsers, groupName, isChannel);
    };

    const handleSingleUserPress = (user: User) => {
        if (mode === 'group') {
            toggleUserSelection(user);
        } else {
            onUserSelect(user);
        }
    };

    const switchMode = (newMode: 'chat' | 'group') => {
        setMode(newMode);
        setSelectedUsers([]);
        setGroupName('');
        setIsChannel(false);
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.some(u => u.id === item.id);
        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.selectedUserItem]}
                onPress={() => handleSingleUserPress(item)}
            >
                <Image
                    source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                {mode === 'group' ? (
                    <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={isSelected ? "#007AFF" : "#555"}
                    />
                ) : (
                    <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {mode === 'group' ? 'New Group' : 'New Chat'}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Mode Toggle */}
                <View style={styles.modeToggleContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'chat' && styles.modeButtonActive]}
                        onPress={() => switchMode('chat')}
                    >
                        <Ionicons name="chatbubble-outline" size={18} color={mode === 'chat' ? '#fff' : '#888'} />
                        <Text style={[styles.modeButtonText, mode === 'chat' && styles.modeButtonTextActive]}>
                            New Chat
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'group' && styles.modeButtonActive]}
                        onPress={() => switchMode('group')}
                    >
                        <Ionicons name="people-outline" size={18} color={mode === 'group' ? '#fff' : '#888'} />
                        <Text style={[styles.modeButtonText, mode === 'group' && styles.modeButtonTextActive]}>
                            New Group
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Group Options (visible when in group mode) */}
                {mode === 'group' && (
                    <View style={styles.groupHeader}>
                        <TextInput
                            style={styles.groupNameInput}
                            placeholder="Group Name"
                            placeholderTextColor="#666"
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TouchableOpacity
                            style={styles.channelToggle}
                            onPress={() => setIsChannel(!isChannel)}
                        >
                            <Ionicons
                                name={isChannel ? "checkbox" : "square-outline"}
                                size={20}
                                color={isChannel ? "#007AFF" : "#666"}
                            />
                            <Text style={styles.channelToggleText}>Create as Public Channel</Text>
                        </TouchableOpacity>
                        {selectedUsers.length > 0 && (
                            <View style={styles.selectedInfo}>
                                <Text style={styles.selectedCount}>{selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected</Text>
                                <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                                    <Ionicons name="checkmark" size={18} color="white" />
                                    <Text style={styles.createButtonText}>
                                        Create {isChannel ? 'Channel' : 'Group'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>

                {/* User List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No users found</Text>
                            </View>
                        }
                    />
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        padding: 4,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 4,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    modeButtonActive: {
        backgroundColor: '#007AFF',
    },
    modeButtonText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: 'white',
    },
    groupHeader: {
        padding: 16,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
        gap: 10,
    },
    groupNameInput: {
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 10,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    channelToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    channelToggleText: {
        color: '#ccc',
        fontSize: 14,
    },
    selectedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedCount: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 14,
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        gap: 6,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        margin: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        height: '100%',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#888',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    selectedUserItem: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
});
