// Chat service — in-memory store, ready for Supabase Realtime or Socket.IO swap

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  isMine: boolean;
};

type RoomListener = (messages: ChatMessage[]) => void;

const rooms = new Map<string, ChatMessage[]>();
const listeners = new Map<string, RoomListener[]>();

// Seed demo messages for the general room
rooms.set('general', [
  {
    id: 'seed-1',
    roomId: 'general',
    userId: 'sys',
    userName: 'Admin Aegis',
    content: 'Selamat datang di chat komunitas Aegis Call! Gunakan ruang ini untuk berbagi informasi darurat.',
    createdAt: new Date(Date.now() - 7200000),
    isMine: false,
  },
  {
    id: 'seed-2',
    roomId: 'general',
    userId: 'u2',
    userName: 'Budi S.',
    content: 'Ada kebakaran kecil di kawasan Menteng, sudah ditangani Damkar. Warga sekitar harap waspada.',
    createdAt: new Date(Date.now() - 3600000),
    isMine: false,
  },
  {
    id: 'seed-3',
    roomId: 'general',
    userId: 'u3',
    userName: 'Siti R.',
    content: 'Terima kasih infonya Mas Budi. Saya lihat dari sini asapnya sudah berhenti.',
    createdAt: new Date(Date.now() - 2700000),
    isMine: false,
  },
  {
    id: 'seed-4',
    roomId: 'general',
    userId: 'u4',
    userName: 'Arif P.',
    content: 'Hati-hati juga ada kecelakaan di Jl. Sudirman arah Semanggi, macet panjang.',
    createdAt: new Date(Date.now() - 1200000),
    isMine: false,
  },
]);

export function getMessages(roomId: string): ChatMessage[] {
  // TODO: const { data } = await supabase.from('chat_messages').select('*').eq('room_id', roomId).order('created_at');
  return [...(rooms.get(roomId) ?? [])];
}

export function sendMessage(
  roomId: string,
  content: string,
  userId: string,
  userName: string,
): ChatMessage {
  // TODO: const { data } = await supabase.from('chat_messages').insert({ room_id: roomId, user_id: userId, content }).select().single();
  const msg: ChatMessage = {
    id: Date.now().toString(),
    roomId,
    userId,
    userName,
    content,
    createdAt: new Date(),
    isMine: true,
  };
  if (!rooms.has(roomId)) rooms.set(roomId, []);
  rooms.get(roomId)!.push(msg);

  const roomListeners = listeners.get(roomId) ?? [];
  roomListeners.forEach(fn => fn(rooms.get(roomId)!));

  return msg;
}

export function subscribeToRoom(roomId: string, callback: RoomListener): () => void {
  // TODO: supabase.channel(roomId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, ...).subscribe()
  if (!listeners.has(roomId)) listeners.set(roomId, []);
  listeners.get(roomId)!.push(callback);

  return () => {
    const arr = listeners.get(roomId) ?? [];
    const idx = arr.indexOf(callback);
    if (idx > -1) arr.splice(idx, 1);
  };
}