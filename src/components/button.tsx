import * as Haptics from "expo-haptics";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fonts, radius } from "@/constants/theme";

import { Text } from "./text";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style, compact }: Props) {
  const inactive = disabled || loading;
  const fg = variant === "primary" ? colors.onGold : variant === "danger" ? colors.danger : variant === "secondary" ? colors.text : colors.gold;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={() => {
        if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.dangerStyle,
        variant === "ghost" && styles.ghost,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={compact ? 16 : 18} color={fg} />}
          <Text style={[styles.label, compact && styles.labelCompact, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 54, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  compact: { minHeight: 40, paddingHorizontal: 16 },
  primary: { backgroundColor: colors.gold },
  secondary: { backgroundColor: colors.elevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  dangerStyle: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(224,112,106,0.4)" },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 0.3 },
  labelCompact: { fontSize: 13.5 },
});
