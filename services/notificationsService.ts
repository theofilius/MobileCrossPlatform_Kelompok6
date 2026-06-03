// Notifications — Supabase-backed (Phase 6 migration).
//
// Same pattern as contactsService:
//   - Local cache mirrors the user's notifications rows.
//   - Reads (getNotifications, getUnreadCount, subscribe) are sync from cache.
//   - Mutations write to Supabase; the realtime subscription reconciles.
//   - AuthContext drives init / teardown.

import { supabase } from './supabase';

export type NotifType = 'sos' | 'call' | 'contact' | 'security' | 'permission';

export type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
};

type DbRow = {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Listener = (items: Notification[]) => void;

// ── Module state ─────────────────────────────────────────────────────
let currentUserId: string | null = null;
let cache: Notification[] = [];
const listeners: Listener[] = [];
let realtimeUnsub: (() => void) | null = null;
let initToken = 0;

function rowToNotif(row: DbRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

function snapshot(): Notification[] {
  return [...cache].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function notify(): void {
  const snap = snapshot();
  listeners.forEach(fn => fn(snap));
}

async function refetchFor(userId: string, token: number): Promise<void> {
  // Limit to a reasonable window — notifications screen only shows recent.
  // 200 is plenty; older ones can be archived/cleaned via clearAll().
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (token !== initToken || currentUserId !== userId) return;
  if (error) {
    console.warn('[notifications] refetch failed', error.message);
    return;
  }
  cache = (data as DbRow[] | null ?? []).map(rowToNotif);
  notify();
}

// ── Lifecycle (called from AuthContext) ──────────────────────────────

export async function initNotificationsForUser(userId: string): Promise<void> {
  teardownNotifications();
  currentUserId = userId;
  const token = ++initToken;

  await refetchFor(userId, token);
  if (token !== initToken) return;

  const channel = supabase
    .channel(`notif-${userId}-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => { refetchFor(userId, token); },
    )
    .subscribe();
  realtimeUnsub = () => { supabase.removeChannel(channel); };
}

export function teardownNotifications(): void {
  ++initToken;
  if (realtimeUnsub) realtimeUnsub();
  realtimeUnsub = null;
  currentUserId = null;
  cache = [];
  notify();
}

// ── Reads (synchronous — read from cache) ────────────────────────────

export function getNotifications(): Notification[] {
  return snapshot();
}

export function getUnreadCount(): number {
  return cache.filter(n => !n.read).length;
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ── Mutations ────────────────────────────────────────────────────────

export async function addNotification(
  data: Omit<Notification, 'id' | 'read' | 'createdAt'>,
): Promise<Notification | null> {
  if (!currentUserId) {
    // Service called before init (e.g. during signup before auth state propagates).
    // Drop quietly so we don't crash the calling screen.
    return null;
  }
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: currentUserId,
      type: data.type,
      title: data.title,
      body: data.body,
    })
    .select('id, user_id, type, title, body, read, created_at')
    .single();
  if (error) {
    console.warn('[notifications] add failed', error.message);
    return null;
  }
  const created = rowToNotif(row as DbRow);
  // Optimistic local insert so callers that don't await still see it on a
  // realtime-disabled DB. Realtime will dedupe via the same id.
  if (!cache.find(n => n.id === created.id)) {
    cache = [created, ...cache];
    notify();
  }
  return created;
}

export async function markRead(id: string): Promise<void> {
  if (!currentUserId) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) {
    console.warn('[notifications] markRead failed', error.message);
    return;
  }
  cache = cache.map(n => (n.id === id ? { ...n, read: true } : n));
  notify();
}

export async function markAllRead(): Promise<void> {
  if (!currentUserId) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', currentUserId)
    .eq('read', false);
  if (error) {
    console.warn('[notifications] markAllRead failed', error.message);
    return;
  }
  cache = cache.map(n => ({ ...n, read: true }));
  notify();
}

export async function clearAll(): Promise<void> {
  if (!currentUserId) return;
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', currentUserId);
  if (error) {
    console.warn('[notifications] clearAll failed', error.message);
    return;
  }
  cache = [];
  notify();
}
