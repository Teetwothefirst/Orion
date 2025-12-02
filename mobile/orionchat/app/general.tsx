import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function GeneralScreen() {
    const router = useRouter();
    const [name, setName] = useState('Céss White');
    const [email, setEmail] = useState('cesswhite@gmail.com');
    const [password, setPassword] = useState('********************');
    const [profileImage, setProfileImage] = useState('https://i.pravatar.cc/200');

    const pickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your profile photo.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleSave = () => {
        Alert.alert('Success', 'Profile updated successfully!');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>General</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Profile Photo */}
                <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                    <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
                    <View style={styles.editIconContainer}>
                        <Ionicons name="create-outline" size={20} color="white" />
                    </View>
                </TouchableOpacity>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor="#666"
                    />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#666"
                        secureTextEntry
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
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
        paddingTop: 30,
        alignItems: 'center',
    },
    photoContainer: {
        marginBottom: 30,
        position: 'relative',
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#333',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#121212',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: 'white',
    },
    saveButton: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: '600',
    },
});
