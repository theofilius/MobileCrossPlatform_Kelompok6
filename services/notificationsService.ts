// Notifications service — in-memory store, ready for Supabase swap

export type NotifType = 'sos' | 'call' | 'contact' | 'security' | 'permission';

export type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
};

type Listener = (items: Notification[]) => void;

// Starts empty. Notifications accumulate from real app events (SOS triggered,
// permission prompts, security warnings, etc.). Phase 6 will migrate this
// to the Supabase `notifications` table that already exists in schema.
const store: Notification[] = [];

const listeners: Listener[] = [];

function notify(): void {
  const snap = [...store];
  listeners.forEach(fn => fn(snap));
}

export function getNotifications(): Notification[] {
  return [...store].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(): number {
  return store.filter(n => !n.read).length;
}

export function addNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
  const n: Notification = {
    ...data,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    read: false,
    createdAt: new Date(),
  };
  store.unshift(n);
  notify();
  return n;
}

export function markRead(id: string): void {
  const item = store.find(n => n.id === id);
  if (item && !item.read) {
    item.read = true;
    notify();
  }
}

export function markAllRead(): void {
  let changed = false;
  store.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
  if (changed) notify();
}

export function clearAll(): void {
  store.length = 0;
  notify();
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
