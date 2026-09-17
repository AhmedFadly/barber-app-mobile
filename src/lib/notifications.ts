import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";
import { storage } from "./storage";
import type { Appointment } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Asks for permission and registers this device's Expo push token with the backend.
 * Remote push needs a physical device and an EAS project id (set after `eas init`); without them
 * we silently skip — local appointment reminders still work.
 */
export async function registerForPush() {
  if (Platform.OS === "web" || !Device.isDevice) return;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Appointments & news", importance: Notifications.AndroidImportance.HIGH });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerPushToken(token, Platform.OS);
  } catch (e) {
    console.warn("Push registration skipped:", (e as Error).message);
  }
}

const reminderKey = (appointmentId: string) => `regent.reminder.${appointmentId}`;

/** On-device reminder 2 hours before the appointment (replaces any earlier one for the same booking). */
export async function scheduleReminder(a: Appointment) {
  if (Platform.OS === "web") return;
  try {
    await cancelReminder(a.id);
    const at = new Date(a.startsAt).getTime() - 2 * 3600_000;
    if (at <= Date.now()) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && (await Notifications.requestPermissionsAsync()).status !== "granted") return;
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: "See you soon ✂️", body: `${a.items.map((i) => i.name).join(" + ")} with ${a.barber.name} at ${a.branch.name} in 2 hours.`, data: { appointmentId: a.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
    await storage.set(reminderKey(a.id), id);
  } catch (e) {
    console.warn("Reminder not scheduled:", (e as Error).message);
  }
}

export async function cancelReminder(appointmentId: string) {
  if (Platform.OS === "web") return;
  const id = await storage.get(reminderKey(appointmentId));
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await storage.remove(reminderKey(appointmentId));
  }
}
