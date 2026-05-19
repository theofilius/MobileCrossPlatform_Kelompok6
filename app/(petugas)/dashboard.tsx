import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { useReports } from '@/context/ReportsContext';
import { useDialog } from '../../components/aegis/Dialog';

// Figma palette
const NAVY = '#003B71';
const NAVY_DEEP = '#0A2540';
const TEXT = '#0A1929';
const MUTED = '#5A6B82';
const SUB = '#94A3B8';
const LAVENDER_BG = '#E8E2FF';      // selected pill background
const LAVENDER_FG = '#3B2F8C';      // selected pill text
const BG_TOP = '#D2E7FA';
const BG_BOTTOM = '#FFFFFF';
const CARD = '#FFFFFF';

const TYPE_META: Record<string, { icon: string; iconSet: 'material' | 'ionicon'; label: string; color: string }> = {
  ambulance:       { icon: 'medical-bag',  iconSet: 'material', label: 'Medis / Kecelakaan', color: '#10B981' },
  police:          { icon: 'shield-alert', iconSet: 'material', label: 'Kriminalitas',       color: '#8B5CF6' },
  fire_department: { icon: 'fire',         iconSet: 'material', label: 'Kebakaran',          color: '#EF4444' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'MENUNGGU',  color: '#B45309', bg: '#FEF3C7' },
  accepted:  { label: 'DITERIMA',  color: '#1D4ED8', bg: '#DBEAFE' },
  ontheway:  { label: 'OTW',       color: '#1D4ED8', bg: '#DBEAFE' },
  arrived:   { label: 'DI LOKASI', color: '#B45309', bg: '#FEF3C7' },
  resolved:  { label: 'SELESAI',   color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'BATAL',     color: '#475569', bg: '#E2E8F0' },
};

type FilterKey = 'all' | 'pending' | 'active';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'active',  label: 'Diproses' },
];

function TypeIcon({ meta, size = 22 }: { meta: typeof TYPE_META[string]; size?: number }) {
  if (meta.iconSet === 'material') {
    return <MaterialCommunityIcons name={meta.icon as any} size={size} color="#fff" />;
  }
  return <Ionicons name={meta.icon as any} size={size} color="#fff" />;
}

function ReportCard({ item, onAccept, onDetail, onChat }: any) {
  const meta = TYPE_META[item.type] ?? TYPE_META.ambulance;
  const status = STATUS_META[item.status] ?? STATUS_META.pending;
  const isActive = ['accepted', 'ontheway', 'arrived'].includes(item.status);

  return (
    <TouchableOpacity activeOpacity={0.94} onPress={() => onDetail(item)} style={styles.card}>
      {/* Top meta row */}
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaLeft}>
          <Ionicons name="location-outline" size={11} color={MUTED} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{item.location?.address}</Text>
        </View>
        <Text style={styles.cardMetaTime}>· {item.createdAt}</Text>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <LinearGradient
          colors={[NAVY, NAVY_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardIcon}
        >
          <TypeIcon meta={meta} size={24} />
        </LinearGradient>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{meta.label}</Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.cardReporter} numberOfLines={1}>{item.userName}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {isActive ? (
          <>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => onDetail(item)} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={14} color={NAVY} />
              <Text style={styles.btnSecondaryText}>Lihat Detail</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => onChat(item)} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
              <Text style={styles.btnPrimaryText}>Chat Pelapor</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.btnPrimaryFull}
            onPress={(e) => {
              e.stopPropagation?.();
              onAccept(item);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Tangani Laporan</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { reports, loading, error, refresh, acceptReport } = useReports();
  const dialog = useDialog();
  const [filter, setFilter] = useState<FilterKey>('all');

  // Petugas can hold multiple active cases concurrently — no single-active lock.

  const handleAccept = (item: any) => {
    dialog.show({
      type: 'confirm',
      title: 'Terima Laporan',
      body: `Tangani laporan dari ${item.userName}?`,
      primaryText: 'Terima',
      secondaryText: 'Batal',
      onPrimary: async () => {
        try { 
          await acceptReport(item.id); 
        } catch (e: any) { 
          dialog.show({
            type: 'error',
            title: 'Gagal',
            body: e?.message ?? 'Coba lagi.',
            primaryText: 'Mengerti'
          });
        }
      },
    });
  };

  const newCount    = reports.filter(r => r.status === 'pending').length;
  const activeCount = reports.filter(r => ['accepted', 'ontheway', 'arrived'].includes(r.status)).length;

  const baseList = reports.filter(r => r.status !== 'resolved' && r.status !== 'cancelled');
  const visibleReports = baseList.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending';
    return ['accepted', 'ontheway', 'arrived'].includes(r.status);
  });

  const firstName = (user?.name || 'Petugas').split(/\s+/)[0];
  const roleLabel = user?.role === 'admin' ? 'Admin Pusat' : 'Petugas Lapangan';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_TOP} translucent />

      <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFillObject} />

      <FlatList
        data={visibleReports}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={NAVY} colors={[NAVY]} />
        }
        ListHeaderComponent={
          <View>
            {/* Top identity card (like Figma "Current location") */}
            <View style={styles.topCard}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../assets/images/aegis-logo.png')}
                  style={styles.logoImg}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.topCardSub}>{roleLabel}</Text>
                <Text style={styles.topCardName} numberOfLines={1}>{firstName}</Text>
              </View>
              <View style={styles.dutyBadge}>
                <View style={styles.dutyDot} />
                <Text style={styles.dutyText}>BERTUGAS</Text>
              </View>
            </View>

            {/* Page title */}
            <Text style={styles.pageTitle}>Laporan Masuk</Text>

            {/* Filter pills */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => {
                const selected = filter === f.key;
                const count = f.key === 'all' ? baseList.length
                  : f.key === 'pending' ? newCount
                  : activeCount;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterPill, selected && styles.filterPillActive]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterPillText, selected && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                    <View style={[styles.filterCount, selected && styles.filterCountActive]}>
                      <Text style={[styles.filterCountText, selected && styles.filterCountTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={14} color="#991B1B" />
                <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={NAVY} />
              <Text style={styles.emptyText}>Memuat laporan...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-done" size={32} color={NAVY} />
              </View>
              <Text style={styles.emptyTitle}>Tidak ada laporan aktif</Text>
              <Text style={styles.emptySub}>Laporan baru akan muncul di sini secara otomatis.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ReportCard
            item={item}
            onAccept={handleAccept}
            onDetail={() => router.push({ pathname: '/(petugas)/detail' as any, params: { reportJson: JSON.stringify(item) } })}
            onChat={() => router.push({ pathname: '/(petugas)/chat' as any, params: { reportJson: JSON.stringify(item) } })}
          />
        )}
      />
      <dialog.Dialog />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_BOTTOM },
  list: { paddingHorizontal: 18, paddingBottom: 28 },

  // ── Top identity card (Figma "Current location" style) ──
  topCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  logoWrap: { width: 42, height: 42, borderRadius: 12, overflow: 'hidden', backgroundColor: NAVY },
  logoImg:  { width: '100%', height: '100%' },
  topCardSub:  { fontSize: 11, color: MUTED, fontWeight: '500' },
  topCardName: { fontSize: 15, color: TEXT, fontWeight: '800', textTransform: 'capitalize' },
  dutyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5,
  },
  dutyDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  dutyText: { color: '#15803D', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },

  // ── Page title ──
  pageTitle: { fontSize: 28, fontWeight: '800', color: TEXT, letterSpacing: -0.5, marginBottom: 14 },

  // ── Filter pills (Figma "Reported By You" style) ──
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: { backgroundColor: LAVENDER_BG, borderColor: LAVENDER_BG },
  filterPillText:   { color: MUTED, fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: LAVENDER_FG, fontWeight: '800' },
  filterCount: {
    minWidth: 20, height: 20, borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  filterCountActive:    { backgroundColor: 'rgba(59,47,140,0.18)' },
  filterCountText:      { fontSize: 10.5, fontWeight: '800', color: MUTED },
  filterCountTextActive:{ color: LAVENDER_FG },

  // ── Report card (Figma style) ──
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 12,
  },
  cardMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  cardMetaText: { fontSize: 11, color: MUTED, fontWeight: '600', flex: 1 },
  cardMetaTime: { fontSize: 11, color: MUTED, fontWeight: '500' },

  cardBody: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle:    { flex: 1, fontSize: 15, fontWeight: '800', color: TEXT, letterSpacing: -0.2 },
  statusPill:   { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardReporter: { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 6 },
  cardDesc:     { fontSize: 12.5, color: '#334155', lineHeight: 18 },

  // ── Buttons (Figma pill style) ──
  cardActions: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1, height: 42, borderRadius: 21,
    backgroundColor: NAVY,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnPrimaryFull: {
    height: 46, borderRadius: 23,
    backgroundColor: NAVY,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    flex: 1,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnSecondary: {
    flex: 1, height: 42, borderRadius: 21,
    borderWidth: 1.5, borderColor: NAVY,
    backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnSecondaryText: { color: NAVY, fontSize: 13, fontWeight: '700' },
  btnDisabled: { backgroundColor: '#CBD5E1' },

  // ── States ──
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 50, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', marginBottom: 4, shadowColor: NAVY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  emptyText:  { fontSize: 13, color: MUTED },
  emptySub:   { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 17 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: '#991B1B', fontWeight: '600' },
});
