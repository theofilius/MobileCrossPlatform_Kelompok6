import { Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { initContactsForUser, teardownContacts } from '@/services/contactsService';
import { initNotificationsForUser, teardownNotifications } from '@/services/notificationsService';

export type UserRole = 'user' | 'petugas' | 'admin';

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUri?: string;
  role: UserRole;
  // Komunitas Siaga: opt-in to receive nearby SOS alerts. Stored as
  // profiles.community_siaga_opt_in (added in Phase 1 migration).
  communitySiagaOptIn: boolean;
};

export type AuthOpResult = { ok: true } | { ok: false; error: string };
export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  // Login: email + password (signInWithPassword).
  signIn: (email: string, password: string) => Promise<AuthOpResult>;
  // Signup: creates an unconfirmed user; Supabase emails a 6-digit OTP.
  signUp: (params: { email: string; password: string; name: string; phone: string }) => Promise<SignUpResult>;
  // Verify the OTP from the signup email.
  verifyEmailOtp: (email: string, token: string) => Promise<AuthOpResult>;
  // Resend the signup OTP (used on the OTP screen).
  resendSignupOtp: (email: string) => Promise<AuthOpResult>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
};

const GENERIC_AUTH_ERROR = 'Email atau kata sandi salah, atau akun belum terdaftar.';

// Wrap any auth promise with a hard timeout so a stuck network call never
// leaves the UI hanging on a spinner.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout setelah ${ms / 1000}s`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  signUp: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  verifyEmailOtp: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  resendSignupOtp: async () => ({ ok: false, error: GENERIC_AUTH_ERROR }),
  signOut: async () => {},
  updateUser: async () => {},
});

async function fetchProfile(userId: string): Promise<Partial<User>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, email, phone, photo_uri, role, community_siaga_opt_in')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return {};
  const rawRole = (data as { role?: string }).role;
  const role: UserRole = rawRole === 'petugas' || rawRole === 'admin' ? rawRole : 'user';

  return {
    name: data.name,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    photoUri: data.photo_uri ?? undefined,
    role,
    communitySiagaOptIn: (data as { community_siaga_opt_in?: boolean }).community_siaga_opt_in ?? false,
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
    communitySiagaOptIn: profile.communitySiagaOptIn ?? false,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
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
        if (existing) setUser(buildUser(existing, {}));
      } catch (err: any) {
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
        // Boot per-user data services (cache + realtime) once we know the user.
        initContactsForUser(existing.user.id).catch((e) =>
          console.warn('[auth] initContactsForUser failed:', e?.message ?? e),
        );
        initNotificationsForUser(existing.user.id).catch((e) =>
          console.warn('[auth] initNotificationsForUser failed:', e?.message ?? e),
        );
      } catch (err: any) {
        console.warn('[auth] fetchProfile failed:', err?.message ?? err);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession);
        if (newSession) {
          setUser(buildUser(newSession, {}));
          const profile = await fetchProfile(newSession.user.id);
          setUser(buildUser(newSession, profile));
          initContactsForUser(newSession.user.id).catch((e) =>
            console.warn('[auth] initContactsForUser failed:', e?.message ?? e),
          );
          initNotificationsForUser(newSession.user.id).catch((e) =>
            console.warn('[auth] initNotificationsForUser failed:', e?.message ?? e),
          );
        } else {
          setUser(null);
          teardownContacts();
          teardownNotifications();
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

  const signIn = async (email: string, password: string): Promise<AuthOpResult> => {
    try {
      console.log('[auth] signIn start:', email);
      const startedAt = Date.now();
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
        15000,
        'signIn',
      );
      console.log('[auth] signIn done in', Date.now() - startedAt, 'ms');
      if (error) {
        console.warn('[auth] signIn error:', error.message);
        const msg = error.message.toLowerCase();
        if (msg.includes('not confirmed') || msg.includes('email not')) {
          return { ok: false, error: 'Email belum diverifikasi. Cek kotak masuk untuk kode verifikasi.' };
        }
        return { ok: false, error: GENERIC_AUTH_ERROR };
      }
      return { ok: true };
    } catch (e: any) {
      console.warn('[auth] signIn threw:', e?.message ?? e);
      return { ok: false, error: e?.message?.includes('timeout')
        ? 'Server tidak merespons. Cek koneksi internet atau coba lagi.'
        : GENERIC_AUTH_ERROR };
    }
  };

  const signUp = async ({
    email,
    password,
    name,
    phone,
  }: { email: string; password: string; name: string; phone: string }): Promise<SignUpResult> => {
    try {
      console.log('[auth] signUp start:', email);
      const startedAt = Date.now();
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { name: name.trim(), phone: phone.trim() },
          },
        }),
        15000,
        'signUp',
      );
      console.log('[auth] signUp done in', Date.now() - startedAt, 'ms; hasSession=', !!data?.session);

      if (error) {
        console.warn('[auth] signUp error:', error.message);
        const msg = error.message.toLowerCase();
        if (msg.includes('already')) {
          return { ok: false, error: 'Email sudah terdaftar. Silakan masuk dengan akun yang ada.' };
        }
        if (msg.includes('password')) {
          return { ok: false, error: 'Kata sandi tidak memenuhi syarat. Minimal 6 karakter.' };
        }
        if (msg.includes('rate') || msg.includes('email rate')) {
          return { ok: false, error: 'Rate limit email Supabase tercapai. Tunggu ~1 jam atau setup custom SMTP.' };
        }
        return { ok: false, error: `Pendaftaran gagal: ${error.message}` };
      }
      return { ok: true, needsEmailConfirmation: !data.session };
    } catch (e: any) {
      console.warn('[auth] signUp threw:', e?.message ?? e);
      return { ok: false, error: e?.message?.includes('timeout')
        ? 'Server tidak merespons. Cek koneksi internet atau coba lagi.'
        : 'Pendaftaran gagal. Coba lagi.' };
    }
  };

  const verifyEmailOtp = async (rawEmail: string, token: string): Promise<AuthOpResult> => {
    const email = rawEmail.trim().toLowerCase();
    try {
      console.log('[auth] verifyOtp start');
      const startedAt = Date.now();
      const { data, error } = await withTimeout(
        supabase.auth.verifyOtp({ email, token, type: 'email' }),
        15000,
        'verifyOtp',
      );
      console.log('[auth] verifyOtp done in', Date.now() - startedAt, 'ms');
      if (error || !data.session || !data.user) {
        console.warn('[auth] verifyEmailOtp error:', error?.message);
        return { ok: false, error: 'Kode OTP salah atau sudah kedaluwarsa.' };
      }
      return { ok: true };
    } catch (e: any) {
      console.warn('[auth] verifyOtp threw:', e?.message ?? e);
      return { ok: false, error: e?.message?.includes('timeout')
        ? 'Server tidak merespons. Cek koneksi internet atau coba lagi.'
        : 'Verifikasi gagal. Coba lagi.' };
    }
  };

  const resendSignupOtp = async (rawEmail: string): Promise<AuthOpResult> => {
    const email = rawEmail.trim().toLowerCase();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      console.warn('[auth] resendSignupOtp error:', error.message);
      const msg = error.message.toLowerCase();
      if (msg.includes('rate')) return { ok: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' };
      return { ok: false, error: 'Gagal mengirim ulang kode.' };
    }
    return { ok: true };
  };

  const signOut = async (): Promise<void> => {
    // Always force the local session to null, even if the server call fails
    // (network down, token already invalid, flowType mismatch, etc.).
    // Without this, a silent server error would leave the user "logged in"
    // locally because onAuthStateChange wouldn't fire.
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[auth] signOut server error:', error.message);
      }
    } catch (err: any) {
      console.warn('[auth] signOut threw:', err?.message ?? err);
    } finally {
      // Defensive: clear local state + tear down per-user services regardless
      // of whether the server confirmed the logout. AuthGate will route to
      // /login the moment user becomes null.
      setSession(null);
      setUser(null);
      teardownContacts();
      teardownNotifications();
    }
  };

  const updateUser = async (data: Partial<Omit<User, 'id'>>): Promise<void> => {
    if (!session) return;
    const patch: Record<string, any> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.photoUri !== undefined) patch.photo_uri = data.photoUri;
    if (data.communitySiagaOptIn !== undefined) patch.community_siaga_opt_in = data.communitySiagaOptIn;
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
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        verifyEmailOtp,
        resendSignupOtp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
