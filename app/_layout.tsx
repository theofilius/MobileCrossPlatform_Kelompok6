import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';

// Public routes — accessible without a session
const PUBLIC_ROUTES = new Set(['index', 'login', 'signup', 'otp', 'loading']);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0] as string | undefined;
    // Treat any segment we don't explicitly list as public as PROTECTED.
    // (tabs) and all deep screens (report-form, emergency-active, etc.) → protected.
    const onPublicRoute = !root || PUBLIC_ROUTES.has(root);

    if (!session && !onPublicRoute) {
      // Not signed in but trying to access protected route → redirect to login
      router.replace('/login' as any);
    } else if (session && (root === 'login' || root === 'signup' || root === 'otp')) {
      // Signed in but on auth screen → redirect to home
      router.replace('/(tabs)' as any);
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#003B71" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthGate>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="otp" options={{ headerShown: false }} />
                <Stack.Screen name="location-permission" options={{ headerShown: false }} />
                <Stack.Screen name="personal-info" options={{ headerShown: false }} />
                <Stack.Screen name="emergency-active" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="report-form" options={{ headerShown: false }} />
                <Stack.Screen name="camera-capture" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="audio-recording" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                <Stack.Screen name="report-history" options={{ headerShown: false }} />
                <Stack.Screen name="report-detail" options={{ headerShown: false }} />
                <Stack.Screen name="chat" options={{ headerShown: false }} />
                <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="privacy-security" options={{ headerShown: false }} />
                <Stack.Screen name="help-support" options={{ headerShown: false }} />
                <Stack.Screen name="responder-tracking" options={{ headerShown: false }} />
                <Stack.Screen name="first-aid" options={{ headerShown: false }} />
                <Stack.Screen name="disaster" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
            </AuthGate>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D2E7FA',
  },
});
