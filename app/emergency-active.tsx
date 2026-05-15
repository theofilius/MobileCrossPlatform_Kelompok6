import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPrimaryContact } from '../services/contactsService';
import { addNotification } from '../services/notificationsService';

const EMERGENCY_FALLBACK = '112';

export default function EmergencyActiveScreen() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Vibration.vibrate([0, 400, 200, 400, 200, 400]);

    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Capture location once for sharing via SMS / Maps
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {}
    })();

    // Log to notification history
    addNotification({
      type: 'sos',
      title: 'SOS aktif',
      body: 'Mode darurat dimulai. Kontak utama sedang dihubungi.',
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Vibration.cancel();
    };
  }, []);

  const targetPhone = (): string => {
    const primary = getPrimaryContact();
    return primary?.phone ? primary.phone.replace(/[^\d+]/g, '') : EMERGENCY_FALLBACK;
  };

  const buildLocationString = (): string => {
    if (!coords) return 'lokasi tidak tersedia';
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  };

  const handleCall = () => {
    const phone = targetPhone();
    const primary = getPrimaryContact();
    const label = primary ? `${primary.name} (${phone})` : `${EMERGENCY_FALLBACK}`;

    Alert.alert(
      'Telepon Darurat',
      `Hubungi ${label}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Telepon',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(() =>
              Alert.alert('!', 'Tidak dapat melakukan panggilan.')
            );
            addNotification({
              type: 'call',
              title: 'Panggilan darurat',
              body: `Menghubungi ${label}`,
            });
          },
        },
      ],
    );
  };

  const handleMessage = () => {
    const phone = targetPhone();
    const locText = buildLocationString();
    const body = encodeURIComponent(`Tolong saya dalam keadaan darurat di titik: ${locText}`);
    // iOS uses & as separator, Android uses ?
    const sep = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${phone}${sep}body=${body}`;

    Linking.openURL(url).catch(() => Alert.alert('!', 'Tidak dapat membuka aplikasi pesan.'));
    addNotification({
      type: 'call',
      title: 'Pesan darurat',
      body: `SMS ke ${phone} dengan lokasi`,
    });
  };

  const handleLocation = () => {
    if (!coords) {
      Alert.alert('!', 'Lokasi belum tersedia. Tunggu beberapa detik.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('!', 'Tidak dapat membuka peta.'));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCancel = () => {
    Alert.alert(
      'Batalkan Darurat?',
      'Mode darurat akan dinonaktifkan dan kontak kamu akan diberitahu.',
      [
        { text: 'Tidak, tetap aktif', style: 'cancel' },
        { text: 'Batalkan Darurat', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <LinearGradient colors={['#7F1D1D', '#DC2626']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Top — badge + visual weight */}
        <View style={styles.topSection}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>DARURAT AKTIF</Text>
          </View>
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={72}
            color="rgba(255,255,255,0.15)"
            style={styles.shieldIcon}
          />

          <TouchableOpacity
            style={styles.trackingBtn}
            onPress={() => router.push('/responder-tracking' as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#FFFFFF" />
            <Text style={styles.trackingBtnText}>Lihat Pelacakan Responder</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Middle — timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.statusText}>
            {(() => {
              const p = getPrimaryContact();
              return p ? `Menghubungi ${p.name}...` : 'Menghubungi nomor darurat 112...';
            })()}
          </Text>
        </View>

        {/* Bottom — actions + cancel */}
        <View style={styles.bottomSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Ionicons name="call" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Telepon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Pesan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, !coords && styles.actionBtnDisabled]}
              onPress={handleLocation}
              disabled={!coords}
            >
              <Ionicons name="location" size={26} color={coords ? '#DC2626' : 'rgba(220,38,38,0.4)'} />
              <Text style={[styles.actionLabel, !coords && { color: 'rgba(220,38,38,0.4)' }]}>Lokasi</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Batalkan Darurat</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 16,
  },

  // Top
  topSection: {
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEF08A',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },
  shieldIcon: {
    marginTop: 20,
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
  trackingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Middle
  timerSection: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Bottom
  bottomSection: {},
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  actionBtn: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
