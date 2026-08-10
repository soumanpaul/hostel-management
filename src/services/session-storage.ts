import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStorage = new Map<string, string>();

function canUseWebStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export async function getSessionItem(key: string) {
  if (Platform.OS === 'web') {
    return canUseWebStorage() ? window.localStorage.getItem(key) : (memoryStorage.get(key) ?? null);
  }

  const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  return isSecureStoreAvailable ? SecureStore.getItemAsync(key) : (memoryStorage.get(key) ?? null);
}

export async function setSessionItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (canUseWebStorage()) {
      window.localStorage.setItem(key, value);
    } else {
      memoryStorage.set(key, value);
    }
    return;
  }

  const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memoryStorage.set(key, value);
  }
}

export async function deleteSessionItem(key: string) {
  if (Platform.OS === 'web') {
    if (canUseWebStorage()) {
      window.localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
    return;
  }

  const isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  }
  memoryStorage.delete(key);
}
