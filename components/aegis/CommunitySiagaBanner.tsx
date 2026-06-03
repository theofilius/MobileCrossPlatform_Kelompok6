// Floating alert banner that surfaces when a nearby SOS fires for a
// Komunitas Siaga opt-in user. Renders nothing when there's no active alert.
//
// Privacy: we show distance only ("≈800 m dari Anda"). The victim's exact
// coordinates and name are intentionally bounded (name is the reporter's
// profile name, which is what they already see in their own profile).

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistance, useCommunitySiaga } from '../../context/CommunitySiagaContext';

export function CommunitySiagaBanner() {
  const insets = useSafeAreaInsets();
  const { alert, dismiss } = useCommunitySiaga();

  // Slide-down + fade-in animation. We keep an Animated.Value across renders
  // and re-run the in-animation each time a new alert arrives.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!alert) {
      anim.setValue(0);
      return;
    }
    Animated.spring(anim, {
      toValue: 1,
      damping: 14,
      stiffness: 140,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [alert, anim]);

  if (!alert) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-100, 0] });
  const opacity = anim;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top + 6 },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="shield-alert" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            Ada SOS di sekitar Anda
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {alert.reporterName} · {formatDistance(alert.distanceKm)} dari Anda
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', marginTop: 1 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
