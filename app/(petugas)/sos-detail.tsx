import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useDialog } from '../../components/aegis/Dialog';
import {
  acknowledgeSosEvent,
  getSosEvent,
  getSosLocations,
  resolveSosEvent,
  respondToSosEvent,
  subscribeToSosEvent,
  subscribeToSosLocations,
} from '../../services/sosService';
import {
  SOS_STATUS_COLORS,
  SOS_STATUS_LABELS,
  type SosEvent,
  type SosLocation,
} from '../../types/sos';

// Same palette as navigate.tsx so the two map screens feel consistent.
const NAVY = '#003B71';
const NAVY_DEEP = '#002952';
const RED = '#DC2626';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BG = '#F8FAFD';
const CARD = '#FFFFFF';

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SosDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const dialog = useDialog();
  const { sosId } = useLocalSearchParams<{ sosId: string }>();

  const [event, setEvent] = useState<SosEvent | null>(null);
  const [locations, setLocations] = useState<SosLocation[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);
  // Reverse-geocode at most once per ~50m of movement to avoid spamming the API.
  const lastGeocodedRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initial load + realtime subscriptions
  useEffect(() => {
    if (!sosId) return;

    let unsubEvent: (() => void) | null = null;
    let unsubLocs: (() => void) | null = null;

    const reloadEvent = async () => {
      try {
        const fresh = await getSosEvent(sosId);
        if (mountedRef.current) setEvent(fresh);
      } catch (err) {
        console.warn('[sos-detail] reload event failed', err);
      }
    };

    (async () => {
      try {
        const [ev, locs] = await Promise.all([
          getSosEvent(sosId),
          getSosLocations(sosId),
        ]);
        if (!mountedRef.current) return;
        setEvent(ev);
        setLocations(locs);
        setLoading(false);
      } catch (err) {
        console.warn('[sos-detail] initial load failed', err);
        if (mountedRef.current) setLoading(false);
      }
    })();

    unsubEvent = subscribeToSosEvent(sosId, reloadEvent);
    unsubLocs = subscribeToSosLocations(sosId, (loc) => {
      if (mountedRef.current) setLocations(prev => [...prev, loc]);
    });

    return () => {
      mountedRef.current = false;
      unsubEvent?.();
      unsubLocs?.();
    };
  }, [sosId]);

  // Reverse-geocode the current point (best-effort, throttled by distance)
  useEffect(() => {
    if (!event?.currentLat || !event?.currentLng) return;
    const last = lastGeocodedRef.current;
    // Skip if moved less than ~50m (~0.0005 deg)
    if (last && Math.abs(last.lat - event.currentLat) < 0.0005 && Math.abs(last.lng - event.currentLng) < 0.0005) {
      return;
    }
    lastGeocodedRef.current = { lat: event.currentLat, lng: event.currentLng };
    (async () => {
      try {
        const res = await Location.reverseGeocodeAsync({
          latitude: event.currentLat!,
          longitude: event.currentLng!,
        });
        if (!mountedRef.current || res.length === 0) return;
        const r = res[0];
        const parts = [r.street, r.subregion ?? r.city, r.region].filter(Boolean);
        setAddress(parts.join(', '));
      } catch (err) {
        console.warn('[sos-detail] reverse geocode failed', err);
      }
    })();
  }, [event?.currentLat, event?.currentLng]);

  // Build the polyline trail. Append current point so even if locations
  // haven't synced yet, the marker and a single dot are correct.
  const trailCoords = useMemo(() => {
    const list = locations.map(l => ({ latitude: l.latitude, longitude: l.longitude }));
    if (event?.currentLat != null && event?.currentLng != null) {
      const last = list[list.length - 1];
      const curLat = event.currentLat;
      const curLng = event.currentLng;
      if (!last || last.latitude !== curLat || last.longitude !== curLng) {
        list.push({ latitude: curLat, longitude: curLng });
      }
    }
    return list;
  }, [locations, event?.currentLat, event?.currentLng]);

  const mapRegion = useMemo(() => {
    if (event?.currentLat != null && event?.currentLng != null) {
      return {
        latitude: event.currentLat,
        longitude: event.currentLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // Jakarta fallback so MapView still renders while waiting for first GPS ping.
    return {
      latitude: -6.2,
      longitude: 106.816,
      latitudeDelta: 0.4,
      longitudeDelta: 0.4,
    };
  }, [event?.currentLat, event?.currentLng]);

  // ── Status actions ────────────────────────────────────────────────
  const handleAcknowledge = async () => {
    if (!user || !event) return;
    setBusy(true);
    try {
      await acknowledgeSosEvent(event.id, user.id);
    } catch (err: any) {
      dialog.show({ type: 'error', title: 'Gagal', body: err?.message ?? 'Coba lagi.', primaryText: 'OK' });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleResponding = async () => {
    if (!user || !event) return;
    setBusy(true);
    try {
      await respondToSosEvent(event.id, user.id);
    } catch (err: any) {
      dialog.show({ type: 'error', title: 'Gagal', body: err?.message ?? 'Coba lagi.', primaryText: 'OK' });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleResolve = () => {
    if (!event) return;
    dialog.show({
      type: 'confirm',
      title: 'Selesaikan SOS?',
      body: 'Tandai sebagai selesai jika korban sudah dalam keadaan aman.',
      primaryText: 'Selesai',
      secondaryText: 'Batal',
      onPrimary: async () => {
        setBusy(true);
        try {
          await resolveSosEvent(event.id);
        } catch (err: any) {
          dialog.show({ type: 'error', title: 'Gagal', body: err?.message ?? 'Coba lagi.', primaryText: 'OK' });
        } finally {
          if (mountedRef.current) setBusy(false);
        }
      },
    });
  };

  const handleCall = () => {
    if (!event?.reporterPhone) return;
    const phone = event.reporterPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${phone}`).catch(() =>
      dialog.show({ type: 'error', title: 'Gagal', body: 'Tidak dapat melakukan panggilan.', primaryText: 'OK' }),
    );
  };

  const handleOpenMaps = () => {
    if (event?.currentLat == null || event?.currentLng == null) return;
    const lat = event.currentLat;
    const lng = event.currentLng;
    const label = encodeURIComponent(event.reporterName ?? 'Lokasi SOS');
    const nativeUrl = Platform.select({
      ios:     `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.canOpenURL('comgooglemaps://')
      .then(supported => Linking.openURL(supported && nativeUrl ? nativeUrl : fallback))
      .catch(() => Linking.openURL(fallback));
  };

  // ── Render ────────────────────────────────────────────────────────
  if (loading || !event) {
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
          <Text style={styles.headerTitle}>Detail SOS</Text>
        </LinearGradient>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>Memuat data SOS...</Text>
        </View>
      </View>
    );
  }

  const pillColor = SOS_STATUS_COLORS[event.status];
  const hasCoords = event.currentLat != null && event.currentLng != null;

  // Status-aware primary action button.
  let primaryAction: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void } | null = null;
  if (event.status === 'active') {
    primaryAction = { label: 'Tangani SOS', icon: 'checkmark-circle', onPress: handleAcknowledge };
  } else if (event.status === 'acknowledged') {
    primaryAction = { label: 'Sedang Menuju', icon: 'navigate-circle', onPress: handleResponding };
  } else if (event.status === 'responding') {
    primaryAction = { label: 'Tandai Selesai', icon: 'flag', onPress: handleResolve };
  }

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
        <Text style={styles.headerTitle}>Detail SOS</Text>
        <View style={[styles.headerStatusPill, { backgroundColor: pillColor }]}>
          <Text style={styles.headerStatusPillText}>{SOS_STATUS_LABELS[event.status].toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.mapWrap}>
        <MapView style={styles.map} region={mapRegion} showsUserLocation showsMyLocationButton>
          {hasCoords && (
            <Marker
              coordinate={{ latitude: event.currentLat!, longitude: event.currentLng! }}
              title={event.reporterName ?? 'Pengguna'}
              description="Posisi terkini SOS"
            >
              <View style={[styles.pin, { backgroundColor: RED }]}>
                <Ionicons name="alert" size={16} color="#fff" />
              </View>
            </Marker>
          )}
          {trailCoords.length > 1 && (
            <Polyline coordinates={trailCoords} strokeColor={RED} strokeWidth={3} />
          )}
        </MapView>

        {!hasCoords && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator color={RED} />
            <Text style={styles.mapOverlayText}>Menunggu lokasi dari pengguna...</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Reporter card */}
        <View style={styles.reporterCard}>
          <View style={styles.reporterAvatar}>
            <Text style={styles.reporterAvatarText}>
              {(event.reporterName ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.reporterName} numberOfLines={1}>
              {event.reporterName ?? 'Pengguna'}
            </Text>
            <Text style={styles.reporterPhone} numberOfLines={1}>
              {event.reporterPhone ?? 'Nomor tidak tersedia'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callIconBtn}
            onPress={handleCall}
            disabled={!event.reporterPhone}
            activeOpacity={0.85}
          >
            <Ionicons
              name="call"
              size={18}
              color={event.reporterPhone ? '#fff' : '#CBD5E1'}
            />
          </TouchableOpacity>
        </View>

        {/* Location info */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Lokasi Terkini</Text>
          <Text style={styles.infoValue} numberOfLines={3}>
            {address ?? (hasCoords
              ? `${event.currentLat!.toFixed(5)}, ${event.currentLng!.toFixed(5)}`
              : 'Belum tersedia')}
          </Text>
          {hasCoords && (
            <Text style={styles.infoSub}>
              {event.currentLat!.toFixed(5)}, {event.currentLng!.toFixed(5)}
              {' · '}
              {locations.length} titik tercatat
            </Text>
          )}
        </View>

        {/* Lifecycle timeline */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Linimasa</Text>
          <View style={styles.timeline}>
            <TimelineRow label="SOS dimulai" time={formatClock(event.startedAt)} active />
            <TimelineRow
              label="Diakui petugas"
              time={event.acknowledgedAt ? formatClock(event.acknowledgedAt) : null}
              active={!!event.acknowledgedAt}
            />
            <TimelineRow
              label="Menuju lokasi"
              time={event.status === 'responding' || event.resolvedAt
                ? (event.acknowledgedAt ? formatClock(event.acknowledgedAt) : '—')
                : null}
              active={event.status === 'responding' || !!event.resolvedAt}
            />
            <TimelineRow
              label={event.status === 'cancelled' ? 'Dibatalkan' : 'Selesai'}
              time={event.cancelledAt
                ? formatClock(event.cancelledAt)
                : event.resolvedAt
                ? formatClock(event.resolvedAt)
                : null}
              active={!!event.cancelledAt || !!event.resolvedAt}
              last
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          {hasCoords && (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleOpenMaps} activeOpacity={0.85}>
              <MaterialCommunityIcons name="map-marker-path" size={16} color={NAVY} />
              <Text style={styles.btnSecondaryText}>Buka Maps</Text>
            </TouchableOpacity>
          )}
          {primaryAction && (
            <TouchableOpacity
              style={[styles.btnPrimary, busy && styles.btnDisabled]}
              onPress={primaryAction.onPress}
              activeOpacity={0.85}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={primaryAction.icon} size={16} color="#fff" />
                  <Text style={styles.btnPrimaryText}>{primaryAction.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {!primaryAction && (
            <View style={[styles.btnPrimary, styles.btnDisabled, { flex: 1 }]}>
              <Text style={styles.btnPrimaryText}>
                {event.status === 'resolved' ? 'SOS Selesai' : 'SOS Dibatalkan'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <dialog.Dialog />
    </View>
  );
}

function TimelineRow({
  label,
  time,
  active,
  last,
}: {
  label: string;
  time: string | null;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, active ? { backgroundColor: RED } : { backgroundColor: '#CBD5E1' }]} />
        {!last && <View style={[styles.timelineLine, active ? { backgroundColor: '#FCA5A5' } : { backgroundColor: '#E2E8F0' }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
        <Text style={[styles.timelineLabel, !active && { color: MUTED }]}>{label}</Text>
        <Text style={styles.timelineTime}>{time ?? 'Belum'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 },
  headerStatusPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  headerStatusPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  mapWrap: { height: 280, position: 'relative' },
  map: { flex: 1 },
  mapOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  mapOverlayText: { fontSize: 12, color: MUTED, fontWeight: '600' },

  pin: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: MUTED },

  sheet: { flex: 1, backgroundColor: BG },
  sheetContent: { padding: 16, gap: 14 },

  reporterCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  reporterAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  reporterAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  reporterName: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 2 },
  reporterPhone: { fontSize: 12, color: MUTED, fontWeight: '600' },
  callIconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
  },

  infoBlock: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoLabel: {
    fontSize: 11, fontWeight: '700', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  infoValue: { fontSize: 14, color: TEXT, fontWeight: '700', lineHeight: 20 },
  infoSub:   { fontSize: 11.5, color: MUTED, fontWeight: '600', marginTop: 4 },

  timeline: { marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineLabel: { fontSize: 13, color: TEXT, fontWeight: '700' },
  timelineTime: { fontSize: 11.5, color: MUTED, fontWeight: '600', marginTop: 1 },

  actionRow: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: RED,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  btnDisabled: { backgroundColor: '#CBD5E1' },
  btnSecondary: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5, borderColor: NAVY,
    backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnSecondaryText: { color: NAVY, fontSize: 13, fontWeight: '700' },
});
