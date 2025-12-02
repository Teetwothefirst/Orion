import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Passkey {
    id: string;
    name: string;
    key: string;
}

export default function AccountScreen() {
    const router = useRouter();
    const [passkeys, setPasskeys] = useState<Passkey[]>([
        { id: '1', name: 'MACBOOK_AIR', key: 'passkey:*********************' },
    ]);

    const handleDeletePasskey = (id: string) => {
        Alert.alert(
            'Delete Passkey',
            'Are you sure you want to delete this passkey?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setPasskeys(passkeys.filter(pk => pk.id !== id));
                    },
                },
            ]
        );
    };

    const handleAddPasskey = () => {
        Alert.alert('Add Passkey', 'This feature will allow you to add a new passkey for authentication.');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Passkeys List */}
                {passkeys.map((passkey) => (
                    <View key={passkey.id} style={styles.passkeyItem}>
                        <View style={styles.passkeyInfo}>
                            <Text style={styles.passkeyName}>{passkey.name}</Text>
                            <Text style={styles.passkeyKey}>{passkey.key}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeletePasskey(passkey.id)}>
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Add Passkey Button */}
                <TouchableOpacity style={styles.addButton} onPress={handleAddPasskey}>
                    <Text style={styles.addButtonText}>Add Passkey</Text>
                </TouchableOpacity>
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
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#007AFF',
        fontSize: 17,
        marginLeft: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: 'white',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    placeholder: {
        width: 60,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    passkeyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    passkeyInfo: {
        flex: 1,
    },
    passkeyName: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
        marginBottom: 4,
    },
    passkeyKey: {
        fontSize: 14,
        color: '#888',
    },
    addButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: '600',
    },
});
