import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ Path sudah disesuaikan mengarah ke folder context yang baru di luar app
import { useLanguage } from '../../context/LanguageContext';
import { EmergencyType } from '../../services/reportService';
import { TranslationKey } from '../../translations';

// ==========================================
// 🛠️ STEP 1 & 2: REGISTRY & DYNAMIC ICON
// ==========================================
type IconFamily = 'ionicon' | 'material' | 'fontawesome5' | 'feather';

const ICON_COMPONENTS: Record<IconFamily, React.ComponentType<any>> = {
  ionicon: Ionicons,
  material: MaterialCommunityIcons,
  fontawesome5: FontAwesome5,
  feather: Feather,
};

type DynamicIconProps = {
  family: IconFamily;
  name: string;
  size: number;
  color: string;
};

function DynamicIcon({ family, name, size, color }: DynamicIconProps) {
  const IconComponent = ICON_COMPONENTS[family];

  if (!IconComponent) {
    console.warn(`[DynamicIcon] Family tidak dikenal: "${family}"`);
    return null;
  }

  return <IconComponent name={name} size={size} color={color} />;
}

// ==========================================
// 🗃️ DATA CATEGORY
// ==========================================
type Category = {
  type: EmergencyType;
  labelKey: TranslationKey;
  subKey: TranslationKey;
  icon: string;
  family: IconFamily; 
  color: string;
  bg: string;
};

// ✅ KITA PERTAHANKAN KODINGANMU KARENA LEBIH BAIK
const CATEGORIES: Category[] = [
  { type: 'fire', labelKey: 'sos_fire', subKey: 'sos_fire_sub', icon: 'fire', family: 'material', color: '#DC2626', bg: '#FEF2F2' },
  { type: 'accident', labelKey: 'sos_accident', subKey: 'sos_accident_sub', icon: 'car-crash', family: 'fontawesome5', color: '#EA580C', bg: '#FFF7ED' },
  { type: 'crime', labelKey: 'sos_crime', subKey: 'sos_crime_sub', icon: 'user-secret', family: 'fontawesome5', color: '#7C3AED', bg: '#F5F3FF' },
  { type: 'disaster', labelKey: 'sos_disaster', subKey: 'sos_disaster_sub', icon: 'weather-lightning-rainy', family: 'material', color: '#2563EB', bg: '#EFF6FF' },
  { type: 'medical', labelKey: 'sos_medical', subKey: 'sos_medical_sub', icon: 'medical', family: 'ionicon', color: '#059669', bg: '#F0FDF4' },
  { type: 'other', labelKey: 'sos_other', subKey: 'sos_other_sub', icon: 'alert-circle-outline', family: 'ionicon', color: '#4B5563', bg: '#F9FAFB' },
];

// ==========================================
// 📱 MAIN COMPONENT
// ==========================================
export default function SOSScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleCategory = (type: EmergencyType) => {
    router.push({ pathname: '/report-form', params: { type } } as any);
  };

  const quickNumbers = useMemo(() => [
    { label: t('sos_police'), number: '110', icon: 'shield-checkmark', family: 'ionicon' as IconFamily, color: '#2563EB' },
    { label: t('sos_ambulance'), number: '119', icon: 'medical-bag', family: 'material' as IconFamily, color: '#059669' },
    { label: t('sos_fire_dept'), number: '113', icon: 'fire-extinguisher', family: 'fontawesome5' as IconFamily, color: '#DC2626' },
    { label: t('sos_sar'), number: '115', icon: 'ship', family: 'fontawesome5' as IconFamily, color: '#7C3AED' },
  ], [t]);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>{t('sos_title')}</Text>
            <Text style={styles.subtitle}>{t('sos_subtitle')}</Text>
          </View>

          {/* 1. BAGIAN GRID KATEGORI */}
          <Text style={styles.sectionLabel}>{t('sos_category')}</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.type}
                style={[styles.card, { backgroundColor: cat.bg, borderColor: cat.color + '33' }]}
                onPress={() => handleCategory(cat.type)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconBox, { backgroundColor: cat.color + '18' }]}>
                  <DynamicIcon family={cat.family} name={cat.icon} size={28} color={cat.color} />
                </View>
                <Text style={[styles.cardLabel, { color: cat.color }]}>{t(cat.labelKey)}</Text>
                <Text style={styles.cardSub}>{t(cat.subKey)}</Text>
                <View style={[styles.cardArrow, { backgroundColor: cat.color }]}>
                  <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2. BAGIAN KARTU 112 */}
          <View style={styles.emergencyBanner}>
            <View style={styles.bannerLeft}>
              <MaterialCommunityIcons name="phone-alert" size={22} color="#FFFFFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.bannerLabel}>{t('sos_emergency_label')}</Text>
                <Text style={styles.bannerNumber}>112</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color="#003B71" />
              <Text style={styles.callBtnText}>{t('sos_call')}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. BAGIAN NOMOR DARURAT LAINNYA */}
          <Text style={styles.sectionLabel}>{t('sos_other_numbers')}</Text>
          <View style={styles.numbersCard}>
            {quickNumbers.map(item => (
              <TouchableOpacity key={item.number} style={styles.numberRow}>
                <View style={[styles.numberIcon, { backgroundColor: item.color + '15' }]}>
                  <DynamicIcon family={item.family} name={item.icon} size={18} color={item.color} />
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  header: { marginBottom: 24 }, 
  title: { fontSize: 22, fontWeight: '800', color: '#003B71', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  
  // Style untuk Kartu 112
  emergencyBanner: {
    backgroundColor: '#003B71', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, 
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  bannerNumber: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  callBtn: {
    backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: '#003B71' },
  
  // Style Lainnya
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }, 
  card: { width: '47%', borderRadius: 16, padding: 16, borderWidth: 1, position: 'relative' },
  iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  cardSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', lineHeight: 15 },
  cardArrow: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  numbersCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  numberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  numberIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberInfo: { flex: 1 },
  numberLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  numberDigit: { fontSize: 18, fontWeight: '800' },
});