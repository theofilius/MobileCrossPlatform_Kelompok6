// Real Google OAuth via Supabase + the system browser.
//
// Flow:
//   1. Ask Supabase for the provider URL (PKCE — Supabase will return a `code`
//      on the redirect, which we exchange for a session).
//   2. Open that URL in the OS web-auth modal (SFAuthenticationSession on iOS,
//      Custom Tabs on Android) via WebBrowser.openAuthSessionAsync.
//   3. When the user finishes consent, the browser redirects to
//      `mcpkelompok6://auth-callback?code=...`.
//   4. We pull the `code` out of the redirect URL and exchange it for a session.
//
// No client-side secrets, no native Google SDK, no app-store entitlements.

import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Required for Android — closes the auth modal once we resolve.
WebBrowser.maybeCompleteAuthSession();

export type OAuthResult =
  | { ok: true }
  | { ok: false; error: string; canceled?: boolean };

function getRedirectUri(): string {
  // `path: 'auth-callback'` produces `mcpkelompok6://auth-callback` (matches app.json scheme).
  return makeRedirectUri({ scheme: 'mcpkelompok6', path: 'auth-callback' });
}

export async function signInWithGoogle(): Promise<OAuthResult> {
  const redirectTo = getRedirectUri();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Don't let Supabase try to navigate the (non-existent) window —
        // we drive the browser ourselves.
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      return { ok: false, error: error?.message ?? 'Tidak bisa memulai login Google.' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, error: 'Login Google dibatalkan.', canceled: true };
    }
    if (result.type !== 'success' || !result.url) {
      return { ok: false, error: 'Login Google gagal.' };
    }

    // Parse the deep link: mcpkelompok6://auth-callback?code=xxx
    const { queryParams } = Linking.parse(result.url);
    const code = (queryParams?.code ?? '') as string;
    if (!code) {
      // Some flows return tokens directly in the hash; we don't support that here
      // because flowType is forced to pkce. If you ever see this in dev, the
      // OAuth provider isn't returning a code — check the Supabase project
      // OAuth settings.
      return { ok: false, error: 'Respon OAuth tidak valid (code kosong).' };
    }

    const exchange = await supabase.auth.exchangeCodeForSession(code);
    if (exchange.error || !exchange.data.session) {
      return { ok: false, error: exchange.error?.message ?? 'Tidak bisa membuat session.' };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Login Google gagal.' };
  }
}
