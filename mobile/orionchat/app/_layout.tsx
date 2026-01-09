import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { reportBug } from '@/services/support';
import NotificationHandler from '@/components/NotificationHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Automatic Crash Reporting
    reportBug({
      user: 'Mobile User (Auto)',
      description: 'Mobile Application Crash',
      isCrash: true,
      stackTrace: error.stack + '\n' + errorInfo.componentStack
    }).catch(err => console.error('Failed to report mobile crash:', err));
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong.</Text>
          <Text style={styles.errorText}>The application has crashed. A report has been sent to support.</Text>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={() => { /* Handled by user restarting app */ }}
          >
            <Text style={styles.restartButtonText}>Please restart the app</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 20
  },
  restartButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export const unstable_settings = {
  anchor: '(tabs)',
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationHandler />
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ presentation: 'card', title: 'Settings' }} />
              <Stack.Screen name="general" options={{ presentation: 'card', title: 'General Settings' }} />
              <Stack.Screen name="account" options={{ presentation: 'card', title: 'Account Settings' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
