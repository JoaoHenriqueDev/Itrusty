import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

// SecureStore usa Keychain (iOS) e Keystore (Android) — criptografado pelo SO.
// No web não está disponível, então cai para AsyncStorage.

export async function saveSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value)
  } else {
    await SecureStore.setItemAsync(key, value)
  }
}

export async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

export async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key)
  } else {
    await SecureStore.deleteItemAsync(key)
  }
}
