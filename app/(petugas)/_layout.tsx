import { Redirect, Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const C = { primary: '#003B71', gray: '#9CA3AF' };

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? C.primary : C.gray} />;
}

export default function PetugasLayout() {
  // Defense-in-depth: AuthGate in app/_layout.tsx already steers role=user away
  // from this group, but a regular user could still deep-link in. Block here too.
  const { user, isLoading } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  if (isLoading) return <View />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'petugas' && user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.gray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 0,
          shadowOpacity: 0,
          // Respect bottom safe area on Android (gesture nav) and iOS (home indicator).
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen name="detail"   options={{ href: null }} />
      <Tabs.Screen name="navigate" options={{ href: null }} />
      <Tabs.Screen name="chat"     options={{ href: null }} />
      <Tabs.Screen name="riwayat"  options={{ href: null }} />
    </Tabs>
  );
}
