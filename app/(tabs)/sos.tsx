import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyType } from '../../services/reportService';

type Category = {
  type: EmergencyType;
  label: string;
  subtitle: string;
  icon: string;
  iconSet: 'material' | 'ionicon';
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  {
    type: 'fire',
    label: 'Kebakaran',
    subtitle: 'Gedung, hutan, kendaraan',
    icon: 'fire',
    iconSet: 'material',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  {
    type: 'accident',
    label: 'Kecelakaan',
    subtitle: 'Lalu lintas, industri',
    icon: 'car-crash',
    iconSet: 'material',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
  {
    type: 'crime',
    label: 'Kriminalitas',
    subtitle: 'Pencurian, kekerasan',
    icon: 'shield-alert',
    iconSet: 'material',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    type: 'disaster',
    label: 'Bencana Alam',
    subtitle: 'Banjir, gempa, longsor',
    icon: 'weather-lightning-rainy',
    iconSet: 'material',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    type: 'medical',
    label: 'Darurat Medis',
    subtitle: 'Pingsan, luka, serangan',
    icon: 'medical-bag',
    iconSet: 'material',
    color: '#059669',
    bg: '#F0FDF4',
  },
  {
    type: 'other',
    label: 'Lainnya',
    subtitle: 'Kejadian lain',
    icon: 'alert-circle-outline',
    iconSet: 'ionicon',
    color: '#4B5563',
    bg: '#F9FAFB',
  },
];

export default function SOSScreen() {
  const router = useRouter();

  const handleCategory = (type: EmergencyType) => {
    router.push({ pathname: '/report-form', params: { type } } as any);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Laporkan Kejadian</Text>
            <Text style={styles.subtitle}>Pilih jenis kejadian darurat yang ingin kamu laporkan</Text>
          </View>

          {/* Emergency number banner */}
          <View style={styles.emergencyBanner}>
            <View style={styles.bannerLeft}>
              <MaterialCommunityIcons name="phone-alert" size={22} color="#FFFFFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.bannerLabel}>Nomor Darurat Nasional</Text>
                <Text style={styles.bannerNumber}>112</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color="#003B71" />
              <Text style={styles.callBtnText}>Telepon</Text>
            </TouchableOpacity>
          </View>

          {/* Category grid */}
          <Text style={styles.sectionLabel}>Pilih Kategori</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.type}
                style={[styles.card, { backgroundColor: cat.bg, borderColor: cat.color + '33' }]}
                onPress={() => handleCategory(cat.type)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconBox, { backgroundColor: cat.color + '18' }]}>
                  {cat.iconSet === 'material' ? (
                    <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                  ) : (
                    <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                  )}
                </View>
                <Text style={[styles.cardLabel, { color: cat.color }]}>{cat.label}</Text>
                <Text style={styles.cardSub}>{cat.subtitle}</Text>
                <View style={[styles.cardArrow, { backgroundColor: cat.color }]}>
                  <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick emergency numbers */}
          <Text style={styles.sectionLabel}>Nomor Darurat Lainnya</Text>
          <View style={styles.numbersCard}>
            {[
              { label: 'Polisi', number: '110', icon: 'shield-checkmark', color: '#2563EB' },
              { label: 'Ambulans', number: '119', icon: 'medical', color: '#059669' },
              { label: 'Damkar', number: '113', icon: 'flame', color: '#DC2626' },
              { label: 'SAR', number: '115', icon: 'boat', color: '#7C3AED' },
            ].map(item => (
              <TouchableOpacity key={item.number} style={styles.numberRow}>
                <View style={[styles.numberIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.numberInfo}>
                  <Text style={styles.numberLabel}>{item.label}</Text>
                </View>
                <Text style={[styles.numberDigit, { color: item.color }]}>{item.number}</Text>
                <Ionicons name="call-outline" size={16} color={item.color} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  header: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  emergencyBanner: {
    backgroundColor: '#003B71',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  bannerNumber: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  callBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: '#003B71' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  card: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    lineHeight: 15,
  },
  cardArrow: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  numbersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  numberIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberInfo: { flex: 1 },
  numberLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  numberDigit: { fontSize: 18, fontWeight: '800' },
});