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

const store: Notification[] = [
  {
    id: 'seed-1',
    type: 'permission',
    title: 'Izinkan akses lokasi',
    body: 'Lokasi membantu tim respons cepat menemukan kamu saat darurat.',
    read: false,
    createdAt: new Date(Date.now() - 600000),
  },
  {
    id: 'seed-2',
    type: 'security',
    title: 'Login dari perangkat baru',
    body: 'Akun kamu diakses dari iPhone, sekitar 20 menit lalu.',
    read: false,
    createdAt: new Date(Date.now() - 1200000),
  },
  {
    id: 'seed-3',
    type: 'permission',
    title: 'Izin notifikasi belum aktif',
    body: 'Aktifkan notifikasi agar tidak melewatkan info darurat.',
    read: true,
    createdAt: new Date(Date.now() - 3600000),
  },
];

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
