import { validateEmail, validatePassword, validateCredentials } from '../validation';

describe('validateEmail', () => {
  it('rejects an empty email', () => {
    expect(validateEmail('  ')?.field).toBe('email');
  });

  it('rejects a malformed email', () => {
    expect(validateEmail('not-an-email')?.field).toBe('email');
    expect(validateEmail('a@b')?.field).toBe('email');
  });

  it('accepts a well-formed email (trimming whitespace)', () => {
    expect(validateEmail('  user@example.com ')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('rejects an empty password in either mode', () => {
    expect(validatePassword('', 'signin')?.field).toBe('password');
    expect(validatePassword('', 'signup')?.field).toBe('password');
  });

  it('enforces an 8-char minimum only on sign-up', () => {
    expect(validatePassword('short', 'signup')?.field).toBe('password');
    expect(validatePassword('short', 'signin')).toBeNull();
  });

  it('accepts a long-enough password on sign-up', () => {
    expect(validatePassword('longenough', 'signup')).toBeNull();
  });
});

describe('validateCredentials', () => {
  it('surfaces the email error first', () => {
    expect(validateCredentials('bad', 'x', 'signup')?.field).toBe('email');
  });

  it('falls through to the password error when the email is valid', () => {
    expect(validateCredentials('user@example.com', 'x', 'signup')?.field).toBe('password');
  });

  it('returns null for a fully valid pair', () => {
    expect(validateCredentials('user@example.com', 'longenough', 'signup')).toBeNull();
  });
});
