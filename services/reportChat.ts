// Per-report chat — Supabase backed with realtime.

import { supabase } from './supabase';

export type SenderRole = 'user' | 'petugas' | 'admin';
export type AttachmentType = 'image' | 'audio';

export type ReportMessage = {
  id: string;
  reportId: string;
  senderId: string;
  senderRole: SenderRole;
  message: string | null;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
  createdAt: Date;
  readAt: Date | null;
  // joined from profiles for display
  senderName?: string;
};

type ProfileLite = { name: string | null };

type DbRow = {
  id: string;
  report_id: string;
  sender_id: string;
  sender_role: SenderRole;
  message: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  created_at: string;
  read_at: string | null;
  profiles?: ProfileLite | ProfileLite[] | null;
};

function pickProfile(p: DbRow['profiles']): ProfileLite | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

// Strip URLs that resolve only on the sender's local device (file://...).
// Old messages may have these; treat as missing so the other side doesn't crash.
function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('asset:')) return null;
  return url;
}

const SELECT = `
  id, report_id, sender_id, sender_role, message,
  attachment_url, attachment_type,
  created_at, read_at,
  profiles:profiles!report_messages_sender_id_profiles_fk ( name )
`;

function rowToMessage(row: DbRow): ReportMessage {
  return {
    id: row.id,
    reportId: row.report_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    message: row.message,
    attachmentUrl: sanitizeUrl(row.attachment_url),
    attachmentType: row.attachment_type,
    createdAt: new Date(row.created_at),
    readAt: row.read_at ? new Date(row.read_at) : null,
    senderName: pickProfile(row.profiles)?.name ?? undefined,
  };
}

export async function listReportMessages(reportId: string): Promise<ReportMessage[]> {
  const { data, error } = await supabase
    .from('report_messages')
    .select(SELECT)
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as DbRow[]).map(rowToMessage);
}

export async function sendReportMessage(input: {
  reportId: string;
  senderId: string;
  senderRole: SenderRole;
  message?: string;
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
}): Promise<ReportMessage> {
  const trimmed = input.message?.trim() || null;
  if (!trimmed && !input.attachmentUrl) {
    throw new Error('Message or attachment is required.');
  }

  const { data, error } = await supabase
    .from('report_messages')
    .insert({
      report_id: input.reportId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      message: trimmed,
      attachment_url: input.attachmentUrl ?? null,
      attachment_type: input.attachmentType ?? null,
    })
    .select(SELECT)
    .single();

  if (error) throw error;
  return rowToMessage(data as unknown as DbRow);
}

/**
 * Subscribe to INSERT events on report_messages for one report.
 * Returns unsubscribe.
 */
// Unique channel id per subscribe — see note in reportService.ts
let chatChannelCounter = 0;
const nextChatChannelId = () => `${Date.now()}-${++chatChannelCounter}`;

export function subscribeToReportMessages(
  reportId: string,
  onMessage: (msg: ReportMessage) => void,
): () => void {
  const channel = supabase
    .channel(`report-msgs-${reportId}-${nextChatChannelId()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'report_messages',
        filter: `report_id=eq.${reportId}`,
      },
      (payload) => {
        // payload.new is the raw row without the joined profiles; we still
        // surface it so the UI can append immediately. Names will be filled
        // in by the next full fetch if needed.
        const row = payload.new as DbRow;
        onMessage(rowToMessage({ ...row, profiles: null }));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
