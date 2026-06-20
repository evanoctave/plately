// =============================================================================
// auth/actions — Sign-in / sign-up / sign-out against Supabase
// =============================================================================
// Thin async wrappers that return `{ error }` instead of throwing, so screens
// can render inline errors. The auth-state listener in useAuth.ts handles the
// session side effects (mirroring into settings, kicking sync); these functions
// just perform the calls.

import * as AppleAuthentication from 'expo-apple-authentication';

import { requireSupabase } from './client';

export interface AuthResult {
  error: string | null;
}

function message(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.signUp({ email: email.trim(), password });
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: message(err, 'Could not create your account.') };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: message(err, 'Could not sign you in.') };
  }
}

/**
 * Native Sign in with Apple → exchange the identity token for a Supabase
 * session. Returns `{ error: null }` if the user cancels (not an error to show).
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { error: 'Apple did not return an identity token.' };
    }
    const { error } = await requireSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    return { error: error ? error.message : null };
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_REQUEST_CANCELED') {
      return { error: null };
    }
    return { error: message(err, 'Apple sign-in failed.') };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await requireSupabase().auth.signOut();
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: message(err, 'Could not sign you out.') };
  }
}

/** Whether native Apple sign-in is even available on this device. */
export async function isAppleAuthAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
