import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface Passkey {
    id: string;
    name: string;
    key: string;
}

export default function AccountScreen() {
    const router = useRouter();
    const { user, updateProfile } = useAuth();

    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [passkeys, setPasskeys] = useState<Passkey[]>([
        { id: '1', name: 'MACBOOK_AIR', key: 'passkey:*********************' },
    ]);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setBio(user.bio || '');
            setAvatar(user.avatar || '');
        }
    }, [user]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setAvatar(asset.uri);
            setAvatarFile({
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || 'profile.jpg',
            });
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        setIsUpdating(true);
        try {
            await updateProfile(username, bio, avatarFile);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

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
            <ScrollView style={styles.content}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                        <Image
                            source={{ uri: avatar || 'https://i.pravatar.cc/100' }}
                            style={styles.avatar}
                        />
                        <View style={styles.editAvatarIcon}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.emailText}>{user?.email}</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Username"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isUpdating && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>Passkeys</Text>

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
                <View style={{ height: 40 }} />
            </ScrollView>
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
    profileSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#333',
    },
    editAvatarIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#121212',
    },
    emailText: {
        color: '#888',
        fontSize: 14,
    },
    formSection: {
        marginBottom: 24,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.7,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#2C2C2C',
        marginVertical: 24,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});
