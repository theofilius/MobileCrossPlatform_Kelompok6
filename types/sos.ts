// SOS event types — mirrored from public.sos_events / sos_locations.
// Matches services/sosService.ts row-to-model conversions.

import { Colors } from '../constants/theme';

export type SosStatus =
  | 'active'         // user just pressed SOS; nobody has acknowledged yet
  | 'acknowledged'   // petugas has seen it but isn't moving yet
  | 'responding'     // petugas is en route
  | 'resolved'       // resolved by petugas (terminal)
  | 'cancelled';     // cancelled by user (terminal)

export type SosEvent = {
  id: string;
  userId: string;
  status: SosStatus;
  currentLat: number | null;
  currentLng: number | null;
  startedAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  handledBy: string | null;
  note: string | null;
  // Moderation flag — petugas can mark a clearly-fake SOS for trust scoring.
  // Independent of status (an SOS can be 'cancelled' AND marked false).
  markedFalseAt: Date | null;
  markedFalseBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined reporter profile (populated by sosService SELECT)
  reporterName?: string;
  reporterPhone?: string;
};

// Per-user moderation snapshot — shown in petugas dashboard / SOS detail
// so they know if this reporter has a track record of fake reports.
export type UserTrustScore = {
  totalSos: number;
  markedFalse: number;
};

export type SosLocation = {
  id: string;
  sosId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: Date;
};

// Statuses that mean "still in progress" — used to:
//   - filter the petugas dashboard feed
//   - decide whether the user's emergency-active screen should keep watching
//   - enforce the one-open-SOS-per-user unique index in the DB
export const ACTIVE_SOS_STATUSES: ReadonlyArray<SosStatus> = [
  'active',
  'acknowledged',
  'responding',
] as const;

export function isActiveSos(status: SosStatus): boolean {
  return ACTIVE_SOS_STATUSES.includes(status);
}

export const SOS_STATUS_LABELS: Record<SosStatus, string> = {
  active:       'SOS Aktif',
  acknowledged: 'Diakui Petugas',
  responding:   'Petugas Menuju Lokasi',
  resolved:     'Selesai',
  cancelled:    'Dibatalkan',
};

// Short labels for status pills in tight UI (dashboard card, list).
export const SOS_STATUS_SHORT: Record<SosStatus, string> = {
  active:       'AKTIF',
  acknowledged: 'DIAKUI',
  responding:   'OTW',
  resolved:     'SELESAI',
  cancelled:    'BATAL',
};

export const SOS_STATUS_COLORS: Record<SosStatus, string> = {
  active:       Colors.emergency,  // red — needs immediate response
  acknowledged: Colors.warning,    // amber — known but not yet moving
  responding:   Colors.info,       // blue — en route
  resolved:     Colors.success,    // green — done
  cancelled:    Colors.gray,       // neutral — user cancelled
};
