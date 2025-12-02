import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginWithGoogle?: () => void;
  onLoginWithPasskey?: () => void;
  onLoginWithEmail?: () => void;
}

export default function LoginScreen({
  onLoginWithGoogle,
  onLoginWithPasskey,
  onLoginWithEmail,
}: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="bulb-outline" size={60} color="white" />
          </View>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back, please sign in</Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={onLoginWithGoogle}>
            <FontAwesome name="google" size={20} color="black" style={styles.buttonIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onLoginWithPasskey}>
             <Ionicons name="key-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Continue with Passkey</Text>
          </TouchableOpacity>

           <TouchableOpacity style={styles.secondaryButton} onPress={onLoginWithEmail}>
            <Ionicons name="mail-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
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
});
