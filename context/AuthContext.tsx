import { Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export type UserRole = 'user' | 'petugas' | 'admin';

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUri?: string;
  role: UserRole;
};

export type SignInResult = { ok: true } | { ok: false; error: string };

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (params: { email: string; password: string; name: string; phone: string }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
};

// Generic error message — do NOT leak whether an email is registered
const GENERIC_AUTH_ERROR = 'Email atau kata sandi salah, atau akun belum terdaftar.';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  signUp: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  signOut: async () => {},
  updateUser: async () => {},
});

async function fetchProfile(userId: string): Promise<Partial<User>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, email, phone, photo_uri, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return {};
  // Guard the role value — anything outside the allowed set is treated as 'user'.
  const rawRole = (data as { role?: string }).role;
  const role: UserRole =
    rawRole === 'petugas' || rawRole === 'admin' ? rawRole : 'user';

  return {
    name: data.name,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    photoUri: data.photo_uri ?? undefined,
    role,
  };
}

function buildUser(session: Session, profile: Partial<User>): User {
  return {
    id: session.user.id,
    email: profile.email ?? session.user.email ?? undefined,
    name: profile.name ?? (session.user.email ? session.user.email.split('@')[0] : 'User'),
    phone: profile.phone,
    photoUri: profile.photoUri,
    role: profile.role ?? 'user',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session on app start + subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    // Watchdog: if anything blocks for too long (e.g. cold-start after iOS
    // killed the app while another app was foregrounded, slow AsyncStorage),
    // release the loading gate so the user isn't stuck on a spinner forever.
    const watchdog = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 1500);

    (async () => {
      let existing: Session | null = null;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        existing = data.session;
        if (!mounted) return;
        setSession(existing);

        if (existing) {
          // Seed user immediately from the session so AuthGate stops blocking
          // the UI behind a profiles network round-trip. Profile fields
          // (name, phone, role, photo) are filled in once fetchProfile resolves.
          setUser(buildUser(existing, {}));
        }
      } catch (err: any) {
        // Common case: stored refresh token is missing/expired/corrupted.
        // Supabase throws `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`.
        // Clear the broken state silently so AuthGate routes the user to /login.
        console.warn('[auth] session hydration failed:', err?.message ?? err);
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        if (mounted) {
          setSession(null);
          setUser(null);
        }
        existing = null;
      } finally {
        if (mounted) {
          clearTimeout(watchdog);
          setIsLoading(false);
        }
      }

      if (!existing) return;
      try {
        const profile = await fetchProfile(existing.user.id);
        if (!mounted) return;
        setUser(buildUser(existing, profile));
      } catch (err: any) {
        // Profile enrichment is non-critical; keep the session active.
        console.warn('[auth] fetchProfile failed:', err?.message ?? err);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);
        if (newSession) {
          // Seed first so role-based routing has something to work with.
          setUser(buildUser(newSession, {}));
          const profile = await fetchProfile(newSession.user.id);
          setUser(buildUser(newSession, profile));
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.warn('[auth] onAuthStateChange failed:', err?.message ?? err);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      console.warn('[auth] signIn error:', error.message);
      return { ok: false, error: GENERIC_AUTH_ERROR };
    }
    // onAuthStateChange will populate session + user
    return { ok: true };
  };

  const signUp = async ({
    email,
    password,
    name,
    phone,
  }: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // Stored as raw_user_meta_data — handle_new_user trigger reads from here
        data: { name: name.trim(), phone: phone.trim() },
      },
    });
    if (error) {
      console.warn('[auth] signUp error:', error.message, 'status:', error.status, 'code:', (error as any).code);
      // Surface specific common errors so UX isn't a black box,
      // but keep wording neutral about account existence.
      if (error.message.toLowerCase().includes('already')) {
        return { ok: false, error: 'Email tidak tersedia. Coba gunakan email lain atau masuk dengan akun yang ada.' };
      }
      if (error.message.toLowerCase().includes('password')) {
        return { ok: false, error: 'Kata sandi tidak memenuhi syarat. Minimal 6 karakter.' };
      }
      return { ok: false, error: `Pendaftaran gagal: ${error.message}` };
    }

    // If session is null → email confirmation is enabled in Supabase project settings.
    // User must verify via email before they can sign in.
    const needsEmailConfirmation = !data.session;
    return { ok: true, needsEmailConfirmation };
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear user + session
  };

  const updateUser = async (data: Partial<Omit<User, 'id'>>): Promise<void> => {
    if (!session) return;
    const patch: Record<string, any> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.photoUri !== undefined) patch.photo_uri = data.photoUri;

    if (Object.keys(patch).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', session.user.id);

    if (error) {
      console.warn('[auth] updateUser error:', error.message);
      return;
    }
    setUser(prev => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
