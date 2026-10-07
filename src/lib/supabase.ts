// Installs the SQLite-backed `localStorage` global that supabase-js uses to
// keep the session on the device. Must run before `createClient`.
import 'expo-sqlite/localStorage/install';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * The Supabase client, or `null` when the env vars are not set. Without them
 * the app runs local-only (no sign-in, no sync), so it stays usable before
 * the Supabase project exists. See `.env.example`.
 *
 * The publishable key is meant to ship inside the app: the data is protected
 * by row level security on the server (see `supabase/schema.sql`), not by
 * keeping this key secret.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (supabase) {
  // Only refresh the session while the app is in the foreground, as the
  // supabase-js docs recommend for React Native.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
