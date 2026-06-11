// Report service — Supabase backed.
// Maps between DB row (snake_case, enum status) and app Report (camelCase).

import { supabase } from './supabase';

export type EmergencyType = 'fire' | 'accident' | 'crime' | 'disaster' | 'medical' | 'other';

export type ReportStatus =
  | 'pending'
  | 'accepted'
  | 'ontheway'
  | 'arrived'
  | 'resolved'
  | 'cancelled';

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export type Report = {
  id: string;
  userId: string | null;
  type: EmergencyType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  photoUri: string | null;
  audioUri: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  assignedTo: string | null;
  // Moderation flag — petugas can mark a clearly-fake report for trust
  // scoring. Independent of status; a report can be 'resolved' AND marked
  // false (e.g. petugas arrived, found nothing, then flagged).
  markedFalseAt: Date | null;
  markedFalseBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Reporter profile (joined; not always populated)
  reporterName?: string;
  reporterPhone?: string;
};

// Per-user moderation snapshot for category reports — mirrors the SOS
// UserTrustScore type. Shown to petugas in the report card and detail
// screen so they can see if a reporter has a track record of fake reports.
export type ReporterTrustScore = {
  totalReports: number;
  markedFalse: number;
};

export const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  fire: 'Kebakaran',
  accident: 'Kecelakaan',
  crime: 'Kriminalitas',
  disaster: 'Bencana Alam',
  medical: 'Darurat Medis',
  other: 'Lainnya',
};

export const EMERGENCY_COLORS: Record<EmergencyType, string> = {
  fire: '#EF4444',
  accident: '#F97316',
  crime: '#8B5CF6',
  disaster: '#3B82F6',
  medical: '#10B981',
  other: '#6B7280',
};

// User-facing status labels (id-ID). DB has 6 values, UI collapses 3 of them.
export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Menunggu',
  accepted: 'Diproses',
  ontheway: 'Diproses',
  arrived: 'Diproses',
  resolved: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const PRIORITY_LABELS: Record<ReportPriority, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Darurat',
};

export const PRIORITY_COLORS: Record<ReportPriority, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
};

type ProfileLite = { name: string | null; phone: string | null };

type DbReportRow = {
  id: string;
  user_id: string | null;
  type: EmergencyType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  photo_url: string | null;
  audio_url: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  assigned_to: string | null;
  marked_false_at: string | null;
  marked_false_by: string | null;
  created_at: string;
  updated_at: string;
  // PostgREST may return embed as object OR array depending on join shape.
  profiles?: ProfileLite | ProfileLite[] | null;
};

function pickProfile(p: DbReportRow['profiles']): ProfileLite | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

/**
 * Strip URLs that point to the reporter's local device (file://...). These
 * exist on old reports created before the Storage upload was wired up — the
 * URI only resolves on the original device. Treat them as missing so other
 * devices show the empty state instead of crashing the audio player or
 * rendering a broken image.
 */
function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('asset:')) return null;
  return url;
}

const SELECT = `
  id, user_id, type, description, latitude, longitude, address,
  photo_url, audio_url, status, priority, assigned_to,
  marked_false_at, marked_false_by,
  created_at, updated_at,
  profiles:profiles!reports_user_id_profiles_fk ( name, phone )
`;

function rowToReport(row: DbReportRow): Report {
  const profile = pickProfile(row.profiles);
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    description: row.description,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    address: row.address ?? '',
    photoUri: sanitizeUrl(row.photo_url),
    audioUri: sanitizeUrl(row.audio_url),
    status: row.status,
    priority: row.priority ?? 'medium',
    assignedTo: row.assigned_to,
    markedFalseAt: row.marked_false_at ? new Date(row.marked_false_at) : null,
    markedFalseBy: row.marked_false_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
    reporterName: profile?.name ?? undefined,
    reporterPhone: profile?.phone ?? undefined,
  };
}

export async function createReport(input: {
  userId: string;
  type: EmergencyType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  photoUri: string | null;
  audioUri: string | null;
  priority?: ReportPriority;
}): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: input.userId,
      type: input.type,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      photo_url: input.photoUri,
      audio_url: input.audioUri,
      priority: input.priority ?? 'medium',
    })
    .select(SELECT)
    .single();

  if (error) throw error;
  return rowToReport(data as unknown as DbReportRow);
}

export async function listReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as DbReportRow[]).map(rowToReport);
}

/** Reports assigned to a specific petugas/admin (their personal history). */
export async function listAssignedReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(SELECT)
    .eq('assigned_to', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as DbReportRow[]).map(rowToReport);
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToReport(data as unknown as DbReportRow) : null;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  patch: { assignedTo?: string | null } = {},
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;

  const { error } = await supabase
    .from('reports')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Staff-only: flag this category report as fake/prank.
 */
export async function markReportFalse(reportId: string, staffId: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      marked_false_at: new Date().toISOString(),
      marked_false_by: staffId,
    })
    .eq('id', reportId);
  if (error) throw error;
}

/** Undo a false mark. */
export async function unmarkReportFalse(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ marked_false_at: null, marked_false_by: null })
    .eq('id', reportId);
  if (error) throw error;
}

/** Fetch trust score for a specific reporter. */
export async function getReporterTrustScore(userId: string): Promise<ReporterTrustScore> {
  const [{ count: total, error: e1 }, { count: falseCount, error: e2 }] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('marked_false_at', 'is', null),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { totalReports: total ?? 0, markedFalse: falseCount ?? 0 };
}

/** Batched lookup of trust scores for multiple reporters. */
export async function getTrustScoresForReporters(
  userIds: string[],
): Promise<Map<string, ReporterTrustScore>> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return new Map();
  const results = await Promise.all(
    unique.map(async (id) => [id, await getReporterTrustScore(id)] as const),
  );
  return new Map(results);
}

/**
 * Per-petugas stats: count of reports assigned to them, grouped by status bucket.
 * Buckets follow the dashboard convention (active = accepted/ontheway/arrived).
 */
export type PetugasStats = {
  total: number;
  active: number;
  resolved: number;
};

export async function getPetugasStats(userId: string): Promise<PetugasStats> {
  const { data, error } = await supabase
    .from('reports')
    .select('status')
    .eq('assigned_to', userId);

  if (error) throw error;
  const rows = (data ?? []) as { status: ReportStatus }[];
  return {
    total:    rows.length,
    active:   rows.filter(r => ['accepted', 'ontheway', 'arrived'].includes(r.status)).length,
    resolved: rows.filter(r => r.status === 'resolved').length,
  };
}

export type ReportsChangeCallback = (event: 'INSERT' | 'UPDATE' | 'DELETE') => void;

/**
 * Subscribe to live changes on the reports table. Returns an unsubscribe fn.
 * Use this to refetch the list when a new report arrives or status changes.
 */
// Supabase channels are global — using the same name across components means
// they share one subscription, and unsubscribing one kills the others.
// Every subscribe() call needs a unique channel name.
let channelCounter = 0;
const nextChannelId = () => `${Date.now()}-${++channelCounter}`;

export function subscribeToReports(cb: ReportsChangeCallback): () => void {
  const channel = supabase
    .channel(`reports-feed-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      (payload) => cb(payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to changes on a single report row (UPDATE / DELETE).
 * The callback fires with the change event type. Caller is responsible
 * for refetching the report to render the latest state.
 */
export function subscribeToReport(
  reportId: string,
  cb: (event: 'UPDATE' | 'DELETE') => void,
): () => void {
  const channel = supabase
    .channel(`report-${reportId}-${nextChannelId()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports', filter: `id=eq.${reportId}` },
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          cb(payload.eventType);
        }
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
