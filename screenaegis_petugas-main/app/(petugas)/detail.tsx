import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useReports } from '../../context/ReportsContext';

const C = {
  secondary:    '#0060aa',
  secondaryCont:'#6caeff',
  onSecCont:    '#004175',
  surfaceLow:   '#F3F3F9',
  onSurface:    '#191C20',
  onSurfaceVar: '#424750',
  outline:      '#727781',
  outlineVar:   '#C2C6D2',
  bg:           '#F9F9FF',
  white:        '#FFFFFF',
};

const SERVICE_CONFIG: Record<string, { icon: string; label: string }> = {
  ambulance:       { icon: '🚑', label: 'Ambulans'          },
  police:          { icon: '🚓', label: 'Polisi'            },
  fire_department: { icon: '🚒', label: 'Pemadam Kebakaran' },
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'BARU',      color: '#E65100',       bg: '#FFF3E0' },
  accepted: { label: 'DITERIMA',  color: C.onSecCont,     bg: C.secondaryCont },
  ontheway: { label: 'OTW',       color: '#1565C0',       bg: '#E3F2FD' },
  arrived:  { label: 'TIBA',      color: '#F57F17',       bg: '#FFF9E6' },
  resolved: { label: 'SELESAI',   color: '#2E7D32',       bg: '#E8F5E9' },
};

const STATUS_ORDER = ['accepted', 'ontheway', 'arrived', 'resolved'];

const STATUS_LIST = [
  { key: 'accepted', icon: '✅', label: 'Laporan Diterima'  },
  { key: 'ontheway', icon: '🚑', label: 'Dalam Perjalanan' },
  { key: 'arrived',  icon: '📍', label: 'Tiba di Lokasi'   },
  { key: 'resolved', icon: '✔️', label: 'Selesai'           },
];

export default function DetailScreen() {
  const insets = useSafeAreaInsets();
  const { reportJson } = useLocalSearchParams<{ reportJson: string }>();
  const report = JSON.parse(reportJson || '{}');
  const [status, setStatus] = useState(report.status);
  const { updateStatus } = useReports();

  // Reset status saat navigasi ke laporan berbeda (expo-router bisa cache layar)
  useEffect(() => {
    setStatus(report.status);
  }, [reportJson]);

  const svc         = SERVICE_CONFIG[report.type] || SERVICE_CONFIG.ambulance;
  const badge       = STATUS_BADGE[status]        || STATUS_BADGE.pending;
  const statusIdx   = STATUS_ORDER.indexOf(status);

  const handleUpdateStatus = (newStatus: string) => {
    const labels: Record<string, string> = {
      accepted: 'Laporan Diterima',
      ontheway: 'Dalam Perjalanan',
      arrived:  'Tiba di Lokasi',
      resolved: 'Selesai',
    };
    Alert.alert('Update Status', `Ubah status menjadi "${labels[newStatus]}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Update',
        onPress: () => {
          setStatus(newStatus);
          updateStatus(report.id, newStatus);
          if (newStatus === 'resolved') {
            Alert.alert('✅ Laporan Selesai!', 'Laporan telah diselesaikan.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } else {
            Alert.alert('✅ Status Diupdate', `Status: ${labels[newStatus]}`);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.secondary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Laporan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Kartu Info Laporan ── */}
        <View style={styles.infoCard}>

          {/* Baris atas: icon + nama layanan + badge status */}
          <View style={styles.cardTopRow}>
            <View style={styles.serviceIconBox}>
              <Text style={styles.serviceIconEmoji}>{svc.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceLabel}>{svc.label}</Text>
              <Text style={styles.cardSub}>Dilaporkan {report.createdAt}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Informasi Pelapor */}
          <Text style={styles.fieldLabel}>Informasi Pelapor</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldIcon}>👤</Text>
            <Text style={styles.fieldValue}>{report.userName || '-'}</Text>
          </View>

          {/* Nomor Telepon */}
          <Text style={[styles.fieldLabel, styles.mt14]}>Nomor Telepon</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldIcon}>📞</Text>
            <Text style={styles.fieldValue}>{report.userPhone || '-'}</Text>
          </View>

          {/* Lokasi Kejadian */}
          <Text style={[styles.fieldLabel, styles.mt14]}>Lokasi Kejadian</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldIcon}>📍</Text>
            <Text style={styles.fieldValue}>{report.location?.address || '-'}</Text>
          </View>
          {report.coordinates?.lat ? (
            <Text style={styles.coordText}>
              Koordinat: {report.coordinates.lat}, {report.coordinates.lng}
            </Text>
          ) : null}

          {/* Deskripsi */}
          <Text style={[styles.fieldLabel, styles.mt14]}>Deskripsi</Text>
          <View style={styles.descBox}>
            <Text style={styles.descText}>"{report.description}"</Text>
          </View>
        </View>

        {/* ── Foto Bukti ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Foto Bukti</Text>
          {report.photoUrl ? (
            <Image source={{ uri: report.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.noPicBox}>
              <Text style={styles.noPicIcon}>🖼️</Text>
              <Text style={styles.noPicText}>Belum ada foto bukti</Text>
            </View>
          )}
        </View>

        {/* ── Tombol Navigasi ── */}
        <TouchableOpacity
          style={styles.navigasiBtn}
          onPress={() =>
            router.push({ pathname: '/(petugas)/navigate', params: { reportJson: JSON.stringify(report) } })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.navigasiIcon}>🧭</Text>
          <Text style={styles.navigasiLabel}>Navigasi</Text>
        </TouchableOpacity>

        {/* ── Update Status ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Status</Text>

          {STATUS_LIST.map((s) => {
            const sIdx    = STATUS_ORDER.indexOf(s.key);
            const done    = sIdx < statusIdx;           // sudah terlewat
            const active  = s.key === status;           // status saat ini
            const isNext  = sIdx === statusIdx + 1;     // langkah berikutnya
            const locked  = s.key === 'resolved' && STATUS_ORDER.indexOf(status) < STATUS_ORDER.indexOf('arrived');
            const dimmed  = !done && !active && !isNext; // langkah masa depan biasa

            const highlighted = done || active;

            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.statusItem,
                  highlighted && styles.statusItemDone,
                  (dimmed || locked) && styles.statusItemDimmed,
                ]}
                onPress={() => {
                  if (locked) {
                    Alert.alert('🔒 Terkunci', 'Tiba di lokasi terlebih dahulu sebelum menyelesaikan laporan.');
                    return;
                  }
                  if (dimmed || active || done) return;
                  handleUpdateStatus(s.key);
                }}
                activeOpacity={(dimmed || locked || active || done) ? 1 : 0.72}
              >
                <Text style={styles.statusItemIcon}>{s.icon}</Text>
                <Text style={[
                  styles.statusItemText,
                  highlighted && styles.statusItemTextDone,
                ]}>
                  {s.label}
                </Text>
                {/* Kanan: indikator */}
                {active && <Text style={styles.doneAllIcon}>✔✔</Text>}
                {(isNext && !locked) && <Text style={styles.chevron}>›</Text>}
                {locked && <Text style={styles.lockIcon}>🔒</Text>}
                {(dimmed && !locked) && <Text style={styles.chevron}>›</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────
  header: {
    backgroundColor: C.secondary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn:     { padding: 4 },
  backIcon:    { color: '#fff', fontSize: 26 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // ── Info Card ────────────────────────────────────────
  infoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.secondary,
    elevation: 2,
    shadowColor: '#003465',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTopRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  serviceIconBox:  { width: 56, height: 56, borderRadius: 14, backgroundColor: '#D3E4FF', alignItems: 'center', justifyContent: 'center' },
  serviceIconEmoji:{ fontSize: 28 },
  serviceLabel:    { fontSize: 16, fontWeight: '700', color: C.secondary },
  cardSub:         { fontSize: 12, color: C.onSurfaceVar, marginTop: 3 },
  badge:           { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  divider:         { height: 1, backgroundColor: C.outlineVar, marginBottom: 16 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.outline, textTransform: 'uppercase', letterSpacing: 0.6 },
  mt14:       { marginTop: 14 },
  fieldRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  fieldIcon:  { fontSize: 15 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: C.onSurface, flex: 1 },
  coordText:  { fontSize: 12, color: C.onSurfaceVar, marginLeft: 24, marginTop: 3 },
  descBox:    { backgroundColor: C.surfaceLow, borderRadius: 10, padding: 14, marginTop: 8 },
  descText:   { fontSize: 14, color: C.onSurfaceVar, fontStyle: 'italic', lineHeight: 21 },

  // ── Generic card ────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#003465',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, marginBottom: 14 },

  // ── Foto Bukti ──────────────────────────────────────
  photo:    { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover' },
  noPicBox: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: C.outlineVar,
    borderRadius: 14, height: 160,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.surfaceLow,
  },
  noPicIcon: { fontSize: 42 },
  noPicText: { fontSize: 13, color: C.onSurfaceVar },

  // ── Navigasi button ──────────────────────────────────
  navigasiBtn: {
    backgroundColor: C.secondary,
    borderRadius: 32,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    elevation: 4,
    shadowColor: C.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navigasiIcon:  { fontSize: 20 },
  navigasiLabel: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // ── Update Status ────────────────────────────────────
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.outlineVar,
    backgroundColor: C.white,
    marginBottom: 10,
  },
  statusItemDone: {
    backgroundColor: '#EEF4FF',
    borderColor: C.secondary,
  },
  statusItemDimmed: { opacity: 0.55 },
  statusItemIcon:   { fontSize: 18 },
  statusItemText:   { flex: 1, fontSize: 15, fontWeight: '600', color: C.onSurface },
  statusItemTextDone: { color: C.secondary },
  doneAllIcon:   { fontSize: 13, color: C.secondary, fontWeight: '700' },
  chevron:       { fontSize: 22, color: C.outline },
  lockIcon:      { fontSize: 16 },
});
