import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Image } from 'react-native';
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
    onUserSelect: (user: User | User[], name?: string) => void;
}

export default function NewChatModal({ visible, onClose, onUserSelect }: NewChatModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (visible) {
            fetchUsers();
        } else {
            setSearchQuery('');
            setUsers([]);
            setSelectedUsers([]);
            setGroupName('');
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
        onUserSelect(selectedUsers, groupName);
    };

    const handleSingleUserPress = (user: User) => {
        if (selectedUsers.length > 0) {
            toggleUserSelection(user);
        } else {
            onUserSelect(user);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.some(u => u.id === item.id);
        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.selectedUserItem]}
                onPress={() => selectedUsers.length > 0 ? toggleUserSelection(item) : handleSingleUserPress(item)}
                onLongPress={() => toggleUserSelection(item)}
            >
                <Image
                    source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
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
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>New Chat</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {/* Group Mode Toggle/Header */}
                {selectedUsers.length > 0 && (
                    <View style={styles.groupHeader}>
                        <Text style={styles.selectedCount}>{selectedUsers.length} selected</Text>
                        <TextInput
                            style={styles.groupNameInput}
                            placeholder="Group Name (Optional)"
                            placeholderTextColor="#666"
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                            <Text style={styles.createButtonText}>Create Group</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
            </View>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        margin: 16,
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
    groupHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
        gap: 12,
    },
    selectedCount: {
        color: '#007AFF',
        fontWeight: '600',
    },
    groupNameInput: {
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 8,
        color: 'white',
        borderWidth: 1,
        borderColor: '#333',
    },
    createButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
