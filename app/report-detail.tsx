import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '../translations';
import {
  EMERGENCY_COLORS,
  EmergencyType,
  Report,
  getReport,
  subscribeToReport,
} from '../services/reportService';

const STATUS_KEY: Record<Report['status'], TranslationKey> = {
  pending:   'status_pending_long',
  accepted:  'status_responded_long',
  ontheway:  'status_responded_long',
  arrived:   'status_responded_long',
  resolved:  'status_resolved_long',
  cancelled: 'status_resolved_long',
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
  pending:   '#F97316',
  accepted:  '#3B82F6',
  ontheway:  '#3B82F6',
  arrived:   '#3B82F6',
  resolved:  '#10B981',
  cancelled: '#9CA3AF',
};

const STATUS_ICON: Record<Report['status'], string> = {
  pending:   'time-outline',
  accepted:  'shield-checkmark-outline',
  ontheway:  'shield-checkmark-outline',
  arrived:   'shield-checkmark-outline',
  resolved:  'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
};

const TYPE_ICON: Record<EmergencyType, string> = {
  fire: 'fire',
  accident: 'car-emergency',
  crime: 'shield-alert',
  disaster: 'weather-lightning-rainy',
  medical: 'medical-bag',
  other: 'alert-circle',
};

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const refresh = () => {
      getReport(id)
        .then(r => { if (mounted) setReport(r ?? null); })
        .catch(() => { if (mounted) setReport(null); });
    };

    refresh();
    // Realtime: petugas can change status / assignment — re-fetch on UPDATE
    // so the user sees the new state without leaving the screen.
    const unsub = subscribeToReport(id, () => refresh());
    return () => { mounted = false; unsub(); };
  }, [id]);

  useEffect(() => {
    return () => {
      try { soundRef.current?.remove(); } catch { /* ignore */ }
    };
  }, []);

  const handlePlayAudio = async () => {
    if (!report?.audioUri) return;

    if (isPlaying && soundRef.current) {
      try { soundRef.current.pause(); soundRef.current.remove(); } catch { /* ignore */ }
      soundRef.current = null;
      setIsPlaying(false);
      return;
    }

    await setAudioModeAsync({ playsInSilentMode: true } as any);
    const player = createAudioPlayer({ uri: report.audioUri });
    soundRef.current = player;
    player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        setIsPlaying(false);
        try { player.remove(); } catch { /* ignore */ }
        if (soundRef.current === player) soundRef.current = null;
      }
    });
    player.play();
    setIsPlaying(true);
  };

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>{t('detail_not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('detail_back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = EMERGENCY_COLORS[report.type];

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('detail_title')}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push({
              pathname: '/report-chat' as any,
              params: { reportId: report.id, title: report.address || '' },
            })}
            hitSlop={8}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#003B71" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Type banner */}
          <View style={[styles.typeBanner, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={TYPE_ICON[report.type] as any} size={28} color="#FFFFFF" />
            <View>
              <Text style={styles.bannerLabel}>{t('detail_type')}</Text>
              <Text style={styles.bannerType}>{t(TYPE_KEY[report.type])}</Text>
            </View>
            <View style={styles.bannerSpacer} />
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Ionicons name={STATUS_ICON[report.status] as any} size={13} color="#FFFFFF" />
              <Text style={styles.statusBadgeText}>{t(STATUS_KEY[report.status])}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="location" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{t('detail_location')}</Text>
                <Text style={styles.cardValue}>{report.address || t('detail_no_location')}</Text>
                {report.latitude && report.longitude && (
                  <Text style={styles.coords}>
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Time */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="time" size={20} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{t('detail_time')}</Text>
                <Text style={styles.cardValue}>{formatDate(report.createdAt, language)}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('detail_desc')}</Text>
            <Text style={styles.description}>{report.description}</Text>
          </View>

          {/* Photo */}
          {report.photoUri && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('detail_photo')}</Text>
              <Image source={{ uri: report.photoUri }} style={styles.photo} resizeMode="cover" />
            </View>
          )}

          {/* Audio */}
          {report.audioUri && (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="mic" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{t('detail_audio')}</Text>
                  <Text style={styles.cardValue}>
                    {isPlaying ? t('detail_audio_playing') : t('detail_audio_tap')}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.playBtn, isPlaying && styles.playBtnActive]} onPress={handlePlayAudio}>
                  <Ionicons name={isPlaying ? 'stop' : 'play'} size={18} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Status timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('detail_status_title')}</Text>
            <View style={styles.timeline}>
              {(() => {
                // Collapse the 6 DB statuses into 3 timeline buckets.
                const bucket: Record<Report['status'], number> = {
                  pending: 0, accepted: 1, ontheway: 1, arrived: 1, resolved: 2, cancelled: 2,
                };
                const currentIdx = bucket[report.status];
                const steps: { key: Report['status']; tk: TranslationKey; color: string }[] = [
                  { key: 'pending',  tk: STATUS_KEY.pending,  color: STATUS_COLOR.pending  },
                  { key: 'accepted', tk: STATUS_KEY.accepted, color: STATUS_COLOR.accepted },
                  { key: 'resolved', tk: STATUS_KEY.resolved, color: STATUS_COLOR.resolved },
                ];
                return steps.map((s, i) => {
                  const active = currentIdx >= i;
                  return (
                    <View key={s.key} style={styles.timelineItem}>
                      <View style={[styles.timelineDot, active && { backgroundColor: s.color }]} />
                      {i < 2 && <View style={[styles.timelineLine, active && { backgroundColor: '#E5E7EB' }]} />}
                      <Text style={[styles.timelineLabel, active && { color: '#111827', fontWeight: '600' }]}>
                        {t(s.tk)}
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  notFound: { fontSize: 16, color: '#6B7280' },
  backLink: { fontSize: 14, color: '#003B71', fontWeight: '700' },

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

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 12,
  },

  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerType: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  bannerSpacer: { flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 19,
  },
  coords: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  playBtnActive: {
    backgroundColor: '#DCFCE7',
  },

  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
  },
  timelineLine: {
    position: 'absolute',
    top: 6,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#F3F4F6',
  },
  timelineLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
});