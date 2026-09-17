import { Platform } from "react-native";

export function mapsUrl(b: { latitude: number; longitude: number; name: string }) {
  const q = `${b.latitude},${b.longitude}`;
  return Platform.OS === "ios" ? `maps://?q=REGENT%20${encodeURIComponent(b.name)}&ll=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export const telUrl = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
export const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
