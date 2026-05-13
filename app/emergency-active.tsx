import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmergencyActiveScreen() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Vibration.vibrate([0, 400, 200, 400, 200, 400]);

    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Vibration.cancel();
    };
  }, []);

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
        </View>

        {/* Middle — timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.statusText}>Menghubungi kontak darurat...</Text>
        </View>

        {/* Bottom — actions + cancel */}
        <View style={styles.bottomSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="call" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Telepon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Pesan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="location" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Lokasi</Text>
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
