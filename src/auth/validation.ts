// =============================================================================
// auth/validation — Pure email / password validation
// =============================================================================
// No React, no network — unit-tested. Used by AuthScreen to gate the submit
// button and surface inline errors before hitting Supabase.

export interface FieldError {
  field: 'email' | 'password';
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): FieldError | null {
  if (!email.trim()) return { field: 'email', message: 'Enter your email.' };
  if (!EMAIL_RE.test(email.trim())) return { field: 'email', message: 'Enter a valid email address.' };
  return null;
}

/** Sign-up rules: min 8 chars. Sign-in only checks non-empty (server is the gate). */
export function validatePassword(password: string, mode: 'signin' | 'signup'): FieldError | null {
  if (!password) return { field: 'password', message: 'Enter your password.' };
  if (mode === 'signup' && password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters.' };
  }
  return null;
}

/** First error for the email/password form, or null when valid. */
export function validateCredentials(
  email: string,
  password: string,
  mode: 'signin' | 'signup',
): FieldError | null {
  return validateEmail(email) ?? validatePassword(password, mode);
}
