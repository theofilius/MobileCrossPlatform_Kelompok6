// Community chat (general room) — Supabase backed, with image/voice support.

import { supabase } from './supabase';

export type ChatAttachmentType = 'image' | 'audio';

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string | null;
  attachmentUrl: string | null;
  attachmentType: ChatAttachmentType | null;
  createdAt: Date;
  isMine: boolean;
};

type DbRow = {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: ChatAttachmentType | null;
  created_at: string;
};

const SELECT = `
  id, room_id, user_id, user_name, content,
  attachment_url, attachment_type, created_at
`;

// Stale file:// URIs from old messages don't resolve on other devices.
function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('asset:')) return null;
  return url;
}

function rowToMessage(row: DbRow, currentUserId?: string): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    attachmentUrl: sanitizeUrl(row.attachment_url),
    attachmentType: row.attachment_type,
    createdAt: new Date(row.created_at),
    isMine: !!currentUserId && row.user_id === currentUserId,
  };
}

export async function getMessages(roomId: string, currentUserId?: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(SELECT)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data as unknown as DbRow[]).map(r => rowToMessage(r, currentUserId));
}

export async function sendMessage(input: {
  roomId: string;
  userId: string;
  userName: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: ChatAttachmentType;
}): Promise<ChatMessage> {
  const trimmed = input.content?.trim() || null;
  if (!trimmed && !input.attachmentUrl) {
    throw new Error('Pesan atau lampiran wajib diisi.');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: input.roomId,
      user_id: input.userId,
      user_name: input.userName,
      content: trimmed,
      attachment_url: input.attachmentUrl ?? null,
      attachment_type: input.attachmentType ?? null,
    })
    .select(SELECT)
    .single();

  if (error) throw error;
  return rowToMessage(data as unknown as DbRow, input.userId);
}

// Unique channel id per subscribe — see note in reportService.ts
let roomChannelCounter = 0;
const nextRoomChannelId = () => `${Date.now()}-${++roomChannelCounter}`;

export function subscribeToRoom(
  roomId: string,
  currentUserId: string | undefined,
  onMessage: (msg: ChatMessage) => void,
): () => void {
  const channel = supabase
    .channel(`chat-${roomId}-${nextRoomChannelId()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        const row = payload.new as DbRow;
        onMessage(rowToMessage(row, currentUserId));
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
