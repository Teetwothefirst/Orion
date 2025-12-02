import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Settings Options */}
            <View style={styles.content}>
                {/* General Option */}
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => router.push('/general')}
                >
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>General</Text>
                        <Text style={styles.settingDesc}>Change your name, email and profile photo</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                {/* Account Option */}
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => router.push('/account')}
                >
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingTitle}>Account</Text>
                        <Text style={styles.settingDesc}>Add or delete your passkeys</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                {/* Sign Out Option */}
                <TouchableOpacity
                    style={[styles.settingItem, styles.signOutItem]}
                    onPress={() => router.replace('/login')}
                >
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, styles.signOutText]}>Sign out</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
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
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 14,
        color: '#888',
    },
    signOutItem: {
        backgroundColor: '#2C1515',
        marginTop: 20,
    },
    signOutText: {
        color: '#FF3B30',
    },
});
