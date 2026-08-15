import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'ayurtrace_auth_token';
const REFRESH_TOKEN_KEY = 'ayurtrace_refresh_token';

// expo-secure-store (hardware-backed keychain/keystore) has no web
// implementation, so web falls back to AsyncStorage — the same tradeoff
// lib/supabase.ts already makes for its own session storage.
const isNative = Platform.OS !== 'web';

export const authStorage = {
  async getToken(): Promise<string | null> {
    return isNative ? SecureStore.getItemAsync(TOKEN_KEY) : AsyncStorage.getItem(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return isNative ? SecureStore.getItemAsync(REFRESH_TOKEN_KEY) : AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(token: string, refreshToken: string): Promise<void> {
    if (isNative) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async clear(): Promise<void> {
    if (isNative) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
