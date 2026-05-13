import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

const benefits = [
  {
    icon: 'map-marker-radius' as const,
    title: 'Respons lebih cepat',
    desc: 'Tim bantuan langsung mengetahui posisi kamu',
  },
  {
    icon: 'account-multiple' as const,
    title: 'Kontak darurat diberitahu',
    desc: 'Orang terdekat menerima lokasi kamu secara real-time',
  },
  {
    icon: 'shield-lock' as const,
    title: 'Privasi terjaga',
    desc: 'Lokasi hanya dibagikan saat mode darurat aktif',
  },
];

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleAllow = async () => {
    await Location.requestForegroundPermissionsAsync();
    router.replace('/(tabs)' as any);
  };

  const handleSkip = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#EEF5FC']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="map-marker-radius" size={40} color="#003B71" />
          </View>
          <Text style={styles.title}>Aktifkan Lokasi</Text>
          <Text style={styles.subtitle}>
            Untuk mengirim bantuan dengan cepat, kami butuh akses lokasi kamu.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          {benefits.map((b, i) => (
            <View
              key={i}
              style={[styles.benefitRow, i < benefits.length - 1 && styles.benefitDivider]}
            >
              <View style={styles.benefitIconBox}>
                <MaterialCommunityIcons name={b.icon} size={20} color="#003B71" />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.allowBtn} onPress={handleAllow}>
            <Text style={styles.allowText}>Izinkan Lokasi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Lewati untuk sekarang</Text>
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
    paddingTop: 40,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0,59,113,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A6B8A',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  benefitDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,59,113,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitText: { flex: 1 },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  spacer: { flex: 1 },
  buttons: {},
  allowBtn: {
    backgroundColor: '#003B71',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  allowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
