import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getContactCount, subscribe as subscribeContacts } from '../../services/contactsService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const pulse = useSharedValue(1);
  const [locationName, setLocationName] = useState('Memuat lokasi...');
  const [isHolding, setIsHolding] = useState(false);
  const [holdCount, setHoldCount] = useState(3);
  const [contactCount, setContactCount] = useState(getContactCount());
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  useEffect(() => {
    return subscribeContacts(c => setContactCount(c.length));
  }, []);

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Akses ditolak');
          return;
        }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          async ({ coords }) => {
            try {
              const [place] = await Location.reverseGeocodeAsync(coords);
              if (place) setLocationName(`${place.city || place.subregion}, ${place.region}`);
            } catch {}
          }
        );
      } catch {
        setLocationName('Gagal memuat lokasi');
      }
    })();

    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true
    );

    return () => { sub?.remove(); };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handleSOSPressIn = () => {
    setIsHolding(true);
    setHoldCount(3);

    let count = 2;
    holdTimerRef.current = setInterval(() => {
      setHoldCount(count);
      count -= 1;
    }, 1000);

    holdTimeoutRef.current = setTimeout(() => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setIsHolding(false);
      setHoldCount(3);
      router.push('/emergency-active' as any);
    }, 3000);
  };

  const handleSOSPressOut = () => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    setIsHolding(false);
    setHoldCount(3);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBox}>
                <MaterialCommunityIcons name="shield-cross" size={20} color="#0C4F8D" />
              </View>
              <View>
                <Text style={styles.locationLabel}>{t('home_your_location')}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={11} color="#003B71" />
                  <Text style={styles.locationText}>{locationName}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications' as any)}>
              <Ionicons name="notifications-outline" size={22} color="#003B71" />
            </TouchableOpacity>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.greeting}>{t('signup_login') === 'Login' ? 'Hello' : 'Halo'}, {user?.name || '—'}!</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusChip, styles.chipGreen]}>
                <View style={styles.greenDot} />
                <Text style={styles.chipGreenText}>{t('home_gps')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.statusChip, styles.chipBlue]}
                onPress={() => router.push('/emergency-contacts' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={12} color="#003B71" />
                <Text style={styles.chipBlueText}>{contactCount} {t('home_contacts')}</Text>
              </TouchableOpacity>
              <View style={[styles.statusChip, styles.chipGreen]}>
                <MaterialCommunityIcons name="shield-check" size={13} color="#16A34A" />
                <Text style={styles.chipGreenText}>{t('home_protected')}</Text>
              </View>
            </View>
          </View>

          {/* Emergency Card */}
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyLabel}>{t('home_emergency_label')}</Text>

            <View style={styles.sosContainer}>
              <View style={[styles.pulseOuter, isHolding && styles.pulseOuterHolding]}>
                <Animated.View style={[styles.pulseInner, animatedStyle, isHolding && styles.pulseInnerHolding]}>
                  <Pressable
                    style={[styles.sosBtn, isHolding && styles.sosBtnHolding]}
                    onPressIn={handleSOSPressIn}
                    onPressOut={handleSOSPressOut}
                  >
                    {isHolding ? (
                      <Text style={styles.holdCountText}>{holdCount}</Text>
                    ) : (
                      <MaterialCommunityIcons name="gesture-tap-hold" size={36} color="#FFFFFF" />
                    )}
                  </Pressable>
                </Animated.View>
              </View>
            </View>

            <Text style={[styles.sosHelper, isHolding && styles.sosHelperHolding]}>
              {isHolding ? t('home_release_hint') : t('home_hold_hint')}
            </Text>
          </View>

          {/* Learn More */}
          <View style={styles.learnSection}>
            <View style={styles.learnHeader}>
              <Text style={styles.learnTitle}>{t('home_learn')}</Text>
              <Ionicons name="arrow-forward" size={14} color="#003B71" />
            </View>
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/first-aid' as any)}>
              <Text style={styles.pillText}>{t('home_first_aid')}</Text>
              <Ionicons name="chevron-forward-circle-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/disaster' as any)}>
              <Text style={styles.pillText}>{t('home_disaster')}</Text>
              <Ionicons name="chevron-forward-circle-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EEF5FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationLabel: { fontSize: 10, color: '#8D8E8E', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 12, color: '#003B71', fontWeight: '700', marginLeft: 2 },
  bellBtn: { padding: 4 },

  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  chipGreen: { backgroundColor: 'rgba(22,163,74,0.1)' },
  chipBlue: { backgroundColor: 'rgba(0,59,113,0.08)' },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  chipGreenText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  chipBlueText: { fontSize: 11, fontWeight: '700', color: '#003B71' },

  // Emergency Card
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8D8E8E',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseOuter: {
    width: width * 0.46,
    height: width * 0.46,
    borderRadius: width * 0.23,
    borderWidth: 1,
    borderColor: 'rgba(12,79,141,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOuterHolding: {
    borderColor: 'rgba(220,38,38,0.4)',
    borderStyle: 'solid',
    borderWidth: 2,
  },
  pulseInner: {
    width: width * 0.37,
    height: width * 0.37,
    borderRadius: width * 0.185,
    backgroundColor: 'rgba(12,79,141,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInnerHolding: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  sosBtn: {
    width: width * 0.27,
    height: width * 0.27,
    borderRadius: width * 0.135,
    backgroundColor: '#0C4F8D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C4F8D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#2571B8',
  },
  sosBtnHolding: {
    backgroundColor: '#DC2626',
    borderColor: '#FF4444',
    shadowColor: '#DC2626',
  },
  holdCountText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sosHelper: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  sosHelperHolding: {
    color: '#DC2626',
    fontWeight: '600',
  },
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  volunteerLeft: { flex: 1, marginRight: 12 },
  volunteerTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  volunteerSubtitle: { fontSize: 11, color: '#6B7280' },

  // Learn More
  learnSection: {},
  learnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  learnTitle: { fontSize: 14, fontWeight: '700', color: '#003B71' },
  pill: {
    backgroundColor: '#003B71',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 24,
    marginBottom: 8,
  },
  pillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
