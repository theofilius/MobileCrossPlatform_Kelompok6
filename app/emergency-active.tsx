import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { getPrimaryContact } from '../services/contactsService';
import { addNotification } from '../services/notificationsService';
import {
  cancelSosEvent,
  computeSosCooldown,
  createSosEvent,
  getLastSosForUser,
  getSosEvent,
  recordSosLocation,
  subscribeToSosEvent,
} from '../services/sosService';
import { isActiveSos, type SosEvent, type SosStatus } from '../types/sos';
import { useDialog } from '../components/aegis/Dialog';

const EMERGENCY_FALLBACK = '112';

// Per-status copy shown under the timer. Mirrors SOS_STATUS_LABELS but with
// a verb-tense that fits the active screen ("Petugas sedang menuju..." vs
// the pill label "Petugas Menuju Lokasi").
const STATUS_SUBTEXT: Record<SosStatus, string> = {
  active:       'Mencari petugas terdekat...',
  acknowledged: 'Petugas mengakui panggilan Anda',
  responding:   'Petugas sedang menuju lokasi Anda',
  resolved:     'Bantuan telah tiba — keadaan aman',
  cancelled:    'Darurat dibatalkan',
};

// Statuses where there's no point sending more GPS pings.
function isTerminal(status: SosStatus): boolean {
  return status === 'resolved' || status === 'cancelled';
}

// Horizontal 4-step indicator: SOS → Diakui → Menuju → Selesai.
// `cancelled` collapses to a single muted row instead of a progress bar.
const PROGRESS_STEPS: { key: SosStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'active',       label: 'SOS',     icon: 'alert' },
  { key: 'acknowledged', label: 'Diakui',  icon: 'checkmark' },
  { key: 'responding',   label: 'Menuju',  icon: 'navigate' },
  { key: 'resolved',     label: 'Selesai', icon: 'flag' },
];

function StatusProgress({ status }: { status: SosStatus }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelledChip}>
        <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.9)" />
        <Text style={styles.cancelledChipText}>DIBATALKAN</Text>
      </View>
    );
  }

  const currentIdx = PROGRESS_STEPS.findIndex(s => s.key === status);

  return (
    <View style={styles.progressRow}>
      {PROGRESS_STEPS.map((step, idx) => {
        const reached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  reached && styles.progressDotReached,
                  isCurrent && styles.progressDotCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={12}
                  color={reached ? '#DC2626' : 'rgba(255,255,255,0.5)'}
                />
              </View>
              <Text style={[styles.progressLabel, reached && styles.progressLabelReached]}>
                {step.label}
              </Text>
            </View>
            {idx < PROGRESS_STEPS.length - 1 && (
              <View style={[styles.progressBar, idx < currentIdx && styles.progressBarReached]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function EmergencyActiveScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const { user } = useContext(AuthContext);
  const [seconds, setSeconds] = useState(0);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sosEvent, setSosEvent] = useState<SosEvent | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // sosEventRef mirrors sosEvent so the GPS watcher callback (closed over the
  // initial render) can see the latest status without retriggering watchPositionAsync.
  const sosEventRef = useRef<SosEvent | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    sosEventRef.current = sosEvent;
  }, [sosEvent]);

  // ── Timer + vibration + notification log (no Supabase dependency) ──
  useEffect(() => {
    Vibration.vibrate([0, 400, 200, 400, 200, 400]);

    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Log to notification history (in-memory for now; migrates in Phase 6)
    addNotification({
      type: 'sos',
      title: 'SOS aktif',
      body: 'Mode darurat dimulai. Kontak utama sedang dihubungi.',
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Vibration.cancel();
    };
  }, []);

  // ── Supabase SOS event: create-or-resume, live track, subscribe to status ──
  useEffect(() => {
    if (!user) {
      // Auth not ready (shouldn't happen because AuthGate blocks this screen)
      // — fall back to a one-time location snapshot so the SMS/Maps buttons still work.
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          if (mountedRef.current) {
            setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        } catch {}
      })();
      return;
    }

    (async () => {
      // 1. Initial location (best-effort; needed both for event seed and SMS share)
      let initial: { latitude: number; longitude: number } | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          initial = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          if (mountedRef.current) setCoords(initial);
        }
      } catch (err) {
        console.warn('[sos] initial location failed', err);
      }

      // 2. Resume / cooldown / create-new.
      //    - If user has an OPEN SOS → resume it (handles re-entry after backing out).
      //    - Else if last SOS was cancelled within 15 min → block with cooldown dialog.
      //    - Else → create a new SOS event.
      //    Schema's partial unique index ensures we can't end up with 2 open SOS
      //    per user even under race conditions.
      let event: SosEvent | null = null;
      try {
        const last = await getLastSosForUser(user.id);
        if (last && isActiveSos(last.status)) {
          event = last;
        } else {
          const cooldown = computeSosCooldown(last);
          if (cooldown.active) {
            if (!mountedRef.current) return;
            dialog.show({
              type: 'warning',
              title: 'Tunggu Beberapa Menit',
              body:
                `Anda baru saja membatalkan SOS. Tunggu ${cooldown.remainingMinutes} menit ` +
                `sebelum dapat memicu SOS lagi. Untuk darurat mendesak, telepon 112 langsung.`,
              primaryText: 'Mengerti',
              onPrimary: () => router.back(),
            });
            return; // skip event creation, subscription, and watcher setup
          }
          event = await createSosEvent({
            userId: user.id,
            latitude: initial?.latitude ?? null,
            longitude: initial?.longitude ?? null,
          });
        }
      } catch (err) {
        console.warn('[sos] create/resume failed', err);
        return;
      }
      if (!mountedRef.current || !event) return;
      setSosEvent(event);

      // 3. Subscribe to status changes from petugas/admin.
      unsubRef.current = subscribeToSosEvent(event.id, async () => {
        try {
          const fresh = await getSosEvent(event!.id);
          if (!fresh || !mountedRef.current) return;
          setSosEvent(fresh);
          // Petugas resolved or user cancelled elsewhere → stop sending pings.
          if (isTerminal(fresh.status) && watcherRef.current) {
            watcherRef.current.remove();
            watcherRef.current = null;
          }
        } catch (err) {
          console.warn('[sos] refresh on subscribe failed', err);
        }
      });

      // 4. Live location watcher — every 5s OR every 10m of movement, whichever first.
      //    Each tick: append to sos_locations + advance sos_events.current_lat/lng.
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (pos) => {
            const current = sosEventRef.current;
            if (!current || isTerminal(current.status)) return;
            if (mountedRef.current) {
              setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            }
            try {
              await recordSosLocation(
                current.id,
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy ?? null,
              );
            } catch (err) {
              console.warn('[sos] recordSosLocation failed', err);
            }
          },
        );
        if (!mountedRef.current) {
          sub.remove();
          return;
        }
        watcherRef.current = sub;
      } catch (err) {
        console.warn('[sos] watchPositionAsync failed', err);
      }
    })();
  }, [user]);

  // ── Cleanup on unmount: stop watcher + unsubscribe (but DO NOT auto-cancel) ──
  //    Backing out of the screen leaves the SOS open so petugas can still respond.
  //    Only the explicit cancel button below transitions the row to 'cancelled'.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  const targetPhone = (): string => {
    const primary = getPrimaryContact();
    return primary?.phone ? primary.phone.replace(/[^\d+]/g, '') : EMERGENCY_FALLBACK;
  };

  const buildLocationString = (): string => {
    if (!coords) return 'lokasi tidak tersedia';
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  };

  const handleCall = () => {
    const phone = targetPhone();
    const primary = getPrimaryContact();
    const label = primary ? `${primary.name} (${phone})` : `${EMERGENCY_FALLBACK}`;

    dialog.show({
      type: 'confirm',
      title: 'Telepon Darurat',
      body: `Hubungi ${label}?`,
      primaryText: 'Telepon',
      secondaryText: 'Batal',
      onPrimary: () => {
        Linking.openURL(`tel:${phone}`).catch(() =>
          dialog.show({ type: 'error', title: '!', body: 'Tidak dapat melakukan panggilan.', primaryText: 'OK' })
        );
        addNotification({
          type: 'call',
          title: 'Panggilan darurat',
          body: `Menghubungi ${label}`,
        });
      }
    });
  };

  const handleMessage = () => {
    const phone = targetPhone();
    const locText = buildLocationString();
    const body = encodeURIComponent(`Tolong saya dalam keadaan darurat di titik: ${locText}`);
    // iOS uses & as separator, Android uses ?
    const sep = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${phone}${sep}body=${body}`;

    Linking.openURL(url).catch(() => dialog.show({ type: 'error', title: '!', body: 'Tidak dapat membuka aplikasi pesan.', primaryText: 'OK' }));
    addNotification({
      type: 'call',
      title: 'Pesan darurat',
      body: `SMS ke ${phone} dengan lokasi`,
    });
  };

  const handleLocation = () => {
    if (!coords) {
      dialog.show({ type: 'info', title: '!', body: 'Lokasi belum tersedia. Tunggu beberapa detik.', primaryText: 'OK' });
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    Linking.openURL(url).catch(() => dialog.show({ type: 'error', title: '!', body: 'Tidak dapat membuka peta.', primaryText: 'OK' }));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCancel = () => {
    const current = sosEventRef.current;
    // If the SOS already terminated (petugas resolved or another device
    // cancelled it), this button just dismisses the screen — no API call.
    if (!current || isTerminal(current.status)) {
      router.back();
      return;
    }

    dialog.show({
      type: 'warning',
      title: 'Batalkan Darurat?',
      body: 'Mode darurat akan dinonaktifkan dan kontak kamu akan diberitahu.',
      primaryText: 'Batalkan Darurat',
      secondaryText: 'Tidak, tetap aktif',
      onPrimary: async () => {
        try {
          await cancelSosEvent(current.id);
        } catch (err) {
          console.warn('[sos] cancel failed', err);
          // Still navigate back — the screen has no real "stay" recovery path.
        }
        router.back();
      }
    });
  };

  return (
    <LinearGradient colors={['#7F1D1D', '#DC2626']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Top — badge + visual weight */}
        <View style={styles.topSection}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>DARURAT AKTIF</Text>
          </View>
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={72}
            color="rgba(255,255,255,0.15)"
            style={styles.shieldIcon}
          />

          <TouchableOpacity
            style={styles.trackingBtn}
            onPress={() => router.push('/responder-tracking' as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#FFFFFF" />
            <Text style={styles.trackingBtnText}>Lihat Pelacakan Responder</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Middle — timer + lifecycle progress + status caption */}
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>

          <StatusProgress status={sosEvent?.status ?? 'active'} />

          <Text style={styles.statusText}>
            {sosEvent ? STATUS_SUBTEXT[sosEvent.status] : 'Menyambungkan ke petugas darurat...'}
          </Text>
          {(() => {
            const p = getPrimaryContact();
            if (!p) return null;
            return (
              <Text style={styles.statusSubtext}>
                Kontak utama: {p.name}
              </Text>
            );
          })()}
        </View>

        {/* Bottom — actions + cancel */}
        <View style={styles.bottomSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Ionicons name="call" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Telepon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-ellipses" size={26} color="#DC2626" />
              <Text style={styles.actionLabel}>Pesan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, !coords && styles.actionBtnDisabled]}
              onPress={handleLocation}
              disabled={!coords}
            >
              <Ionicons name="location" size={26} color={coords ? '#DC2626' : 'rgba(220,38,38,0.4)'} />
              <Text style={[styles.actionLabel, !coords && { color: 'rgba(220,38,38,0.4)' }]}>Lokasi</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Batalkan Darurat</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
      <dialog.Dialog />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 16,
  },

  // Top
  topSection: {
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEF08A',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },
  shieldIcon: {
    marginTop: 20,
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
  trackingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Middle
  timerSection: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 6,
  },
  // ── Lifecycle progress row ──
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  progressStep: { alignItems: 'center', width: 56 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotReached: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  progressDotCurrent: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  progressLabelReached: {
    color: '#FFFFFF',
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 12,
    maxWidth: 30,
  },
  progressBarReached: {
    backgroundColor: '#FFFFFF',
  },

  // ── Cancelled chip (overrides progress when status === 'cancelled') ──
  cancelledChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 14,
  },
  cancelledChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },

  // Bottom
  bottomSection: {},
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  actionBtn: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
