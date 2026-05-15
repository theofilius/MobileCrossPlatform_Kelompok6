// Emergency contacts service — in-memory store, ready for Supabase swap

export type ContactPriority = 'primary' | 'secondary';

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: ContactPriority;
};

type Listener = (contacts: EmergencyContact[]) => void;

const store: EmergencyContact[] = [];
const listeners: Listener[] = [];

function snapshot(): EmergencyContact[] {
  return [...store].sort((a, b) => {
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (b.priority === 'primary' && a.priority !== 'primary') return 1;
    return a.name.localeCompare(b.name);
  });
}

function notify(): void {
  const snap = snapshot();
  listeners.forEach(fn => fn(snap));
}

export function getContacts(): EmergencyContact[] {
  // TODO: const { data } = await supabase.from('emergency_contacts').select('*').eq('user_id', uid);
  return snapshot();
}

export function getContactCount(): number {
  return store.length;
}

export function getPrimaryContact(): EmergencyContact | undefined {
  return store.find(c => c.priority === 'primary');
}

export function addContact(data: Omit<EmergencyContact, 'id'>): EmergencyContact {
  // TODO: const { data: row } = await supabase.from('emergency_contacts').insert(data).select().single();
  // If new contact is primary, demote existing primary
  if (data.priority === 'primary') {
    store.forEach(c => { if (c.priority === 'primary') c.priority = 'secondary'; });
  }
  const c: EmergencyContact = { ...data, id: Date.now().toString() };
  store.push(c);
  notify();
  return c;
}

export function updateContact(id: string, data: Partial<Omit<EmergencyContact, 'id'>>): void {
  // TODO: await supabase.from('emergency_contacts').update(data).eq('id', id);
  const idx = store.findIndex(c => c.id === id);
  if (idx < 0) return;

  // If promoting to primary, demote others first
  if (data.priority === 'primary' && store[idx].priority !== 'primary') {
    store.forEach(c => { if (c.id !== id && c.priority === 'primary') c.priority = 'secondary'; });
  }

  store[idx] = { ...store[idx], ...data };
  notify();
}

export function deleteContact(id: string): void {
  // TODO: await supabase.from('emergency_contacts').delete().eq('id', id);
  const idx = store.findIndex(c => c.id === id);
  if (idx < 0) return;
  store.splice(idx, 1);
  notify();
}

export function deleteAllContacts(): void {
  // TODO: await supabase.from('emergency_contacts').delete().eq('user_id', uid);
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
