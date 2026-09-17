import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fonts, radius, space } from "@/constants/theme";
import { dateKeyParts, dateKeyOf, time12 } from "@/lib/format";
import type { Appointment } from "@/lib/types";

import { Text } from "./text";
import { StatusBadge } from "./ui";

export function AppointmentCard({ appointment: a, onPress, highlight }: { appointment: Appointment; onPress?: () => void; highlight?: boolean }) {
  const d = dateKeyParts(dateKeyOf(a.startsAt));
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, highlight && styles.highlight, pressed && { opacity: 0.85 }]}>
      <View style={[styles.date, highlight && { backgroundColor: colors.gold }]}>
        <Text style={[styles.dateWeekday, highlight && { color: colors.onGold }]}>{d.weekday.toUpperCase()}</Text>
        <Text style={[styles.dateDay, highlight && { color: colors.onGold }]}>{d.day}</Text>
        <Text style={[styles.dateWeekday, highlight && { color: colors.onGold }]}>{d.month.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="subheading" numberOfLines={1}>
          {a.items.map((i) => i.name).join(" + ")}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={13} color={colors.muted} />
          <Text variant="small">{time12(a.startsAt)}</Text>
          <Ionicons name="location-outline" size={13} color={colors.muted} style={{ marginLeft: 6 }} />
          <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
            {a.branch.name}
          </Text>
        </View>
        <View style={[styles.meta, { marginTop: 4, justifyContent: "space-between" }]}>
          <View style={styles.meta}>
            <Image source={a.barber.photoUrl} style={styles.barber} />
            <Text variant="small" style={{ color: colors.text }}>
              {a.barber.name.split(" ")[0]}
            </Text>
          </View>
          <StatusBadge status={a.status} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  highlight: { borderColor: colors.goldDeep, backgroundColor: "#17140F" },
  date: { width: 64, borderRadius: radius.md, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", paddingVertical: space.sm },
  dateWeekday: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 1.2, color: colors.muted },
  dateDay: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, color: colors.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  barber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.elevated },
});
