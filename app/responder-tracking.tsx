import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';

const { width } = Dimensions.get('window');
const MAP_SIZE = width - 32;
const TOTAL_ETA_SEC = 480; // 8 minutes
const START_DISTANCE_M = 2400; // 2.4 km

// Simulated responder data (in real app, would come from backend / Socket.IO)
const RESPONDER = {
  name: 'Tim SAR Jakarta',
  unit: 'Unit Tanggap Darurat #07',
  vehicle: 'Ambulans B 9082 PJM',
  phone: '0211500',
  initials: 'TS',
};

function formatEta(seconds: number, t: (k: any) => string): string {
  if (seconds <= 0) return `0 ${t('rt_seconds')}`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} ${t('rt_seconds')}`;
  return `${m} ${t('rt_minutes')} ${s} ${t('rt_seconds')}`;
}

function formatDistance(meters: number, t: (k: any) => string): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ${t('rt_kilometers')}`;
  return `${Math.round(meters)} ${t('rt_meters')}`;
}

export default function ResponderTrackingScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [etaSec, setEtaSec] = useState(TOTAL_ETA_SEC);
  const [distance, setDistance] = useState(START_DISTANCE_M);
  const [arrived, setArrived] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Animated values: responder marker progress (0..1) toward user (center)
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0.5);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Capture user location once for share button
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {}
    })();

    // Responder marker animates from edge to center
    progress.value = withTiming(1, { duration: TOTAL_ETA_SEC * 1000, easing: Easing.inOut(Easing.quad) });

    // User dot pulse
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );

    // Ripple ping
    pingScale.value = withRepeat(withTiming(3, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false);
    pingOpacity.value = withRepeat(withTiming(0, { duration: 2200 }), -1, false);

    // ETA + distance tick
    tickRef.current = setInterval(() => {
      setEtaSec(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) setArrived(true);
        return next;
      });
      setDistance(prev => Math.max(0, prev - START_DISTANCE_M / TOTAL_ETA_SEC));
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Responder marker travel path: from top-left corner toward center
  // Center of map = (MAP_SIZE/2, MAP_SIZE/2). Start = (60, 60).
  const responderStyle = useAnimatedStyle(() => {
    const startX = 50, startY = 50;
    const endX = MAP_SIZE / 2 - 18;
    const endY = MAP_SIZE / 2 - 18;
    return {
      transform: [
        { translateX: startX + (endX - startX) * progress.value },
        { translateY: startY + (endY - startY) * progress.value },
      ],
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const pingStyle = useAnimatedStyle(() => ({
    opacity: pingOpacity.value,
    transform: [{ scale: pingScale.value }],
  }));

  const handleCall = () => {
    Alert.alert(
      RESPONDER.name,
      `Telepon petugas (${RESPONDER.phone})?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Telepon', onPress: () => Linking.openURL(`tel:${RESPONDER.phone}`) },
      ],
    );
  };

  const handleShareLocation = () => {
    if (!userCoords) {
      Alert.alert('!', 'Lokasi belum tersedia.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${userCoords.latitude},${userCoords.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('!', 'Tidak dapat membuka peta.'));
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('rt_title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, arrived && styles.statusBannerArrived]}>
          <View style={[styles.statusDot, arrived && { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusText, arrived && { color: '#065F46' }]}>
            {arrived ? t('rt_arrived') : t('rt_status_active')}
          </Text>
        </View>

        {/* Simulated map view */}
        <View style={styles.mapContainer}>
          <LinearGradient colors={['#EAF3FB', '#F8FBFE']} style={styles.mapBg} />

          {/* Decorative map elements */}
          <View style={[styles.water, { top: 14, right: 22, width: 90, height: 60 }]} />
          <View style={[styles.water, { bottom: 30, left: 30, width: 60, height: 40 }]} />
          <View style={[styles.park, { top: 60, left: 50, width: 70, height: 50 }]} />
          <View style={[styles.park, { bottom: 70, right: 40, width: 80, height: 55 }]} />

          {/* Roads — horizontal */}
          <View style={[styles.road, { top: MAP_SIZE * 0.3, left: 0, right: 0, height: 6 }]} />
          <View style={[styles.road, { top: MAP_SIZE * 0.7, left: 0, right: 0, height: 6 }]} />
          {/* Roads — vertical */}
          <View style={[styles.road, { top: 0, bottom: 0, left: MAP_SIZE * 0.25, width: 6 }]} />
          <View style={[styles.road, { top: 0, bottom: 0, left: MAP_SIZE * 0.6, width: 6 }]} />

          {/* Grid overlay */}
          {[...Array(8)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { top: ((i + 1) * MAP_SIZE) / 9 }]} />
          ))}
          {[...Array(8)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineV, { left: ((i + 1) * MAP_SIZE) / 9 }]} />
          ))}

          {/* Dashed line from responder to user */}
          <View style={styles.pathDashed} />

          {/* User marker (center, with pulse + ping) */}
          <View style={styles.userMarkerWrap}>
            <Animated.View style={[styles.userPing, pingStyle]} />
            <Animated.View style={[styles.userOuter, pulseStyle]}>
              <View style={styles.userInner} />
            </Animated.View>
            <View style={styles.userLabel}>
              <Text style={styles.userLabelText}>{t('rt_you')}</Text>
            </View>
          </View>

          {/* Responder marker (animated) */}
          <Animated.View style={[styles.responderMarker, responderStyle]}>
            <View style={styles.responderPin}>
              <MaterialCommunityIcons name="ambulance" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.responderPinTail} />
          </Animated.View>
        </View>

        {/* ETA card */}
        <View style={styles.etaCard}>
          <View style={styles.etaCol}>
            <Text style={styles.etaLabel}>{t('rt_eta')}</Text>
            <Text style={[styles.etaValue, arrived && { color: '#10B981' }]}>{formatEta(etaSec, t)}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaCol}>
            <Text style={styles.etaLabel}>{t('rt_distance')}</Text>
            <Text style={[styles.etaValue, arrived && { color: '#10B981' }]}>{formatDistance(distance, t)}</Text>
          </View>
        </View>

        {/* Responder card */}
        <Text style={styles.section}>{t('rt_responder_section')}</Text>
        <View style={styles.responderCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{RESPONDER.initials}</Text>
          </View>
          <View style={styles.responderInfo}>
            <Text style={styles.responderName}>{RESPONDER.name}</Text>
            <Text style={styles.responderUnit}>
              <Text style={styles.responderMetaLabel}>{t('rt_unit_label')}: </Text>
              {RESPONDER.unit}
            </Text>
            <Text style={styles.responderUnit}>
              <Text style={styles.responderMetaLabel}>{t('rt_vehicle_label')}: </Text>
              {RESPONDER.vehicle}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShareLocation}>
            <Ionicons name="location" size={18} color="#003B71" />
            <Text style={styles.secondaryText}>{t('rt_share_location')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>{t('rt_call_responder')}</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#003B71' },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12,
  },
  statusBannerArrived: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EA580C' },
  statusText: { fontSize: 13, color: '#9A3412', fontWeight: '700', flex: 1 },

  // Map
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE * 0.55,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAF3FB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  mapBg: { ...StyleSheet.absoluteFillObject },
  water: {
    position: 'absolute',
    backgroundColor: '#BFDBFE',
    borderRadius: 16,
    opacity: 0.55,
  },
  park: {
    position: 'absolute',
    backgroundColor: '#BBF7D0',
    borderRadius: 12,
    opacity: 0.5,
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(12,79,141,0.05)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: 'rgba(12,79,141,0.05)',
  },
  pathDashed: {
    position: 'absolute',
    top: 64,
    left: 64,
    width: MAP_SIZE / 2 - 70,
    height: MAP_SIZE * 0.55 / 2 - 70,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(220,38,38,0.4)',
    borderStyle: 'dashed',
    borderBottomLeftRadius: 16,
  },

  // User marker (center)
  userMarkerWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(12,79,141,0.4)',
  },
  userOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(12,79,141,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0C4F8D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userLabel: {
    position: 'absolute',
    top: 36,
    backgroundColor: '#0C4F8D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userLabelText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  // Responder marker
  responderMarker: {
    position: 'absolute',
    width: 36,
    height: 44,
    alignItems: 'center',
  },
  responderPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  responderPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DC2626',
    marginTop: -2,
  },

  // ETA card
  etaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  etaCol: { flex: 1, alignItems: 'center', gap: 4 },
  etaDivider: { width: 1, backgroundColor: '#E5E7EB' },
  etaLabel: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  etaValue: { fontSize: 16, fontWeight: '800', color: '#111827' },

  section: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8, marginLeft: 4,
  },

  responderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626' + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#DC2626' },
  responderInfo: { flex: 1, gap: 2 },
  responderName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2 },
  responderUnit: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  responderMetaLabel: { color: '#9CA3AF', fontWeight: '700', fontSize: 10, letterSpacing: 0.3 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#003B71',
  },
  secondaryText: { color: '#003B71', fontSize: 14, fontWeight: '700' },
  primaryBtn: {
    flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', height: 50, borderRadius: 12,
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
