// =============================================================================
// config/env — Runtime access to build-time secrets
// =============================================================================
// Secrets are injected into `expo.extra` by app.config.js (from .env) and read
// back here via expo-constants. Everything is optional: when a key is absent
// (the committed placeholder state), the matching integration disables itself
// and the app stays fully usable in local / guest mode.

import Constants from 'expo-constants';

interface Extra {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  revenueCatIosKey: string | null;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const env = {
  supabaseUrl: clean(extra.supabaseUrl),
  supabaseAnonKey: clean(extra.supabaseAnonKey),
  revenueCatIosKey: clean(extra.revenueCatIosKey),
};

/** True when both Supabase keys are present — auth + cloud sync are available. */
export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl !== null && env.supabaseAnonKey !== null;
}

/** True when the RevenueCat key is present — real IAP is available. */
export function isPurchasesConfigured(): boolean {
  return env.revenueCatIosKey !== null;
}
