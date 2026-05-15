import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { TranslationKey } from '../translations';
import {
  EMERGENCY_COLORS,
  EmergencyType,
  Report,
  getReports,
} from '../services/reportService';

const STATUS_KEY: Record<Report['status'], TranslationKey> = {
  pending: 'status_pending',
  responded: 'status_responded',
  resolved: 'status_resolved',
};

const TYPE_KEY: Record<EmergencyType, TranslationKey> = {
  fire: 'type_fire',
  accident: 'type_accident',
  crime: 'type_crime',
  disaster: 'type_disaster',
  medical: 'type_medical',
  other: 'type_other',
};

const STATUS_COLOR: Record<Report['status'], string> = {
  pending: '#F97316',
  responded: '#3B82F6',
  resolved: '#10B981',
};

const TYPE_ICON: Record<EmergencyType, string> = {
  fire: 'fire',
  accident: 'car-crash',
  crime: 'shield-alert',
  disaster: 'weather-lightning-rainy',
  medical: 'medical-bag',
  other: 'alert-circle',
};

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportHistoryScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // TODO: const { data } = await supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const all = getReports();
    setReports(all);
  }, []);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('history_title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const color = EMERGENCY_COLORS[item.type];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/report-detail', params: { id: item.id } } as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
                  <MaterialCommunityIcons name={TYPE_ICON[item.type] as any} size={22} color={color} />
                </View>

                <View style={styles.info}>
                  <View style={styles.row}>
                    <Text style={[styles.typeText, { color }]}>{t(TYPE_KEY[item.type])}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '18' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                        {t(STATUS_KEY[item.status])}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                    <Text style={styles.meta} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <Text style={styles.date}>{formatDate(item.createdAt, language)}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('history_empty')}</Text>
              <Text style={styles.emptySub}>{t('history_empty_sub')}</Text>
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#003B71',
    textAlign: 'center',
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  desc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  meta: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: '#C4C9D4',
    fontWeight: '600',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptySub: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});