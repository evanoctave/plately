// =============================================================================
// auth/client — Supabase client singleton
// =============================================================================
// Creates the one Supabase client the app shares. Sessions persist in
// AsyncStorage and auto-refresh. When Supabase isn't configured (no keys in
// .env), `supabase` is null and every caller falls back to local / guest mode.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '../config/env';

function build(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(env.supabaseUrl as string, env.supabaseAnonKey as string, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      flowType: 'pkce',
      // RN has no URL bar; OAuth redirects aren't parsed from the launch URL.
      detectSessionInUrl: false,
    },
  });
}

export const supabase: SupabaseClient | null = build();

/** Narrowing helper: throws if called when Supabase isn't configured. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL / SUPABASE_ANON_KEY.');
  }
  return supabase;
}
