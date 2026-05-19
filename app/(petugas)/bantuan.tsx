import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY = '#003B71';
const NAVY_DEEP = '#0A2540';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUB = '#94A3B8';
const BG_TOP = '#D2E7FA';
const BG_BOTTOM = '#FFFFFF';
const CARD = '#FFFFFF';
const LAVENDER_BG = '#E8E2FF';
const LAVENDER_FG = '#3B2F8C';

const ADMIN_EMAIL = 'admin@aegiscall.id';
const ADMIN_PHONE = '+62811-1000-2000';

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: 'Bagaimana cara menerima laporan?',
    a: 'Buka tab Beranda lalu pilih laporan dengan status Menunggu. Tap "Tangani Laporan" untuk mengambil tugas. Kamu bisa menangani beberapa laporan bersamaan.',
  },
  {
    q: 'Apa arti tiap status laporan?',
    a: 'Menunggu: laporan belum diterima petugas. Diterima: kamu sudah mengambil tugas. OTW: kamu dalam perjalanan ke lokasi. Di Lokasi: kamu sudah tiba. Selesai: penanganan selesai. Batal: laporan dibatalkan pelapor/admin.',
  },
  {
    q: 'Bagaimana cara mengubah status laporan?',
    a: 'Buka detail laporan, scroll ke bagian "Update Status Penanganan", lalu tap langkah berikutnya. Status hanya bisa naik bertahap (Diterima → OTW → Di Lokasi → Selesai).',
  },
  {
    q: 'Bagaimana cara menghubungi pelapor?',
    a: 'Di halaman detail laporan, tap nomor telepon pelapor untuk panggilan langsung, atau gunakan tombol Chat Pelapor untuk berkirim pesan, foto, dan voice note.',
  },
  {
    q: 'Bagaimana cara menavigasi ke lokasi?',
    a: 'Di detail laporan, tap "Navigasi ke Lokasi". Aplikasi akan menampilkan peta posisi kamu dan korban. Tap "Buka di Google Maps" untuk navigasi turn-by-turn di aplikasi Maps eksternal.',
  },
  {
    q: 'Notifikasi tidak muncul?',
    a: 'Pastikan kamu memberikan izin notifikasi dan koneksi internet stabil. Notifikasi muncul sebagai banner di atas layar saat ada pesan chat atau update laporan.',
  },
  {
    q: 'Tidak bisa login atau lupa password?',
    a: 'Akun petugas dikelola oleh admin pusat. Hubungi admin via email atau nomor di bawah untuk reset password atau perubahan informasi akun.',
  },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqRow}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        style={styles.faqQuestion}
      >
        <Text style={styles.faqQuestionText}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={NAVY}
        />
      </TouchableOpacity>
      {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
    </View>
  );
}

export default function BantuanScreen() {
  const insets = useSafeAreaInsets();

  const handleEmail = () => {
    Linking.openURL(`mailto:${ADMIN_EMAIL}?subject=Bantuan Petugas Aegis Call`).catch(() => null);
  };
  const handleCall = () => {
    Linking.openURL(`tel:${ADMIN_PHONE.replace(/[\s-]/g, '')}`).catch(() => null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_TOP} translucent />
      <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFillObject} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bantuan</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[NAVY, NAVY_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="help-circle" size={28} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Butuh bantuan?</Text>
          <Text style={styles.heroSub}>
            Cek pertanyaan umum di bawah atau hubungi admin pusat untuk masalah akun & teknis.
          </Text>
        </LinearGradient>

        {/* Quick contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.85}>
            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="mail" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.contactTitle}>Email Admin</Text>
            <Text style={styles.contactSub} numberOfLines={1}>{ADMIN_EMAIL}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.85}>
            <View style={[styles.contactIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="call" size={20} color="#15803D" />
            </View>
            <Text style={styles.contactTitle}>Telepon Admin</Text>
            <Text style={styles.contactSub} numberOfLines={1}>{ADMIN_PHONE}</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Pertanyaan Umum</Text>
        <View style={styles.faqCard}>
          {FAQS.map((f, i) => (
            <View key={f.q}>
              <FaqRow item={f} />
              {i < FAQS.length - 1 && <View style={styles.faqDivider} />}
            </View>
          ))}
        </View>

        {/* Tips card */}
        <View style={[styles.tipsCard, { backgroundColor: LAVENDER_BG }]}>
          <Ionicons name="bulb" size={20} color={LAVENDER_FG} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipsTitle, { color: LAVENDER_FG }]}>Tip Penanganan</Text>
            <Text style={[styles.tipsBody, { color: LAVENDER_FG }]}>
              Selalu konfirmasi lokasi & kondisi korban via chat sebelum berangkat. Update status secara real-time supaya pelapor tahu progress.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>Aegis Call · Petugas v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_BOTTOM },

  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: -0.3 },

  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  hero: {
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  heroIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  heroSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 19, fontWeight: '500' },

  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  contactIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontSize: 12.5, fontWeight: '800', color: TEXT },
  contactSub:   { fontSize: 11, color: MUTED, fontWeight: '500' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginTop: 4, marginLeft: 2 },
  faqCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqRow: { paddingHorizontal: 14, paddingVertical: 14 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQuestionText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: TEXT, lineHeight: 19 },
  faqAnswer: { fontSize: 12.5, color: MUTED, lineHeight: 19, marginTop: 8, paddingRight: 28 },
  faqDivider: { height: 1, backgroundColor: '#F1F5F9' },

  tipsCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: 'flex-start',
  },
  tipsTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  tipsBody:  { fontSize: 12.5, lineHeight: 19, fontWeight: '500' },

  footer: { textAlign: 'center', color: SUB, fontSize: 11, marginTop: 6, fontWeight: '500' },
});
