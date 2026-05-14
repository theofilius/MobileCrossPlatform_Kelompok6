import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EMERGENCY_COLORS,
  EMERGENCY_LABELS,
  EmergencyType,
  Report,
  getReports,
} from '../../services/reportService';

type FilterType = 'all' | EmergencyType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'fire', label: 'Kebakaran' },
  { key: 'accident', label: 'Kecelakaan' },
  { key: 'crime', label: 'Kriminalitas' },
  { key: 'disaster', label: 'Bencana' },
  { key: 'medical', label: 'Medis' },
  { key: 'other', label: 'Lainnya' },
];

const STATUS_LABEL: Record<Report['status'], string> = {
  pending: 'Menunggu',
  responded: 'Ditangani',
  resolved: 'Selesai',
};

const STATUS_COLOR: Record<Report['status'], string> = {
  pending: '#F97316',
  responded: '#3B82F6',
  resolved: '#10B981',
};

const TYPE_ICON: Record<EmergencyType, { icon: string; iconSet: 'material' | 'ionicons' }> = {
  fire: { icon: 'fire', iconSet: 'material' },
  accident: { icon: 'car-crash', iconSet: 'material' },
  crime: { icon: 'shield-alert', iconSet: 'material' },
  disaster: { icon: 'weather-lightning-rainy', iconSet: 'material' },
  medical: { icon: 'medical-bag', iconSet: 'material' },
  other: { icon: 'alert-circle', iconSet: 'material' },
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const color = EMERGENCY_COLORS[report.type];
  const { icon } = TYPE_ICON[report.type];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: color + '18' }]}>
            <MaterialCommunityIcons name={icon as any} size={13} color={color} />
            <Text style={[styles.typeLabel, { color }]}>{EMERGENCY_LABELS[report.type]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[report.status] + '18' }]}>
            <Text style={[styles.statusLabel, { color: STATUS_COLOR[report.status] }]}>
              {STATUS_LABEL[report.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text style={styles.address} numberOfLines={1}>{report.address}</Text>
          </View>
          <Text style={styles.time}>{formatTimeAgo(report.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(getReports());
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.type === filter);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Komunitas</Text>
            <Text style={styles.headerSub}>Laporan kejadian di sekitarmu</Text>
          </View>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/chat' as any)}
          >
            <Ionicons name="chatbubbles" size={20} color="#003B71" />
          </TouchableOpacity>
        </View>

        {/* Filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterBar}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Report list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => router.push({ pathname: '/report-detail', params: { id: item.id } } as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Belum ada laporan</Text>
              <Text style={styles.emptySub}>Laporan dari komunitas akan muncul di sini</Text>
            </View>
          }
        />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003B71',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  chatBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#003B71',
    borderColor: '#003B71',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  address: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 8,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptySub: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});