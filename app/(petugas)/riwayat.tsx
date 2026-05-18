import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { AuthContext } from '../context/AuthContext';
import {
  listAssignedReports,
  subscribeToReports,
  type Report,
} from '../../services/reportService';

const NAVY = '#003B71';
const NAVY_DEEP = '#002952';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUB = '#94A3B8';
const BG_TOP = '#D2E7FA';
const BG_BOTTOM = '#FFFFFF';
const CARD = '#FFFFFF';

const TYPE_META: Record<string, { icon: string; iconSet: 'material' | 'ionicon'; label: string; color: string }> = {
  medical:  { icon: 'medical-bag',  iconSet: 'material', label: 'Darurat Medis', color: '#10B981' },
  accident: { icon: 'car-emergency', iconSet: 'material', label: 'Kecelakaan',    color: '#F97316' },
  crime:    { icon: 'shield-alert', iconSet: 'material', label: 'Kriminalitas',  color: '#8B5CF6' },
  fire:     { icon: 'fire',         iconSet: 'material', label: 'Kebakaran',     color: '#EF4444' },
  disaster: { icon: 'weather-lightning-rainy', iconSet: 'material', label: 'Bencana Alam', color: '#3B82F6' },
  other:    { icon: 'alert-circle', iconSet: 'material', label: 'Lainnya',       color: '#6B7280' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Menunggu',  color: '#B45309', bg: '#FEF3C7' },
  accepted:  { label: 'Diterima',  color: '#1D4ED8', bg: '#DBEAFE' },
  ontheway:  { label: 'OTW',       color: '#1D4ED8', bg: '#DBEAFE' },
  arrived:   { label: 'Di Lokasi', color: '#B45309', bg: '#FEF3C7' },
  resolved:  { label: 'Selesai',   color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'Batal',     color: '#475569', bg: '#E2E8F0' },
};

type FilterKey = 'all' | 'active' | 'resolved';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'Semua' },
  { key: 'active',   label: 'Aktif' },
  { key: 'resolved', label: 'Selesai' },
];

function formatRelative(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TypeIcon({ meta, size = 20 }: { meta: typeof TYPE_META[string]; size?: number }) {
  if (meta.iconSet === 'material') {
    return <MaterialCommunityIcons name={meta.icon as any} size={size} color={meta.color} />;
  }
  return <Ionicons name={meta.icon as any} size={size} color={meta.color} />;
}

export default function RiwayatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const refresh = (initial = false) => {
      if (initial) setLoading(true);
      listAssignedReports(user.id)
        .then(rows => { if (mounted) setReports(rows); })
        .catch(() => { if (mounted) setReports([]); })
        .finally(() => { if (mounted && initial) setLoading(false); });
    };

    refresh(true);
    const unsub = subscribeToReports(() => refresh(false));
    return () => { mounted = false; unsub(); };
  }, [user?.id]);

  const handleRefresh = () => {
    if (!user?.id) return;
    setLoading(true);
    listAssignedReports(user.id)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  const counts = {
    all:      reports.length,
    active:   reports.filter(r => ['accepted', 'ontheway', 'arrived'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const visible = reports.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['accepted', 'ontheway', 'arrived'].includes(r.status);
    return r.status === 'resolved';
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY_DEEP} />

      <LinearGradient
        colors={[NAVY_DEEP, NAVY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Penanganan</Text>
      </LinearGradient>

      <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={styles.body}>
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const selected = filter === f.key;
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
                    {counts[f.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={NAVY} colors={[NAVY]} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={NAVY} />
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="document-text-outline" size={28} color={NAVY} />
                </View>
                <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
                <Text style={styles.emptySub}>Laporan yang kamu tangani akan muncul di sini.</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.other;
            const status = STATUS_META[item.status] ?? STATUS_META.pending;
            const resolved = item.status === 'resolved';
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => router.push({
                  pathname: '/(petugas)/detail' as any,
                  params: {
                    // Convert remote Report → DashboardReport-ish payload
                    reportJson: JSON.stringify({
                      id: item.id,
                      type: item.type === 'medical' || item.type === 'accident' ? 'ambulance'
                          : item.type === 'crime' ? 'police'
                          : item.type === 'fire' || item.type === 'disaster' ? 'fire_department'
                          : 'ambulance',
                      status: item.status,
                      description: item.description,
                      location: { address: item.address },
                      createdAt: formatRelative(item.createdAt),
                      userName: item.reporterName ?? 'Pelapor',
                      userPhone: item.reporterPhone ?? '-',
                      coordinates: { lat: item.latitude ?? 0, lng: item.longitude ?? 0 },
                      photoUrl: item.photoUri ?? undefined,
                      audioUrl: item.audioUri ?? undefined,
                      priority: item.priority,
                    }),
                  },
                })}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.cardIcon, { backgroundColor: meta.color + '18' }]}>
                    <TypeIcon meta={meta} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{meta.label}</Text>
                      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardAddress} numberOfLines={1}>
                      <Ionicons name="location-outline" size={11} color={SUB} /> {item.address || 'Lokasi tidak tersedia'}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {resolved
                        ? `Selesai · ${formatRelative(item.updatedAt)}`
                        : `Diperbarui ${formatRelative(item.updatedAt)}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_BOTTOM },

  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 },

  body: { flex: 1 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterPillActive: { backgroundColor: '#E8E2FF', borderColor: '#E8E2FF' },
  filterPillText: { color: MUTED, fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#3B2F8C', fontWeight: '800' },
  filterCount: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(59,47,140,0.18)' },
  filterCountText: { fontSize: 10.5, fontWeight: '800', color: MUTED },
  filterCountTextActive: { color: '#3B2F8C' },

  list: { padding: 16, paddingTop: 6, gap: 10 },

  card: {
    backgroundColor: CARD, borderRadius: 16,
    padding: 14,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cardIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: TEXT },
  statusPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  cardAddress: { fontSize: 12, color: MUTED, marginBottom: 2 },
  cardMeta: { fontSize: 11, color: SUB, fontWeight: '500' },

  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },
});
