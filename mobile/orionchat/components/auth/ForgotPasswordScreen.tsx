import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState(1); // 1: Email, 2: Token + Password
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const { forgotPassword, resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendLink = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        setLoading(true);
        try {
            await forgotPassword(email);
            // Token is now sent via email, not returned
            Alert.alert('Success', 'Password reset instructions sent to your email.');
            setStep(2);
        } catch (error: any) {
            console.error('Forgot Password Error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send reset link';
            Alert.alert('Error', typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!token || !newPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(token, newPassword);
            Alert.alert('Success', 'Password reset successfully. Please login.');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Reset Password</Text>

                    {step === 1 ? (
                        <>
                            <Text style={styles.subtitle}>Enter your email to receive a reset token.</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#666"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TouchableOpacity style={styles.button} onPress={handleSendLink} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>Enter the token sent to your email and your new password.</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Reset Token"
                                placeholderTextColor="#666"
                                value={token}
                                onChangeText={setToken}
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                placeholderTextColor="#666"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    content: { padding: 24, justifyContent: 'center', minHeight: '100%' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10, marginTop: 60 },
    subtitle: { fontSize: 16, color: '#A0A0A0', marginBottom: 40 },
    input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, fontSize: 16, color: 'white', borderWidth: 1, borderColor: '#333', marginBottom: 16 },
    button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
