import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReports } from '@/context/ReportsContext';
import { useDialog } from '../../components/aegis/Dialog';

const NAVY = '#003B71';
const NAVY_DEEP = '#002952';
const TEXT = '#111827';
const MUTED = '#6B7280';
const SUB = '#9CA3AF';
const BG = '#F8FAFD';
const CARD = '#FFFFFF';

const TYPE_META: Record<string, { icon: string; iconSet: 'material' | 'ionicon'; label: string; color: string }> = {
  ambulance:       { icon: 'medical-bag',           iconSet: 'material', label: 'Medis / Kecelakaan', color: '#10B981' },
  police:          { icon: 'shield-alert',          iconSet: 'material', label: 'Kriminalitas',       color: '#8B5CF6' },
  fire_department: { icon: 'fire',                  iconSet: 'material', label: 'Kebakaran',          color: '#EF4444' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Menunggu',  color: '#F97316' },
  accepted:  { label: 'Diterima',  color: '#2563EB' },
  ontheway:  { label: 'OTW',       color: '#2563EB' },
  arrived:   { label: 'Di Lokasi', color: '#F59E0B' },
  resolved:  { label: 'Selesai',   color: '#10B981' },
  cancelled: { label: 'Batal',     color: '#9CA3AF' },
};

const STATUS_FLOW = [
  { key: 'accepted', icon: 'shield-checkmark-outline', label: 'Laporan Diterima' },
  { key: 'ontheway', icon: 'car-outline',              label: 'Menuju Lokasi' },
  { key: 'arrived',  icon: 'location-outline',         label: 'Tiba di Lokasi' },
  { key: 'resolved', icon: 'checkmark-done-outline',   label: 'Selesai Ditangani' },
];

function TypeIcon({ meta, size = 24 }: { meta: typeof TYPE_META[string]; size?: number }) {
  if (meta.iconSet === 'material') {
    return <MaterialCommunityIcons name={meta.icon as any} size={size} color={meta.color} />;
  }
  return <Ionicons name={meta.icon as any} size={size} color={meta.color} />;
}

export default function DetailScreen() {
  const insets = useSafeAreaInsets();
  const { reportJson } = useLocalSearchParams<{ reportJson: string }>();
  const report = JSON.parse(reportJson || '{}');
  const { updateStatus } = useReports();
  const dialog = useDialog();

  const [status, setStatus] = useState<string>(report.status);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const soundRef = useRef<AudioPlayer | null>(null);

  useEffect(() => { setStatus(report.status); }, [reportJson]);

  useEffect(() => {
    return () => { try { soundRef.current?.remove(); } catch { /* ignore */ } };
  }, []);

  const meta = TYPE_META[report.type] ?? TYPE_META.ambulance;
  const statusMeta = STATUS_META[status] ?? STATUS_META.pending;
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === status);

  const handleUpdateStatus = (newStatus: string) => {
    const target = STATUS_FLOW.find(s => s.key === newStatus);
    if (!target) return;
    dialog.show({
      type: 'confirm',
      title: 'Update Status',
      body: `Ubah status laporan menjadi "${target.label}"?`,
      primaryText: 'Ya, Update',
      secondaryText: 'Batal',
      autoClose: false,
      onPrimary: async () => {
        try {
          await updateStatus(report.id, newStatus);
          setStatus(newStatus);
          dialog.hide();
          if (newStatus === 'resolved') {
            dialog.show({
              type: 'success',
              title: 'Laporan Selesai',
              body: 'Laporan telah ditandai sebagai selesai. Terima kasih atas penanganannya.',
              primaryText: 'Kembali',
              onPrimary: () => router.back(),
            });
          }
        } catch (e: any) {
          dialog.show({
            type: 'error',
            title: 'Gagal Update',
            body: e?.message ?? 'Terjadi kesalahan. Coba lagi.',
            primaryText: 'Mengerti',
          });
        }
      },
    });
  };

  const handleCall = () => {
    const phone = report.userPhone;
    if (!phone || phone === '-') {
      dialog.show({
        type: 'info',
        title: 'Nomor Tidak Tersedia',
        body: 'Pelapor belum mengisi nomor telepon di profil mereka.',
        primaryText: 'Mengerti',
      });
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => null);
  };

  const handlePlayAudio = async () => {
    if (!report.photoUrl && !report.audioUri && !(report as any).audioUrl) return;
    const audioUri = (report as any).audioUrl || report.audioUri;
    if (!audioUri) return;

    if (isPlaying && soundRef.current) {
      try { soundRef.current.pause(); soundRef.current.remove(); } catch { /* ignore */ }
      soundRef.current = null;
      setIsPlaying(false);
      return;
    }

    setAudioLoading(true);
    try {
      await setAudioModeAsync({ playsInSilentMode: true } as any);
      const player = createAudioPlayer({ uri: audioUri });
      soundRef.current = player;
      player.addListener('playbackStatusUpdate', (s: any) => {
        if (s.didJustFinish) {
          setIsPlaying(false);
          try { player.remove(); } catch { /* ignore */ }
          if (soundRef.current === player) soundRef.current = null;
        }
      });
      player.play();
      setIsPlaying(true);
    } catch (e: any) {
      dialog.show({ type: 'error', title: 'Gagal memutar audio', body: e?.message ?? 'Coba lagi.', primaryText: 'OK' });
    } finally {
      setAudioLoading(false);
    }
  };

  // Backend stores audio in `audioUri` of remote Report, but ReportsContext
  // surfaces it as `photoUrl` only. We re-attach `audioUrl` for the player.
  const audioUrl = (report as any).audioUrl || (report as any).audio_url || null;
  const photoUrl = report.photoUrl;

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
        <Text style={styles.headerTitle}>Detail Laporan</Text>
        <TouchableOpacity
          style={styles.backBtn}
          hitSlop={10}
          onPress={() => router.push({
            pathname: '/(petugas)/chat' as any,
            params: { reportJson: JSON.stringify(report) },
          })}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Type + status banner */}
        <View style={[styles.banner, { backgroundColor: meta.color + '0F' }]}>
          <View style={[styles.bannerIcon, { backgroundColor: meta.color + '20' }]}>
            <TypeIcon meta={meta} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerType}>{meta.label}</Text>
            <Text style={styles.bannerTime}>Dilaporkan {report.createdAt}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusMeta.color + '1A' }]}>
            <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Reporter info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>INFORMASI PELAPOR</Text>
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={20} color={NAVY} />
            <Text style={styles.rowValue}>{report.userName || 'Pelapor'}</Text>
          </View>

          <TouchableOpacity style={styles.row} onPress={handleCall} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={18} color={NAVY} />
            <Text style={[styles.rowValue, { color: NAVY, textDecorationLine: 'underline' }]}>
              {report.userPhone && report.userPhone !== '-' ? report.userPhone : 'Nomor belum tersedia'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>LOKASI KEJADIAN</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={NAVY} />
            <Text style={styles.rowValue}>{report.location?.address || '-'}</Text>
          </View>
          {report.coordinates?.lat ? (
            <Text style={styles.coordText}>
              Koordinat: {report.coordinates.lat}, {report.coordinates.lng}
            </Text>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>DESKRIPSI</Text>
          <View style={styles.descBox}>
            <Text style={styles.descText}>&quot;{report.description}&quot;</Text>
          </View>
        </View>

        {/* Photo evidence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Foto Bukti</Text>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.emptyEvidence}>
              <Ionicons name="image-outline" size={36} color={SUB} />
              <Text style={styles.emptyEvidenceText}>Belum ada foto bukti</Text>
            </View>
          )}
        </View>

        {/* Audio evidence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rekaman Suara</Text>
          {audioUrl ? (
            <TouchableOpacity style={styles.audioBox} onPress={handlePlayAudio} activeOpacity={0.85}>
              <View style={[styles.audioIcon, { backgroundColor: NAVY + '14' }]}>
                {audioLoading ? (
                  <ActivityIndicator color={NAVY} />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={NAVY} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioTitle}>{isPlaying ? 'Memutar...' : 'Putar rekaman'}</Text>
                <Text style={styles.audioSub}>Pesan suara dari pelapor</Text>
              </View>
              <Ionicons name="musical-notes-outline" size={18} color={SUB} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyEvidence}>
              <Ionicons name="mic-off-outline" size={36} color={SUB} />
              <Text style={styles.emptyEvidenceText}>Tidak ada rekaman suara</Text>
            </View>
          )}
        </View>

        {/* Navigate */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => router.push({
            pathname: '/(petugas)/navigate' as any,
            params: { reportJson: JSON.stringify(report) },
          })}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.navBtnText}>Navigasi ke Lokasi</Text>
        </TouchableOpacity>

        {/* Status workflow */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Status Penanganan</Text>
          {STATUS_FLOW.map((s, i) => {
            const done = statusIdx > i;
            const active = statusIdx === i;
            const isNext = statusIdx + 1 === i;
            const locked = s.key === 'resolved' && statusIdx < STATUS_FLOW.findIndex(x => x.key === 'arrived');
            const dimmed = !done && !active && !isNext;

            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.flowItem,
                  (done || active) && styles.flowItemDone,
                  (dimmed || locked) && styles.flowItemDim,
                ]}
                onPress={() => {
                  if (locked) {
                    dialog.show({ type: 'info', title: 'Terkunci', body: 'Tiba di lokasi terlebih dahulu sebelum menyelesaikan laporan.', primaryText: 'Mengerti' });
                    return;
                  }
                  if (dimmed || active || done) return;
                  handleUpdateStatus(s.key);
                }}
                activeOpacity={(dimmed || locked || active || done) ? 1 : 0.7}
              >
                <View style={[
                  styles.flowDot,
                  (done || active) && { backgroundColor: NAVY, borderColor: NAVY },
                ]}>
                  <Ionicons
                    name={s.icon as any}
                    size={14}
                    color={(done || active) ? '#fff' : SUB}
                  />
                </View>
                <Text style={[
                  styles.flowLabel,
                  (done || active) && { color: NAVY, fontWeight: '700' },
                ]}>
                  {s.label}
                </Text>
                {active && <Ionicons name="ellipse" size={8} color="#10B981" />}
                {isNext && !locked && <Ionicons name="chevron-forward" size={16} color={NAVY} />}
                {locked && <Ionicons name="lock-closed" size={14} color={SUB} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      <dialog.Dialog />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bannerType: { fontSize: 15, fontWeight: '800', color: TEXT },
  bannerTime: { fontSize: 11, color: MUTED, marginTop: 2 },
  statusPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel:  { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.7, marginBottom: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  rowValue:   { fontSize: 14, color: TEXT, flex: 1, fontWeight: '600' },
  coordText:  { fontSize: 11, color: SUB, marginLeft: 28, marginTop: -4, marginBottom: 4 },
  divider:    { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  descBox:    { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10 },
  descText:   { fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: 20 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 12 },

  photo: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#F3F4F6' },
  emptyEvidence: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E5E7EB',
    borderRadius: 10, paddingVertical: 28,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  emptyEvidenceText: { fontSize: 12, color: MUTED },

  audioBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, backgroundColor: '#F8FAFD',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  audioIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  audioSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  navBtn: {
    backgroundColor: NAVY, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  navBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  flowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  flowItemDone: { borderColor: NAVY + '40', backgroundColor: NAVY + '08' },
  flowItemDim:  { opacity: 0.55 },
  flowDot:      {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  flowLabel:    { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
});
