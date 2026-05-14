import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReports } from '../../context/ReportsContext';

const C = {
  primary:      '#003465',
  orange:       '#E65100',
  orangeBorder: '#FB8C00',
  orangeLight:  '#FFF3E0',
  green:        '#2E7D32',
  greenBorder:  '#43A047',
  red:          '#BA1A1A',
  gray:         '#727781',
  grayBg:       '#EDEDF3',
  grayLight:    '#F3F3F9',
  bg:           '#F9F9FF',
  white:        '#FFFFFF',
  onSurface:    '#191C20',
  onSurfaceVar: '#424750',
};

const SERVICE_CONFIG: Record<string, { icon: string; label: string }> = {
  ambulance:       { icon: '🚑', label: 'Ambulans' },
  police:          { icon: '🚓', label: 'Polisi' },
  fire_department: { icon: '🚒', label: 'Pemadam Kebakaran' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  pending:  { label: 'BARU',    color: '#E65100', bg: '#FFF3E0', borderColor: '#FB8C00' },
  accepted: { label: 'AKTIF',   color: '#2E7D32', bg: '#E8F5E9', borderColor: '#43A047' },
  ontheway: { label: 'OTW',     color: '#1565C0', bg: '#E3F2FD', borderColor: '#1E88E5' },
  arrived:  { label: 'TIBA',    color: '#F57F17', bg: '#FFF9E6', borderColor: '#F9A825' },
  resolved: { label: 'SELESAI', color: '#2E7D32', bg: '#E8F5E9', borderColor: '#43A047' },
};

function StatCard({
  count, label, numColor, borderColor,
}: {
  count: number; label: string; numColor: string; borderColor: string;
}) {
  return (
    <View style={[styles.statCard, { borderBottomColor: borderColor }]}>
      <Text style={[styles.statNum, { color: numColor }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReportCard({
  item, onAccept, onDetail, onChat, hasActiveReport,
}: any) {
  const svc          = SERVICE_CONFIG[item.type]  || SERVICE_CONFIG.ambulance;
  const status       = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const isActive     = ['accepted', 'ontheway', 'arrived'].includes(item.status);
  const acceptDisabled = hasActiveReport && item.status === 'pending';

  return (
    <View style={[styles.card, { borderLeftColor: status.borderColor }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{svc.icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>{svc.label}</Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaPin}>📍</Text>
            <Text style={styles.cardSub}>{item.location?.address}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaClock}>🕐</Text>
            <Text style={styles.cardTime}>{item.createdAt}</Text>
          </View>
        </View>
      </View>

      {/* Deskripsi */}
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

      {/* Tombol aksi:
            - Pending  → hanya Terima (disabled jika ada laporan aktif)
            - Active   → Detail + Chat (muncul setelah diterima) */}
      {isActive ? (
        <View style={styles.actionsGrid2}>
          <TouchableOpacity
            style={styles.btnBorder}
            onPress={() => onDetail(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTextPrimary}>📋  Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOrange}
            onPress={() => onChat(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTextOrange}>💬  Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btnTerima, acceptDisabled && styles.btnTerimaDis]}
          onPress={() => {
            if (acceptDisabled) {
              Alert.alert('⚠ Masih Ada Tugas Aktif', 'Selesaikan tugas yang sedang berjalan dulu!');
              return;
            }
            onAccept(item);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnTerimaText, acceptDisabled && styles.btnTextDisabled]}>
            ✔  Terima
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { reports, acceptReport } = useReports();

  const hasActiveReport = reports.some(r =>
    ['accepted', 'ontheway', 'arrived'].includes(r.status),
  );

  const handleAccept = (item: any) => {
    Alert.alert('Terima Laporan', `Terima laporan dari ${item.userName}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Terima',
        onPress: () => {
          acceptReport(item.id);
          Alert.alert('✅ Berhasil', 'Laporan telah kamu terima!');
        },
      },
    ]);
  };

  const newCount    = reports.filter(r => r.status === 'pending').length;
  const activeCount = reports.filter(r => ['accepted', 'ontheway', 'arrived'].includes(r.status)).length;
  const doneCount   = reports.filter(r => r.status === 'resolved').length;

  // Laporan selesai tidak ditampilkan di daftar, tapi tetap dihitung di stats
  const visibleReports = reports.filter(r => r.status !== 'resolved');

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.primary} barStyle="light-content" translucent />

      <FlatList
        data={visibleReports}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* ── Header — ikut scroll bersama konten ── */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerSub}>Selamat datang kembali,</Text>
                <Text style={styles.headerTitle}>Petugas Pemadam 🚒</Text>
                <View style={styles.dutyRow}>
                  <View style={styles.dutyDot} />
                  <Text style={styles.dutyText}>Sedang Bertugas · Tangerang</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>AKTIF</Text>
                </View>
              </View>
            </View>

            {/* ── Stats cards — sedikit overlap di bawah header ── */}
            <View style={styles.statsRow}>
              <StatCard count={newCount}    label="Baru"    numColor={C.orange}  borderColor={C.orangeBorder} />
              <StatCard count={activeCount} label="Aktif"   numColor={C.green}   borderColor={C.greenBorder} />
              <StatCard count={doneCount}   label="Selesai" numColor={C.primary} borderColor={C.primary} />
            </View>

            {/* ── Section header ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Laporan Masuk</Text>
              <Text style={styles.sectionCount}>{visibleReports.length} laporan</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>Semua laporan selesai!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ReportCard
            item={item}
            hasActiveReport={hasActiveReport}
            onAccept={handleAccept}
            onDetail={() => router.push({ pathname: '/(petugas)/detail', params: { reportJson: JSON.stringify(item) } })}
            onChat={() => router.push({ pathname: '/(petugas)/chat', params: { reportJson: JSON.stringify(item) } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── List ─────────────────────────────────────────────
  list: { paddingBottom: 24 },

  // ── Header ──────────────────────────────────────────
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingBottom: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerSub:       { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '400', marginBottom: 4 },
  headerTitle:     { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  dutyRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  dutyDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  dutyText:        { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  headerRight:     { alignItems: 'flex-end', gap: 10 },
  bellIcon:        { fontSize: 22 },
  activeBadge:     { backgroundColor: C.red, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // ── Stats ────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: -20,
    paddingTop: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  statNum:   { fontSize: 28, fontWeight: '700' },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.onSurfaceVar,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Section header ───────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: C.bg,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  sectionCount: { fontSize: 11, color: C.gray, fontWeight: '500' },

  // ── Report card ──────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  iconBox:    { width: 56, height: 56, borderRadius: 12, backgroundColor: C.grayBg, alignItems: 'center', justifyContent: 'center' },
  iconText:   { fontSize: 26 },
  cardInfo:   { flex: 1 },
  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.onSurface },
  badge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  metaPin:    { fontSize: 11 },
  metaClock:  { fontSize: 11 },
  cardSub:    { fontSize: 12, color: C.gray },
  cardTime:   { fontSize: 11, color: C.gray },
  cardDesc:   { fontSize: 13, color: C.onSurfaceVar, lineHeight: 19, marginBottom: 12 },

  // ── Tombol aksi ───────────────────────────────────────
  actionsGrid2: { flexDirection: 'row', gap: 8 },
  actionsGrid3: { flexDirection: 'row', gap: 6 },

  btnGray: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: C.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: '#EEEEEE' },
  btnBorder: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  btnBorderDisabled: { borderColor: '#BDBDBD' },

  btnTerima: {
    height: 44, borderRadius: 10,
    backgroundColor: C.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  btnTerimaDis: { backgroundColor: '#EEEEEE' },
  btnTerimaText: { fontSize: 11, fontWeight: '700', color: C.onSurfaceVar },
  btnOrange: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: C.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },

  btnTextGray:     { fontSize: 11, fontWeight: '700', color: C.onSurfaceVar },
  btnTextDisabled: { color: '#BDBDBD' },
  btnTextPrimary:  { fontSize: 11, fontWeight: '700', color: C.primary },
  btnTextOrange:   { fontSize: 11, fontWeight: '700', color: C.orange },

  // ── Kosong ────────────────────────────────────────────
  empty:     { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 14, color: '#333', fontWeight: '600' },
});
