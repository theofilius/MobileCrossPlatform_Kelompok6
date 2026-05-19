import { HapticTab } from '@/components/haptic-tab';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSOS } from '../context/SOSContext';

// ════════════════════════════════════════════════════════
// FLOATING SOS BUTTON
// ════════════════════════════════════════════════════════
function FloatingSOSButton() {
  const { isHolding, holdCount, handlePressIn, handlePressOut } = useSOS();
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isHolding) {
      pulse.value = withTiming(1, { duration: 200 });
    } else {
      pulse.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true
      );
    }
  }, [isHolding]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // ✅ FIX POSISI: Menaruh FAB tepat menempel pada batas atas Tab Bar
  // Mengurangi variabel dinamis yang tidak perlu.
  const paddingBawah = Platform.OS === 'ios' ? insets.bottom + 10 : 15;

  return (
    <View style={[fabStyles.wrapper, { bottom: paddingBawah }]} pointerEvents="box-none">
      <Animated.View style={[fabStyles.ring, animStyle, isHolding && fabStyles.ringHolding]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[fabStyles.btn, isHolding && fabStyles.btnHolding]}
        >
          {isHolding ? (
            <Text style={fabStyles.count}>{holdCount}</Text>
          ) : (
            <MaterialIcons name="sos" size={30} color="#FFFFFF" />
          )}
        </Pressable>
      </Animated.View>

      {/* Label SOS yang menempel rapi di bawah */}
      
    </View>
  );
}

// ════════════════════════════════════════════════════════
// TAB LAYOUT
// ════════════════════════════════════════════════════════
export default function TabLayout() {
  return (
    <View style={layoutStyles.root}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0C4F8D',
          tabBarInactiveTintColor: '#8D8E8E',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            height: Platform.OS === 'ios' ? 84 : 62,
            paddingBottom: Platform.OS === 'ios' ? 24 : 6,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color, size }) => <Ionicons size={size} name="home" color={color} />,
          }}
        />

        <Tabs.Screen
          name="sos"
          options={{
            title: 'Bantuan',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons size={size} name="message-alert" color={color} />,
            tabBarItemStyle: { marginRight: 15 }, // Jarak disesuaikan
          }}
        />

        <Tabs.Screen
          name="spacer"
          options={{
            title: '',
            tabBarButton: () => <View style={layoutStyles.fabSpace} />,
          }}
        />

        <Tabs.Screen
          name="community"
          options={{
            title: 'Komunitas',
            tabBarIcon: ({ color, size }) => <Ionicons size={size} name="people" color={color} />,
            tabBarItemStyle: { marginLeft: 15 }, // Jarak disesuaikan
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Ionicons size={size} name="person" color={color} />,
          }}
        />
      </Tabs>

      <FloatingSOSButton />
    </View>
  );
}

// ════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════
const layoutStyles = StyleSheet.create({
  root: { flex: 1 },
  fabSpace: { width: 65 }, // Diperkecil agar menu kiri-kanannya tidak terlalu jauh
});

const fabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(220,38,38,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringHolding: {
    backgroundColor: 'rgba(220,38,38,0.25)',
  },
  btn: {
    width: 56, // Sedikit diperkecil agar pas menempel di Tab Bar
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  btnHolding: {
    backgroundColor: '#991B1B',
    borderColor: '#DC2626',
  },
  count: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  label: {
    color: '#8D8E8E', // Diubah menjadi abu-abu netral agar menyatu dengan menu navigasi lain
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});