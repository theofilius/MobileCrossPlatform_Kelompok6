import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';

type Disaster = {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  before: string[];
  during: string[];
  after: string[];
  whenCall: string;
};

const DISASTERS: Disaster[] = [
  {
    id: 'earthquake',
    title: 'Gempa Bumi',
    icon: 'pulse',
    color: '#B45309',
    bg: '#FFFBEB',
    before: [
      'Pastikan rumah tahan gempa, perabot berat diikat ke dinding',
      'Siapkan tas darurat: senter, air, P3K, dokumen penting, baterai',
      'Latih anggota keluarga rute evakuasi & titik kumpul aman',
      'Identifikasi ruang aman: bawah meja kokoh, dekat dinding interior',
    ],
    during: [
      'DROP — jatuhkan badan ke lantai, jangan lari saat goncangan',
      'COVER — lindungi kepala/leher di bawah meja kokoh, jauhi kaca/lemari tinggi',
      'HOLD ON — pegang meja sampai goncangan berhenti',
      'Jika di luar: menjauh dari gedung, tiang listrik, pohon',
      'Jika di kendaraan: berhenti di area terbuka, jangan keluar mobil',
    ],
    after: [
      'Periksa diri & orang sekitar dari cedera',
      'Waspada gempa susulan (aftershock) yang bisa terjadi 24 jam',
      'Matikan listrik, gas, dan air jika ada kerusakan',
      'Jangan masuk ke gedung retak — tunggu petugas',
      'Dengarkan info resmi dari BMKG/BPBD via radio/HP',
    ],
    whenCall: 'Telepon 119 untuk korban luka. Lapor 117 (BNPB) untuk kerusakan struktural berat.',
  },
  {
    id: 'flood',
    title: 'Banjir',
    icon: 'home-flood',
    color: '#2563EB',
    bg: '#EFF6FF',
    before: [
      'Pantau prakiraan cuaca BMKG, terutama saat musim hujan',
      'Bersihkan saluran air, jangan buang sampah di sungai',
      'Simpan barang berharga & dokumen di tempat tinggi/kedap air',
      'Catat nomor darurat BPBD setempat',
      'Siapkan tas siaga dengan pakaian kering, obat, makanan tahan lama',
    ],
    during: [
      'Pindah ke tempat tinggi/lantai atas segera',
      'Matikan listrik dari MCB sebelum air mencapai stop kontak',
      'Hindari berjalan/berkendara di air bergerak (>15 cm bisa menyeret)',
      'Jangan menyentuh peralatan listrik dengan tangan/kaki basah',
      'Pakai sepatu/sandal untuk lindungi kaki dari benda tajam',
    ],
    after: [
      'Tunggu pemberitahuan resmi sebelum kembali ke rumah',
      'Periksa kerusakan struktural sebelum masuk rumah',
      'Buang makanan & obat yang terkena air banjir',
      'Bersihkan rumah dengan disinfektan, gunakan masker & sarung tangan',
      'Waspada penyakit pasca banjir: leptospirosis, diare, DBD',
    ],
    whenCall: 'Telepon 112 / BPBD jika terjebak air tinggi. 119 untuk korban yang sakit/terluka.',
  },
  {
    id: 'tsunami',
    title: 'Tsunami',
    icon: 'waves',
    color: '#0E7490',
    bg: '#ECFEFF',
    before: [
      'Kenali zona bahaya tsunami jika tinggal di pesisir',
      'Identifikasi rute evakuasi vertikal & lokasi shelter tinggi',
      'Latihan evakuasi keluarga ke tempat tinggi minimal 20 meter',
      'Pasang aplikasi/notifikasi peringatan tsunami BMKG',
    ],
    during: [
      'Setelah gempa besar di pesisir, JANGAN tunggu sirine — segera evakuasi',
      'Tanda alam: air laut surut tiba-tiba, suara gemuruh dari laut',
      'Lari ke tempat tinggi (>20 m) atau ke daratan sejauh >2 km',
      'Jika tidak sempat: panjat gedung tinggi/pohon kokoh',
      'Bawa tas siaga, jangan kembali ambil barang',
    ],
    after: [
      'Tetap di tempat tinggi sampai pemerintah menyatakan aman',
      'Tsunami sering datang dalam beberapa gelombang, gelombang kedua bisa lebih besar',
      'Hindari area yang tergenang, banyak puing & arus deras',
      'Bantu korban lain hanya jika kondisi aman',
    ],
    whenCall: 'Hubungi 112 atau BPBD untuk evakuasi & info shelter. Dengarkan radio darurat.',
  },
  {
    id: 'volcano',
    title: 'Gunung Meletus',
    icon: 'volcano',
    color: '#DC2626',
    bg: '#FEF2F2',
    before: [
      'Cek status gunung di magma.esdm.go.id atau aplikasi MAGMA',
      'Siapkan masker N95, kacamata pelindung, & senter',
      'Kenali radius bahaya (KRB I, II, III) tempat tinggal',
      'Siapkan rencana evakuasi sesuai zona kamu',
    ],
    during: [
      'Ikuti instruksi evakuasi dari BPBD/PVMBG',
      'Lindungi pernapasan dengan masker / kain basah',
      'Lindungi mata dari debu vulkanik dengan kacamata',
      'Jauhi sungai/lembah — bahaya lahar dingin',
      'Bagi yang di rumah: tutup semua ventilasi, jendela, pintu',
    ],
    after: [
      'Tetap di pengungsian sampai dinyatakan aman',
      'Bersihkan abu vulkanik dari atap (bisa runtuh karena berat)',
      'Hindari aktivitas luar saat hujan abu — gunakan masker',
      'Tutup makanan & minuman dari kontaminasi abu',
      'Waspada lahar dingin saat musim hujan pasca erupsi',
    ],
    whenCall: 'Hubungi 112 / BPBD untuk evakuasi. Posko PVMBG untuk info status gunung.',
  },
  {
    id: 'landslide',
    title: 'Tanah Longsor',
    icon: 'image-filter-hdr',
    color: '#92400E',
    bg: '#FEF3C7',
    before: [
      'Hindari membangun rumah di lereng curam',
      'Tanam pohon berakar dalam di sekitar lereng',
      'Buat saluran drainase yang baik',
      'Pantau prakiraan hujan ekstrem',
    ],
    during: [
      'Tanda awal: retakan baru di tanah, pohon miring, bunyi gemuruh',
      'Segera lari ke sisi tegak lurus arah longsoran',
      'Hindari dasar lembah & dekat sungai (jalur longsor)',
      'Jika dalam kendaraan: keluar & lari ke sisi tinggi',
      'Lindungi kepala dengan tangan jika tidak bisa lari',
    ],
    after: [
      'Tetap jauh dari area longsor — bisa terjadi longsor susulan',
      'Bantu korban yang terlihat hanya jika kondisi stabil',
      'Lapor ke BPBD untuk pencarian korban',
      'Periksa kerusakan infrastruktur: listrik, gas, air',
    ],
    whenCall: 'Telepon 112 / BPBD untuk evakuasi & SAR. 119 untuk korban luka.',
  },
  {
    id: 'fire',
    title: 'Kebakaran',
    icon: 'fire-alert',
    color: '#EA580C',
    bg: '#FFF7ED',
    before: [
      'Pasang detektor asap di area tidur dan dapur',
      'Sediakan APAR (alat pemadam api ringan) di tempat strategis',
      'Buat rencana evakuasi keluarga + 2 jalur keluar',
      'Jangan menumpuk kabel, periksa instalasi listrik berkala',
    ],
    during: [
      'Telepon 113 (Damkar) atau 112 SEGERA',
      'Jika api kecil & ada APAR: PASS — Pull, Aim, Squeeze, Sweep',
      'Jika api besar: keluar segera, tutup pintu untuk perlambat penyebaran',
      'Berjalan merangkak rendah untuk hindari asap',
      'Jika baju terbakar: STOP — DROP — ROLL (berhenti, jatuh, guling)',
      'Sentuh pintu sebelum dibuka — jika panas, cari jalur lain',
    ],
    after: [
      'Jangan kembali masuk gedung sampai dinyatakan aman',
      'Periksa cedera, hubungi medis untuk luka bakar',
      'Lapor asuransi, foto kerusakan',
      'Hindari makanan/obat yang terkena asap pekat',
    ],
    whenCall: 'Telepon 113 (Damkar) atau 112 segera. 119 untuk korban luka bakar / asap.',
  },
];

function DisasterCard({ disaster, expanded, onToggle }: { disaster: Disaster; expanded: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: disaster.bg }]}>
          <MaterialCommunityIcons name={disaster.icon as any} size={22} color={disaster.color} />
        </View>
        <Text style={styles.cardTitle}>{disaster.title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>

          <Text style={[styles.phaseLabel, { color: '#0C4F8D' }]}>
            <Ionicons name="time-outline" size={12} /> {t('learn_before')}
          </Text>
          {disaster.before.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: '#0C4F8D' }]} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}

          <Text style={[styles.phaseLabel, { color: '#DC2626' }]}>
            <Ionicons name="warning-outline" size={12} /> {t('learn_during')}
          </Text>
          {disaster.during.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: disaster.color }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}

          <Text style={[styles.phaseLabel, { color: '#059669' }]}>
            <Ionicons name="checkmark-circle-outline" size={12} /> {t('learn_after')}
          </Text>
          {disaster.after.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: '#059669' }]} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}

          <View style={styles.callBox}>
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.callText}>{disaster.whenCall}</Text>
          </View>

        </View>
      )}
    </View>
  );
}

export default function DisasterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('learn_disaster_title')}</Text>
            <Text style={styles.headerSub}>{DISASTERS.length} {t('learn_topic_count')}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>{t('learn_disaster_sub')}</Text>

          {DISASTERS.map(d => (
            <DisasterCard
              key={d.id}
              disaster={d}
              expanded={openId === d.id}
              onToggle={() => setOpenId(openId === d.id ? null : d.id)}
            />
          ))}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#003B71' },
  headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  intro: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  phaseLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  callBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0C4F8D',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  callText: { flex: 1, color: '#FFFFFF', fontSize: 12, fontWeight: '600', lineHeight: 17 },
});
