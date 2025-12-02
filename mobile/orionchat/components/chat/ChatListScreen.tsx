import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient'; // For nice gradients if needed, or just colors

const { width } = Dimensions.get('window');

// Mock Data
const CHAT_ROOMS = [
    { id: '1', title: 'Adeniji', description: 'Football Group' },
    { id: '2', title: 'My second chat room', description: 'Minimum description of second room' },
    { id: '3', title: 'My third chat room', description: 'Minimum description of third room' },
];

const GROUPS_DATA = [
    { id: 'g1', title: 'Project Alpha', description: 'Work updates' },
    { id: 'g2', title: 'Weekend Trip', description: 'Planning for the trip' },
];

export default function ChatListScreen() {
    const [activeTab, setActiveTab] = useState<'chat' | 'group'>('chat');
    const router = useRouter();

    const data = activeTab === 'chat' ? CHAT_ROOMS : GROUPS_DATA;

    const renderItem = ({ item }: { item: typeof CHAT_ROOMS[0] }) => (
        <TouchableOpacity style={styles.chatItem}>
            <View style={styles.chatInfo}>
                <Text style={styles.chatTitle}>{item.title}</Text>
                <Text style={styles.chatDesc}>{item.description}</Text>
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
                        source={{ uri: 'https://i.pravatar.cc/100' }} // Placeholder avatar
                        style={styles.avatar}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orion</Text>
                <TouchableOpacity>
                    <Ionicons name="add" size={28} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No {activeTab === 'chat' ? 'chat rooms' : 'groups'} yet</Text>
                    </View>
                }
            />

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
