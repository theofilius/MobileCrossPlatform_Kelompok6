import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';

type Topic = {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  symptoms: string[];
  steps: string[];
  donts: string[];
  whenCall: string;
};

const TOPICS: Topic[] = [
  {
    id: 'cpr',
    title: 'CPR (Resusitasi Jantung Paru)',
    icon: 'heart-pulse',
    color: '#DC2626',
    bg: '#FEF2F2',
    symptoms: [
      'Korban tidak sadar dan tidak merespons panggilan',
      'Tidak bernapas atau napas tidak normal (terengah-engah)',
      'Tidak ada denyut nadi di leher (carotid)',
    ],
    steps: [
      'Pastikan area aman, baringkan korban telentang di permukaan keras dan rata',
      'Letakkan tumit telapak tangan di tengah dada (antara puting), tangan lain di atasnya, jari saling mengunci',
      'Tekan keras dan cepat: 30 kompresi, kedalaman 5–6 cm, kecepatan 100–120 per menit',
      'Berikan 2 napas buatan: angkat dagu, tutup hidung, hembuskan napas hingga dada terangkat',
      'Ulangi siklus 30 kompresi + 2 napas hingga responder tiba atau korban sadar',
    ],
    donts: [
      'JANGAN berhenti CPR sebelum bantuan medis datang',
      'JANGAN menekan terlalu lemah — kompresi harus cukup dalam',
      'JANGAN memberikan air atau makanan ke korban tidak sadar',
    ],
    whenCall: 'Telepon 119 / 112 SEGERA sebelum mulai CPR. Jika ada AED terdekat, gunakan.',
  },
  {
    id: 'choking',
    title: 'Tersedak (Heimlich Maneuver)',
    icon: 'lungs',
    color: '#EA580C',
    bg: '#FFF7ED',
    symptoms: [
      'Korban memegang leher, tidak bisa bicara/batuk',
      'Wajah membiru, sulit bernapas',
      'Suara napas berdesis atau hilang',
    ],
    steps: [
      'Berdiri di belakang korban, peluk pinggangnya dari belakang',
      'Kepalkan satu tangan, letakkan ibu jari di atas pusar (di bawah tulang dada)',
      'Pegang kepalan dengan tangan lain, dorong ke dalam dan ke atas dengan cepat',
      'Ulangi hentakan sampai benda keluar atau korban bisa bernapas',
      'Untuk bayi <1 thn: tepuk punggung 5x sambil tubuh dimiringkan, lalu kompresi dada 5x',
    ],
    donts: [
      'JANGAN tepuk punggung orang dewasa yang masih bisa batuk',
      'JANGAN coba mengambil benda dengan jari kalau tidak terlihat',
    ],
    whenCall: 'Telepon 119 jika setelah 5x hentakan benda belum keluar.',
  },
  {
    id: 'bleeding',
    title: 'Pendarahan Hebat',
    icon: 'water',
    color: '#B91C1C',
    bg: '#FEF2F2',
    symptoms: [
      'Darah mengalir deras atau menyembur',
      'Korban pucat, lemas, atau pingsan',
      'Pernapasan cepat, denyut nadi lemah',
    ],
    steps: [
      'Pakai sarung tangan / plastik untuk melindungi diri dari kontak darah',
      'Tekan langsung luka dengan kain bersih / kasa selama minimal 10 menit',
      'Angkat bagian tubuh yang berdarah lebih tinggi dari jantung jika memungkinkan',
      'Jika darah tembus, tambah lapisan kain di atasnya (jangan dibuka)',
      'Untuk luka di lengan/tungkai dengan darah tidak terkontrol, pasang tourniquet 5–7 cm di atas luka',
    ],
    donts: [
      'JANGAN buka lapisan kain pertama walau basah oleh darah',
      'JANGAN beri minum jika korban sadar setengah',
      'JANGAN cabut benda yang menancap di luka',
    ],
    whenCall: 'Telepon 119 untuk semua pendarahan hebat yang tidak berhenti dalam 10 menit.',
  },
  {
    id: 'burn',
    title: 'Luka Bakar',
    icon: 'fire',
    color: '#F97316',
    bg: '#FFF7ED',
    symptoms: [
      'Kulit kemerahan, bengkak (derajat 1)',
      'Melepuh, sangat nyeri (derajat 2)',
      'Kulit hitam/putih kering, tidak nyeri (derajat 3 — paling berat)',
    ],
    steps: [
      'Jauhkan korban dari sumber panas/api',
      'Aliri area luka bakar dengan air mengalir bersuhu ruang selama 15–20 menit',
      'Lepaskan perhiasan/pakaian dari area sebelum bengkak (jika tidak menempel)',
      'Tutup luka dengan kain bersih kering atau plastik wrap longgar',
      'Berikan paracetamol untuk meredakan nyeri',
    ],
    donts: [
      'JANGAN olesi pasta gigi, mentega, kecap, atau ramuan apapun',
      'JANGAN pecahkan lepuhan',
      'JANGAN gunakan es batu langsung (bisa rusak jaringan)',
    ],
    whenCall: 'Telepon 119 untuk: luka bakar derajat 3, luas >5 cm, di wajah/tangan/genital, atau pada anak/lansia.',
  },
  {
    id: 'fracture',
    title: 'Patah Tulang',
    icon: 'bone',
    color: '#7C3AED',
    bg: '#F5F3FF',
    symptoms: [
      'Nyeri hebat, bengkak, memar',
      'Bagian tubuh terlihat tidak normal (bengkok, lebih pendek)',
      'Tulang menonjol keluar (patah terbuka)',
      'Sulit/tidak bisa menggerakkan bagian tubuh',
    ],
    steps: [
      'Imobilisasi: jangan biarkan korban menggerakkan bagian yang patah',
      'Pasang bidai/papan/kayu di kedua sisi tulang yang patah, ikat dengan kain',
      'Bidai harus mencakup sendi di atas dan di bawah patahan',
      'Untuk patah terbuka: tutup luka dengan kain bersih, jangan dorong tulang masuk',
      'Berikan kompres es (terbungkus kain) untuk meredakan bengkak',
    ],
    donts: [
      'JANGAN luruskan tulang yang patah',
      'JANGAN beri makan/minum (jika perlu operasi)',
      'JANGAN pindahkan korban kecuali ada bahaya lain',
    ],
    whenCall: 'Telepon 119 untuk semua dugaan patah tulang, terutama di tulang belakang/leher/panggul.',
  },
  {
    id: 'heart-attack',
    title: 'Serangan Jantung',
    icon: 'heart-broken',
    color: '#DC2626',
    bg: '#FEF2F2',
    symptoms: [
      'Nyeri/tekanan dada seperti diremas (>5 menit)',
      'Nyeri menjalar ke lengan kiri, leher, rahang, atau punggung',
      'Sesak napas, keringat dingin, mual',
      'Pusing, pingsan, jantung berdebar',
    ],
    steps: [
      'Telepon 119 SEGERA — waktu sangat kritis',
      'Dudukkan korban dengan punggung bersandar, kaki diangkat',
      'Longgarkan pakaian ketat (kerah, dasi, ikat pinggang)',
      'Jika korban tidak alergi & sadar, berikan aspirin 300 mg dikunyah',
      'Pantau napas dan nadi. Jika berhenti → mulai CPR',
    ],
    donts: [
      'JANGAN biarkan korban bergerak/jalan sendiri',
      'JANGAN beri makanan/minuman selain aspirin',
      'JANGAN tunggu "gejala mereda" — setiap menit menentukan',
    ],
    whenCall: 'Telepon 119 LANGSUNG. Jangan menunda; semakin cepat, semakin tinggi peluang selamat.',
  },
  {
    id: 'faint',
    title: 'Pingsan',
    icon: 'human-handsdown',
    color: '#0C4F8D',
    bg: '#EFF6FF',
    symptoms: [
      'Kehilangan kesadaran mendadak',
      'Kulit pucat, keringat dingin',
      'Napas dangkal, nadi lemah',
      'Pulih spontan dalam 1–2 menit',
    ],
    steps: [
      'Baringkan korban telentang di tempat datar',
      'Angkat kedua kaki 30 cm dari lantai untuk aliran darah ke otak',
      'Longgarkan pakaian, beri ruang udara segar',
      'Cek pernapasan. Jika tidak bernapas → mulai CPR',
      'Setelah sadar, jangan langsung berdiri — duduk dulu 5–10 menit',
    ],
    donts: [
      'JANGAN beri minum saat korban masih setengah sadar',
      'JANGAN tepuk-tepuk pipi keras',
      'JANGAN siram air ke wajah',
    ],
    whenCall: 'Telepon 119 jika korban tidak sadar >2 menit, cedera kepala, atau pingsan berulang.',
  },
  {
    id: 'snake-bite',
    title: 'Gigitan Ular',
    icon: 'snake',
    color: '#059669',
    bg: '#F0FDF4',
    symptoms: [
      'Dua bekas taring di kulit, bengkak, nyeri',
      'Mual, muntah, keringat dingin',
      'Pandangan kabur, sulit bernapas (ular berbisa)',
      'Lemas, denyut jantung cepat',
    ],
    steps: [
      'Jauhkan korban dari ular, ingat bentuk/warna ular jika memungkinkan (untuk antivenom)',
      'Tenangkan korban, jangan biarkan banyak bergerak (memperlambat penyebaran bisa)',
      'Posisikan area gigitan LEBIH RENDAH dari jantung',
      'Lepaskan perhiasan/jam yang dekat area gigitan',
      'Tutup luka dengan kain bersih, bawa ke RS terdekat',
    ],
    donts: [
      'JANGAN isap bisa dengan mulut',
      'JANGAN sayat luka',
      'JANGAN pasang tourniquet ketat',
      'JANGAN beri alkohol atau kopi',
    ],
    whenCall: 'Telepon 119 dan menuju RS yang punya antivenom. Setiap menit penting.',
  },
];

function TopicCard({ topic, expanded, onToggle }: { topic: Topic; expanded: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: topic.bg }]}>
          <MaterialCommunityIcons name={topic.icon as any} size={22} color={topic.color} />
        </View>
        <Text style={styles.cardTitle}>{topic.title}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>

          <Text style={styles.sectionLabel}>{t('learn_symptoms')}</Text>
          {topic.symptoms.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: topic.color }]} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}

          <Text style={styles.sectionLabel}>{t('learn_steps')}</Text>
          {topic.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: topic.color }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { color: '#DC2626' }]}>{t('learn_donts')}</Text>
          {topic.donts.map((d, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="close-circle" size={14} color="#DC2626" style={{ marginTop: 2 }} />
              <Text style={[styles.bulletText, { color: '#7F1D1D' }]}>{d}</Text>
            </View>
          ))}

          <View style={styles.callBox}>
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.callText}>{topic.whenCall}</Text>
          </View>

        </View>
      )}
    </View>
  );
}

export default function FirstAidScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('learn_first_aid_title')}</Text>
            <Text style={styles.headerSub}>{TOPICS.length} {t('learn_topic_count')}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>{t('learn_first_aid_sub')}</Text>

          {TOPICS.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              expanded={openId === topic.id}
              onToggle={() => setOpenId(openId === topic.id ? null : topic.id)}
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

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
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
    marginTop: 0,
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
