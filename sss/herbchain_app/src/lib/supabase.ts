import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * These values are inlined into the shipped bundle, so the anon key is public by
 * definition. Every table this client touches must therefore be protected by RLS
 * — the key alone grants no authority beyond what policies allow.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and restart the dev server with --clear.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Expo Router static rendering evaluates every route in Node to prerender HTML,
 * and there is no `window` there. AsyncStorage reaches for `window.localStorage`
 * on web, so handing it to the client at module scope crashes the SSR pass.
 *
 * `window` is defined in React Native, so native still gets real AsyncStorage —
 * only the server pass falls back to this inert store, where there is no session
 * to persist anyway.
 */
const isBrowserOrNative = typeof window !== 'undefined';

const memoryStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: isBrowserOrNative ? AsyncStorage : memoryStorage,
    autoRefreshToken: isBrowserOrNative,
    persistSession: isBrowserOrNative,
    // No URL bar to parse a session out of in React Native.
    detectSessionInUrl: false,
  },
});
