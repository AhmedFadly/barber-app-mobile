import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, radius, space } from "@/constants/theme";
import { aed, duration } from "@/lib/format";
import type { Service } from "@/lib/types";

import { Text } from "./text";

type Props = { service: Service; onPress?: () => void; selected?: boolean; selectable?: boolean };

export function ServiceRow({ service, onPress, selected, selectable }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, selected && styles.selected, pressed && { opacity: 0.85 }]}>
      <Image source={service.imageUrl} style={styles.thumb} contentFit="cover" transition={200} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {service.name}
          </Text>
          {service.popular ? <Ionicons name="star" size={11} color={colors.gold} /> : null}
        </View>
        <Text variant="small" numberOfLines={2}>
          {service.description}
        </Text>
        <View style={{ flexDirection: "row", gap: space.md, marginTop: 2 }}>
          <Text variant="price">{aed(service.priceFils)}</Text>
          <Text variant="small">· {duration(service.durationMin)}</Text>
        </View>
      </View>
      {selectable ? (
        <View style={[styles.check, selected && styles.checkOn]}>{selected ? <Ionicons name="checkmark" size={16} color={colors.onGold} /> : <Ionicons name="add" size={18} color={colors.gold} />}</View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  selected: { borderColor: colors.gold, backgroundColor: "#1B1710" },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.elevated },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.goldDeep, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.gold, borderColor: colors.gold },
});
