const mockSecureStore = new Map<string, string>();
const mockAsyncStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => mockSecureStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void mockSecureStore.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void mockSecureStore.delete(k)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => mockAsyncStore.get(k) ?? null),
  setItem: jest.fn(async (k: string, v: string) => void mockAsyncStore.set(k, v)),
  removeItem: jest.fn(async (k: string) => void mockAsyncStore.delete(k)),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) % 256)),
}));

import { LargeSecureStore } from '../secureStorage';

describe('LargeSecureStore', () => {
  beforeEach(() => {
    mockSecureStore.clear();
    mockAsyncStore.clear();
  });

  it('round-trips a value', async () => {
    const store = new LargeSecureStore();
    const session = JSON.stringify({ access_token: 'a'.repeat(1200), refresh_token: 'r'.repeat(64) });
    await store.setItem('sb-test-auth-token', session);
    await expect(store.getItem('sb-test-auth-token')).resolves.toBe(session);
  });

  it('does not store plaintext in AsyncStorage', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'super-secret-session');
    expect(mockAsyncStore.get('k')).toBeDefined();
    expect(mockAsyncStore.get('k')).not.toContain('super-secret-session');
  });

  it('returns null for a missing key', async () => {
    const store = new LargeSecureStore();
    await expect(store.getItem('missing')).resolves.toBeNull();
  });

  it('returns null when the encryption key is gone', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'value');
    mockSecureStore.clear();
    await expect(store.getItem('k')).resolves.toBeNull();
  });

  it('removeItem clears both stores', async () => {
    const store = new LargeSecureStore();
    await store.setItem('k', 'value');
    await store.removeItem('k');
    expect(mockAsyncStore.has('k')).toBe(false);
    expect(mockSecureStore.size).toBe(0);
  });
});
