// Komunitas Siaga — opt-in nearby SOS alert.
//
// When a user enables `community_siaga_opt_in` in their profile, this provider:
//   1. starts a coarse expo-location watcher (60s / 100m) to know where they are
//   2. subscribes to new sos_events INSERTs from anyone
//   3. on each new event: filters out own events, computes Haversine distance,
//      and surfaces an in-app banner if it lands within ALERT_RADIUS_KM.
//
// Privacy: we never expose the victim's exact coordinates to the alert
// receiver — only their distance ("≈800m dari Anda"). The banner has no
// "open map" action in this phase; that's intentional, and the spec calls
// out push notifications as future work (expo-notifications not installed).

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import { AuthContext } from './AuthContext';
import { subscribeToNewSosEvents } from '../services/sosService';
import type { SosEvent } from '../types/sos';

const ALERT_RADIUS_KM = 5;

export type NearbySosAlert = {
  sosId: string;
  reporterName: string;
  distanceKm: number;
  startedAt: Date;
};

type CommunitySiagaContextValue = {
  /** Latest unacknowledged nearby alert, or null. Replaced (not queued) when a newer one arrives. */
  alert: NearbySosAlert | null;
  /** Dismiss the current alert. */
  dismiss: () => void;
};

const CommunitySiagaContext = createContext<CommunitySiagaContextValue>({
  alert: null,
  dismiss: () => {},
});

// Great-circle distance in km. Plenty accurate at the scale of a city block.
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function CommunitySiagaProvider({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext);
  const [alert, setAlert] = useState<NearbySosAlert | null>(null);

  // We need the current location inside the subscribe callback, but reading
  // from state would close over the initial render. Keep a mutable ref instead.
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Only run the watcher + subscription for opted-in regular users.
  // Petugas/admin already have the dashboard SOS feed; double-alerting them
  // would be noise.
  const enabled = !!user && user.role === 'user' && user.communitySiagaOptIn;

  useEffect(() => {
    if (!enabled) {
      // If user just toggled OFF, clear any visible alert.
      setAlert(null);
      locationRef.current = null;
      return;
    }

    let watcher: Location.LocationSubscription | null = null;
    let unsubSos: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        // Coarse watcher: 60s / 100m is fine for "am I near this SOS?"
        // — finer-grained tracking is reserved for the victim's own screen.
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 60_000, distanceInterval: 100 },
          (pos) => {
            locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          },
        );
        if (!mounted) {
          sub.remove();
          return;
        }
        watcher = sub;

        // Seed the ref with one immediate snapshot so the very first incoming
        // SOS doesn't get skipped just because the watcher hasn't ticked yet.
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {}
      } catch (err) {
        console.warn('[komunitas-siaga] location watch failed', err);
      }
    })();

    unsubSos = subscribeToNewSosEvents((event: SosEvent) => {
      if (!user || event.userId === user.id) return; // never alert about own SOS
      if (event.currentLat == null || event.currentLng == null) return;
      const here = locationRef.current;
      if (!here) return; // no location yet — skip silently

      const dist = haversineKm(here, {
        lat: event.currentLat,
        lng: event.currentLng,
      });
      if (dist > ALERT_RADIUS_KM) return;

      // Replace any existing alert with the newer one. Simpler than queueing
      // and matches user expectation that the latest alert is the relevant one.
      setAlert({
        sosId: event.id,
        reporterName: event.reporterName ?? 'Pengguna',
        distanceKm: dist,
        startedAt: event.startedAt,
      });
    });

    return () => {
      mounted = false;
      if (watcher) watcher.remove();
      if (unsubSos) unsubSos();
    };
  }, [enabled, user]);

  const value = useMemo<CommunitySiagaContextValue>(
    () => ({ alert, dismiss: () => setAlert(null) }),
    [alert],
  );

  return (
    <CommunitySiagaContext.Provider value={value}>
      {children}
    </CommunitySiagaContext.Provider>
  );
}

export function useCommunitySiaga(): CommunitySiagaContextValue {
  return useContext(CommunitySiagaContext);
}

// Exposed for components that want to format the distance themselves.
export function formatDistance(km: number): string {
  if (km < 1) return `≈${Math.round(km * 1000)} m`;
  return `≈${km.toFixed(1)} km`;
}
