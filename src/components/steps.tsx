import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

import { Text } from "./text";

export const BOOKING_STEPS = ["Location", "Services", "Barber", "Time", "Confirm"] as const;

export function Steps({ current }: { current: number }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.bars}>
        {BOOKING_STEPS.map((s, i) => (
          <View key={s} style={[styles.bar, i <= current && { backgroundColor: colors.gold }]} />
        ))}
      </View>
      <Text variant="small">
        Step {current + 1} of {BOOKING_STEPS.length} · {BOOKING_STEPS[current]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line },
});
