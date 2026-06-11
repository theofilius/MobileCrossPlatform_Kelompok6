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
    // PKCE is the recommended flow for native apps. Even though we don't
    // currently expose any OAuth providers (Google OAuth was removed),
    // PKCE also affects how email/password sessions are issued. Switching
    // to 'implicit' has been known to break signOut and cause auto-login
    // glitches, so leave this alone.
    flowType: 'pkce',
  },
});
