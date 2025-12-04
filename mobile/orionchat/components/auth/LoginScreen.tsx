import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginWithGoogle?: () => void;
  onLoginWithPasskey?: () => void;
  onLoginWithEmail?: (email: string, password: string, isRegister: boolean, username?: string) => void;
  isLoading?: boolean;
}

export default function LoginScreen({
  onLoginWithGoogle,
  onLoginWithPasskey,
  onLoginWithEmail,
  isLoading
}: LoginScreenProps) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleEmailSubmit = () => {
    if (onLoginWithEmail) {
      onLoginWithEmail(email, password, isRegister, username);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="bulb-outline" size={60} color="white" />
              </View>
              <Text style={styles.title}>{isRegister ? 'Create Account' : 'Login'}</Text>
              <Text style={styles.subtitle}>{isRegister ? 'Sign up to get started' : 'Welcome back, please sign in'}</Text>
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonContainer}>
              {!showEmailInput ? (
                <>
                  <TouchableOpacity style={styles.googleButton} onPress={onLoginWithGoogle}>
                    <FontAwesome name="google" size={20} color="black" style={styles.buttonIcon} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={onLoginWithPasskey}>
                    <Ionicons name="key-outline" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.secondaryButtonText}>Continue with Passkey</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowEmailInput(true)}>
                    <Ionicons name="mail-outline" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.secondaryButtonText}>Continue with Email</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {isRegister && (
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#666"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity style={styles.googleButton} onPress={handleEmailSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <Text style={styles.googleButtonText}>{isRegister ? 'Sign Up' : 'Login'}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchButton}>
                    <Text style={styles.switchText}>
                      {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowEmailInput(false)} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back to options</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center', // Changed from space-between to center for better scrolling behavior
    paddingVertical: 40,
    minHeight: Dimensions.get('window').height - 100, // Ensure minimum height
  },
  header: {
    alignItems: 'center',
    marginBottom: 40, // Changed from marginTop to marginBottom for better flow
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  googleButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E', // Slightly lighter than bg
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#333',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  }
});
