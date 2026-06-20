// =============================================================================
// auth/useAuth — Auth session listener + hook
// =============================================================================
// `initAuthListener()` is called once from App.tsx. It subscribes to Supabase
// auth changes and:
//   - mirrors the signed-in user into useSettings.account (drives UI),
//   - runs a cloud sync on sign-in,
//   - clears local sync cursors on sign-out (so the next account starts clean).
// `useAuth()` is the component-facing read hook.

import type { User } from '@supabase/supabase-js';

import { supabase } from './client';
import { useSettings, type AccountInfo } from '../state/useSettings';

function toAccount(user: User): AccountInfo {
  const provider = (user.app_metadata?.provider ?? 'email') as AccountInfo['provider'];
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);
  return {
    provider: provider === 'apple' || provider === 'google' || provider === 'email' ? provider : 'email',
    email: user.email ?? undefined,
    name,
  };
}

let initialized = false;

/** Subscribe to Supabase auth changes. Safe to call once; no-op without config. */
export function initAuthListener(): void {
  if (initialized || !supabase) return;
  initialized = true;

  // Adopt any session restored from storage on cold start.
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      useSettings.getState().setAccount(toAccount(data.session.user));
      void runSyncSafely();
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    const settings = useSettings.getState();
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) settings.setAccount(toAccount(session.user));
      if (event === 'SIGNED_IN') void runSyncSafely();
    } else if (event === 'SIGNED_OUT') {
      settings.setAccount(null);
      void resetSyncSafely();
    }
  });
}

// Sync lives in a sibling module; load it lazily to avoid an import cycle
// (sync -> db -> ... ) and to keep auth usable when sync isn't wired.
async function runSyncSafely(): Promise<void> {
  try {
    const mod = await import('../sync/engine');
    await mod.runSync();
  } catch {
    // Sync failures never block auth; they retry on the next trigger.
  }
}

async function resetSyncSafely(): Promise<void> {
  try {
    const mod = await import('../sync/engine');
    await mod.resetSyncState();
  } catch {
    // ignore
  }
}

/** Read the current account from settings. `signedIn` excludes guest mode. */
export function useAuth(): { account: AccountInfo | null; signedIn: boolean } {
  const account = useSettings((s) => s.account);
  const signedIn = !!account && account.provider !== 'guest';
  return { account, signedIn };
}
