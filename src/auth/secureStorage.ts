// =============================================================================
// auth/secureStorage — encrypted storage adapter for the Supabase session
// =============================================================================
// SecureStore (Keychain) caps values at 2048 bytes; a Supabase session is
// larger. So: AES-256-CTR encrypt the value into AsyncStorage and keep the
// random per-key AES key in SecureStore. Losing the Keychain entry just means
// the session fails to decrypt and the user signs in again.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import aesjs from 'aes-js';

// SecureStore keys must be alphanumeric plus "._-"; Supabase keys qualify
// (e.g. "sb-<ref>-auth-token") but sanitize defensively.
function keychainKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    const encryptedHex = await AsyncStorage.getItem(key);
    if (!encryptedHex) return null;
    const keyHex = await SecureStore.getItemAsync(keychainKey(key));
    if (!keyHex) return null;
    try {
      const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(keyHex), new aesjs.Counter(1));
      return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encryptedHex)));
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(keychainKey(key), aesjs.utils.hex.fromBytes(encryptionKey));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(keychainKey(key));
  }
}
