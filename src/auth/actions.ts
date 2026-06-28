// =============================================================================
// auth/actions — Sign-in / sign-up / sign-out against Supabase
// =============================================================================
// Thin async wrappers that return `{ error }` instead of throwing, so screens
// can render inline errors. The auth-state listener in useAuth.ts handles the
// session side effects (mirroring into settings, kicking sync); these functions
// just perform the calls.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

import { requireSupabase } from './client';

WebBrowser.maybeCompleteAuthSession();

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

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'plately', path: 'auth-callback' });
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) return { error: error?.message ?? 'Google sign-in failed.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return { error: null }; // user cancelled

    const url = result.url;
    const query = Object.fromEntries(new URLSearchParams(url.includes('?') ? (url.split('?')[1] ?? '').split('#')[0] : ''));

    // PKCE flow (supabase-js default): redirect carries an authorization code.
    if (query['code']) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(query['code']);
      return { error: codeError ? codeError.message : null };
    }

    // Implicit-flow fallback: tokens come back in the URL fragment.
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    const params = Object.fromEntries(new URLSearchParams(fragment));
    const accessToken = params['access_token'];
    const refreshToken = params['refresh_token'];
    if (!accessToken || !refreshToken) return { error: 'Google sign-in did not return tokens.' };

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { error: sessionError ? sessionError.message : null };
  } catch (err) {
    return { error: message(err, 'Google sign-in failed.') };
  }
}

/**
 * Permanently delete the signed-in user's account and all cloud data via the
 * `delete-account` Edge Function (service-role). `functions.invoke` attaches the
 * current session's JWT, which the function verifies before deleting. On success
 * we sign out locally so the dead session is cleared.
 */
export async function deleteAccount(): Promise<AuthResult> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke<{ error?: string }>('delete-account', {
      method: 'POST',
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    await supabase.auth.signOut();
    return { error: null };
  } catch (err) {
    return { error: message(err, 'Could not delete your account.') };
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
