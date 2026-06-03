// SOS service — Supabase backed. Mirrors the shape of reportService.ts:
// snake_case DB rows <-> camelCase app models, named channels for realtime.

import { supabase } from './supabase';
import {
  ACTIVE_SOS_STATUSES,
  type SosEvent,
  type SosLocation,
  type SosStatus,
} from '../types/sos';

type ProfileLite = { name: string | null; phone: string | null };

type DbSosEventRow = {
  id: string;
  user_id: string;
  status: SosStatus;
  current_lat: number | null;
  current_lng: number | null;
  started_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  cancelled_at: string | null;
  handled_by: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  // PostgREST may return embed as object OR array depending on join shape.
  profiles?: ProfileLite | ProfileLite[] | null;
};

type DbSosLocationRow = {
  id: string;
  sos_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
};

function pickProfile(p: DbSosEventRow['profiles']): ProfileLite | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

// Named FK constraint added in schema.sql so PostgREST can embed reporter info.
const EVENT_SELECT = `
  id, user_id, status, current_lat, current_lng,
  started_at, acknowledged_at, resolved_at, cancelled_at,
  handled_by, note, created_at, updated_at,
  profiles:profiles!sos_events_user_id_profiles_fk ( name, phone )
`;

function rowToEvent(row: DbSosEventRow): SosEvent {
  const profile = pickProfile(row.profiles);
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    currentLat: row.current_lat !== null ? Number(row.current_lat) : null,
    currentLng: row.current_lng !== null ? Number(row.current_lng) : null,
    startedAt: new Date(row.started_at),
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
    handledBy: row.handled_by,
    note: row.note,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
    reporterName: profile?.name ?? undefined,
    reporterPhone: profile?.phone ?? undefined,
  };
}

function rowToLocation(row: DbSosLocationRow): SosLocation {
  return {
    id: row.id,
    sosId: row.sos_id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracy: row.accuracy !== null ? Number(row.accuracy) : null,
    recordedAt: new Date(row.recorded_at),
  };
}

// Supabase channels are global; reusing the same name across subscribe()
// calls makes them share one subscription and unsubscribing one kills the
// others. Suffix every channel name with a unique id.
let channelCounter = 0;
const nextChannelId = () => `${Date.now()}-${++channelCounter}`;

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export async function createSosEvent(input: {
  userId: string;
  latitude: number | null;
  longitude: number | null;
  note?: string | null;
}): Promise<SosEvent> {
  const { data, error } = await supabase
    .from('sos_events')
    .insert({
      user_id: input.userId,
      current_lat: input.latitude,
      current_lng: input.longitude,
      note: input.note ?? null,
    })
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return rowToEvent(data as unknown as DbSosEventRow);
}

// Append a GPS ping to the trail AND advance current_lat/lng on the event row
// so dashboard listeners (who only watch sos_events) see the move too.
export async function recordSosLocation(
  sosId: string,
  latitude: number,
  longitude: number,
  accuracy: number | null = null,
): Promise<void> {
  const { error: insertError } = await supabase
    .from('sos_locations')
    .insert({ sos_id: sosId, latitude, longitude, accuracy });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from('sos_events')
    .update({ current_lat: latitude, current_lng: longitude })
    .eq('id', sosId);
  if (updateError) throw updateError;
}

export async function updateSosStatus(
  sosId: string,
  status: SosStatus,
  patch: { handledBy?: string | null; note?: string | null } = {},
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (patch.handledBy !== undefined) update.handled_by = patch.handledBy;
  if (patch.note !== undefined) update.note = patch.note;

  const { error } = await supabase
    .from('sos_events')
    .update(update)
    .eq('id', sosId);
  if (error) throw error;
}

// Convenience wrappers so callers don't have to import the status type.
export const cancelSosEvent     = (sosId: string) => updateSosStatus(sosId, 'cancelled');
export const resolveSosEvent    = (sosId: string) => updateSosStatus(sosId, 'resolved');
export const acknowledgeSosEvent = (sosId: string, handledBy: string) =>
  updateSosStatus(sosId, 'acknowledged', { handledBy });
export const respondToSosEvent  = (sosId: string, handledBy: string) =>
  updateSosStatus(sosId, 'responding', { handledBy });

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

export async function getSosEvent(sosId: string): Promise<SosEvent | null> {
  const { data, error } = await supabase
    .from('sos_events')
    .select(EVENT_SELECT)
    .eq('id', sosId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEvent(data as unknown as DbSosEventRow) : null;
}

// Returns the user's currently-open SOS (if any). The schema enforces at
// most one open SOS per user via a partial unique index, so this is safe to
// call before INSERT to resume an existing session.
export async function getActiveSosForUser(userId: string): Promise<SosEvent | null> {
  const { data, error } = await supabase
    .from('sos_events')
    .select(EVENT_SELECT)
    .eq('user_id', userId)
    .in('status', ACTIVE_SOS_STATUSES as unknown as SosStatus[])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEvent(data as unknown as DbSosEventRow) : null;
}

export async function listActiveSosEvents(): Promise<SosEvent[]> {
  const { data, error } = await supabase
    .from('sos_events')
    .select(EVENT_SELECT)
    .in('status', ACTIVE_SOS_STATUSES as unknown as SosStatus[])
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as DbSosEventRow[]).map(rowToEvent);
}

export async function getSosLocations(sosId: string): Promise<SosLocation[]> {
  const { data, error } = await supabase
    .from('sos_locations')
    .select('id, sos_id, latitude, longitude, accuracy, recorded_at')
    .eq('sos_id', sosId)
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as DbSosLocationRow[]).map(rowToLocation);
}

// -----------------------------------------------------------------------------
// Realtime subscriptions
// -----------------------------------------------------------------------------

export type SosChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/** All sos_events changes — used by the petugas dashboard to refresh the feed. */
export function subscribeToSosEvents(
  cb: (event: SosChangeEvent) => void,
): () => void {
  const channel = supabase
    .channel(`sos-feed-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sos_events' },
      (payload) => cb(payload.eventType as SosChangeEvent),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * Changes for one specific SOS — used by:
 *   - user emergency-active screen (to show status updates from petugas)
 *   - petugas sos-detail screen (to keep status/marker in sync)
 */
export function subscribeToSosEvent(
  sosId: string,
  cb: (event: 'UPDATE' | 'DELETE') => void,
): () => void {
  const channel = supabase
    .channel(`sos-${sosId}-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sos_events', filter: `id=eq.${sosId}` },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          cb(payload.eventType);
        }
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** New GPS pings on the trail for one SOS — used by sos-detail map. */
export function subscribeToSosLocations(
  sosId: string,
  cb: (loc: SosLocation) => void,
): () => void {
  const channel = supabase
    .channel(`sos-loc-${sosId}-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sos_locations', filter: `sos_id=eq.${sosId}` },
      (payload) => cb(rowToLocation(payload.new as DbSosLocationRow)),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * INSERT-only feed of new SOS events anywhere — used by Komunitas Siaga
 * (Phase 4) to evaluate nearby alerts client-side without re-fetching.
 */
export function subscribeToNewSosEvents(
  cb: (event: SosEvent) => void,
): () => void {
  const channel = supabase
    .channel(`sos-new-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sos_events' },
      (payload) => cb(rowToEvent(payload.new as DbSosEventRow)),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
