import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SOSProvider } from '../app/context/SOSContext';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChatNotificationOverlay } from '@/components/aegis/ChatNotificationOverlay';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ReportsProvider } from '@/context/ReportsContext';
import { SocketProvider } from '@/context/SocketContext';

// Public routes — accessible without a session
const PUBLIC_ROUTES = new Set(['index', 'login', 'signup', 'otp', 'loading']);
// Routes restricted to role=petugas|admin. role=user must be redirected out.
const PETUGAS_GROUP = '(petugas)';

// Minimum splash visibility (ms) so the branded screen feels intentional
// even on a fast cold boot, like LINE / Instagram.
const SPLASH_MIN_DURATION = 1100;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, user, isLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();
  const [splashHeld, setSplashHeld] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashHeld(false), SPLASH_MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0] as string | undefined;
    // Treat any segment we don't explicitly list as public as PROTECTED.
    // (tabs) and all deep screens (report-form, emergency-active, etc.) → protected.
    const onPublicRoute = !root || PUBLIC_ROUTES.has(root);
    const onPetugasRoute = root === PETUGAS_GROUP;

    if (!session && !onPublicRoute) {
      // Not signed in but trying to access protected route → redirect to login
      router.replace('/login' as any);
      return;
    }

    if (session && user) {
      const isStaff = user.role === 'petugas' || user.role === 'admin';

      // Just logged in (still on auth screen) → send to role-appropriate home.
      if (root === 'login' || root === 'signup' || root === 'otp') {
        router.replace((isStaff ? '/(petugas)/dashboard' : '/(tabs)') as any);
        return;
      }

      // Regular user wandered into the petugas group → bounce to user home.
      if (!isStaff && onPetugasRoute) {
        router.replace('/(tabs)' as any);
        return;
      }

      // Staff in the user tabs → push to their dashboard.
      // (Deep screens like report-form are still allowed; we only guard the (tabs) group.)
      if (isStaff && root === '(tabs)') {
        router.replace('/(petugas)/dashboard' as any);
        return;
      }
    }
  }, [session, user, isLoading, segments, router]);

  if (isLoading || splashHeld) {
    return <BrandedSplash />;
  }

  return (
    <>
      {children}
      {session && user && <ChatNotificationOverlay />}
    </>
  );
}

// LINE / Instagram-style branded splash. Shows the Aegis logo on solid navy.
// Used while AuthContext is hydrating the session.
function BrandedSplash() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.splash}>
      <View style={styles.splashInner}>
        {!imageFailed ? (
          <Image
            source={require('../assets/images/aegis-logo.png')}
            style={styles.splashLogo}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          // Fallback when the asset can't be bundled (e.g. Metro stale cache).
          // Still renders branded text so the screen never looks empty.
          <View style={styles.splashLogoFallback}>
            <Text style={styles.splashAppName}>AEGIS</Text>
            <Text style={styles.splashAppName}>CALL</Text>
          </View>
        )}
        <Text style={styles.splashTagline}>Selalu siaga. Selalu hadir.</Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
<<<<<<< HEAD
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthGate>
              {/* menambahkan button yang tersinkronisasi dengan sos di homepage */}
              <SOSProvider>
=======
          <ReportsProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGate>
>>>>>>> main
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
<<<<<<< HEAD
=======
                  <Stack.Screen name="report-chat" options={{ headerShown: false }} />
>>>>>>> main
                  <Stack.Screen name="chat" options={{ headerShown: false }} />
                  <Stack.Screen name="emergency-contacts" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy-security" options={{ headerShown: false }} />
                  <Stack.Screen name="help-support" options={{ headerShown: false }} />
                  <Stack.Screen name="responder-tracking" options={{ headerShown: false }} />
                  <Stack.Screen name="first-aid" options={{ headerShown: false }} />
                  <Stack.Screen name="disaster" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
<<<<<<< HEAD
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
              </SOSProvider>
            </AuthGate>
            <StatusBar style="auto" />
          </ThemeProvider>
=======
                  <Stack.Screen name="(petugas)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
              </AuthGate>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ReportsProvider>
>>>>>>> main
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
  splash: {
    flex: 1,
    backgroundColor: '#003B71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashInner: {
    alignItems: 'center',
    gap: 14,
  },
  splashLogo: {
    width: 180,
    height: 180,
  },
  splashLogoFallback: {
    width: 180,
    height: 180,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashAppName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
  },
  splashTagline: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
