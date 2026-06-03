// Emergency contacts — Supabase-backed (Phase 6 migration).
//
// Strategy:
//   - Local cache mirrors the user's emergency_contacts rows.
//   - Reads (getContacts, getContactCount, getPrimaryContact) return from
//     cache synchronously so existing callers don't need to be refactored.
//   - Mutations write to Supabase; the realtime subscription refetches and
//     updates the cache automatically.
//   - AuthContext is responsible for calling initContactsForUser() on login
//     and teardownContacts() on logout.

import { supabase } from './supabase';

export type ContactPriority = 'primary' | 'secondary';

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: ContactPriority;
};

type DbRow = {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: ContactPriority;
};

type Listener = (contacts: EmergencyContact[]) => void;

// ── Module state ─────────────────────────────────────────────────────
let currentUserId: string | null = null;
let cache: EmergencyContact[] = [];
const listeners: Listener[] = [];
let realtimeUnsub: (() => void) | null = null;
// Per-init token so an in-flight refetch from a previous user can be ignored
// after teardown / re-init (otherwise it would clobber cache on a different user).
let initToken = 0;

function rowToContact(row: DbRow): EmergencyContact {
  return {
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    priority: row.priority,
  };
}

function snapshot(): EmergencyContact[] {
  return [...cache].sort((a, b) => {
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (b.priority === 'primary' && a.priority !== 'primary') return 1;
    return a.name.localeCompare(b.name);
  });
}

function notify(): void {
  const snap = snapshot();
  listeners.forEach(fn => fn(snap));
}

async function refetchFor(userId: string, token: number): Promise<void> {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, user_id, name, relationship, phone, priority')
    .eq('user_id', userId);
  // If teardown / re-init happened during the request, drop this result.
  if (token !== initToken || currentUserId !== userId) return;
  if (error) {
    console.warn('[contacts] refetch failed', error.message);
    return;
  }
  cache = (data as DbRow[] | null ?? []).map(rowToContact);
  notify();
}

// ── Lifecycle (called from AuthContext) ──────────────────────────────

/** Load contacts for `userId` and subscribe to live changes. */
export async function initContactsForUser(userId: string): Promise<void> {
  teardownContacts();
  currentUserId = userId;
  const token = ++initToken;

  await refetchFor(userId, token);
  if (token !== initToken) return; // teardown raced us

  const channel = supabase
    .channel(`contacts-${userId}-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'emergency_contacts', filter: `user_id=eq.${userId}` },
      () => { refetchFor(userId, token); },
    )
    .subscribe();
  realtimeUnsub = () => { supabase.removeChannel(channel); };
}

/** Clear local state and stop realtime. Safe to call when not initialized. */
export function teardownContacts(): void {
  ++initToken;
  if (realtimeUnsub) realtimeUnsub();
  realtimeUnsub = null;
  currentUserId = null;
  cache = [];
  notify();
}

// ── Reads (synchronous — read from cache) ────────────────────────────

export function getContacts(): EmergencyContact[] {
  return snapshot();
}

export function getContactCount(): number {
  return cache.length;
}

export function getPrimaryContact(): EmergencyContact | undefined {
  return cache.find(c => c.priority === 'primary');
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ── Mutations (write to Supabase; realtime refetches cache) ──────────
// Note: the schema trigger `demote_other_primary_contacts` handles the
// "only one primary per user" rule server-side, so callers don't have to
// pre-clear other primaries.

export async function addContact(
  data: Omit<EmergencyContact, 'id'>,
): Promise<EmergencyContact | null> {
  if (!currentUserId) {
    console.warn('[contacts] addContact called before init');
    return null;
  }
  const { data: row, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: currentUserId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      priority: data.priority,
    })
    .select('id, user_id, name, relationship, phone, priority')
    .single();
  if (error) {
    console.warn('[contacts] add failed', error.message);
    return null;
  }
  // Optimistic local update; realtime will reconcile (and demote any prior
  // primary if needed) shortly after.
  const contact = rowToContact(row as DbRow);
  cache = [...cache.filter(c => c.id !== contact.id), contact];
  notify();
  return contact;
}

export async function updateContact(
  id: string,
  data: Partial<Omit<EmergencyContact, 'id'>>,
): Promise<void> {
  if (!currentUserId) return;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.relationship !== undefined) patch.relationship = data.relationship;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.priority !== undefined) patch.priority = data.priority;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from('emergency_contacts')
    .update(patch)
    .eq('id', id);
  if (error) {
    console.warn('[contacts] update failed', error.message);
    return;
  }
  // Optimistic — realtime will reconcile.
  cache = cache.map(c => (c.id === id ? { ...c, ...data } : c));
  notify();
}

export async function deleteContact(id: string): Promise<void> {
  if (!currentUserId) return;
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id);
  if (error) {
    console.warn('[contacts] delete failed', error.message);
    return;
  }
  cache = cache.filter(c => c.id !== id);
  notify();
}

export async function deleteAllContacts(): Promise<void> {
  if (!currentUserId) return;
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('user_id', currentUserId);
  if (error) {
    console.warn('[contacts] delete-all failed', error.message);
    return;
  }
  cache = [];
  notify();
}
