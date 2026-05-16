// Auth service — thin wrapper around Supabase Auth.
// Note: Most app code uses AuthContext (app/context/AuthContext.tsx) directly.
// This module exists as a convenience layer for non-React callers
// (e.g. one-off scripts or future migrations).

import { supabase } from './supabase';

export type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

/** Create a new account in Supabase Auth. Throws on failure. */
export async function signUp(data: SignUpData): Promise<AuthUser> {
  const { data: res, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      // handle_new_user() trigger reads from raw_user_meta_data to populate profiles
      data: { name: data.name.trim(), phone: data.phone.trim() },
    },
  });
  if (error) throw error;
  if (!res.user) throw new Error('Sign up succeeded but no user returned.');
  return {
    id: res.user.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
  };
}

/** Sign in with email + password. Throws on failure (incl. unknown account). */
export async function signIn(data: SignInData): Promise<AuthUser> {
  const { data: res, error } = await supabase.auth.signInWithPassword({
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });
  if (error) throw error;
  if (!res.user) throw new Error('No user in session.');

  // Pull display fields from profiles (may be null on first sign-in race)
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', res.user.id)
    .maybeSingle();

  return {
    id: res.user.id,
    name: profile?.name ?? (res.user.email?.split('@')[0] ?? 'User'),
    email: res.user.email ?? data.email,
    phone: profile?.phone ?? '',
  };
}

/** Sign out and clear the local session. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Returns the currently authenticated user, or null if not signed in. */
export async function getSession(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    id: session.user.id,
    name: profile?.name ?? (session.user.email?.split('@')[0] ?? 'User'),
    email: session.user.email ?? '',
    phone: profile?.phone ?? '',
  };
}
