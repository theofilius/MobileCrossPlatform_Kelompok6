// Polyfill global.crypto.getRandomValues for the PKCE code_verifier.
// Must be imported BEFORE @supabase/supabase-js. Without this, Supabase
// would warn "WebCrypto API is not supported" and fall back to a weak source.
import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Add them to .env at the project root, then restart Expo with `npx expo start -c`.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl is for browser apps; in RN we manually exchange
    // the OAuth `?code=` we receive on the deep-link redirect.
    detectSessionInUrl: false,
    // PKCE is mandatory for OAuth flows in native apps — the server returns
    // a one-time `code` we exchange via exchangeCodeForSession.
    // Do NOT change this to 'implicit' — services/oauthService.ts depends on
    // PKCE (parses `code` from redirect and calls exchangeCodeForSession).
    // Switching to implicit returns tokens in the URL hash instead, which
    // also breaks session signOut and causes "tiba-tiba login" + "gabisa
    // keluar" issues.
    flowType: 'pkce',
  },
});
