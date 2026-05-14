import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
