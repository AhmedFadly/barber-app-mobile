import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// SecureStore (Keychain / Keystore) on devices; localStorage for the web preview.
export const storage = {
  get: async (key: string) => (Platform.OS === "web" ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key)),
  set: async (key: string, value: string) => (Platform.OS === "web" ? globalThis.localStorage?.setItem(key, value) : SecureStore.setItemAsync(key, value)),
  remove: async (key: string) => (Platform.OS === "web" ? globalThis.localStorage?.removeItem(key) : SecureStore.deleteItemAsync(key)),
};
