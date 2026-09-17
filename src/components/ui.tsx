import { Image } from "expo-image";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fonts, radius, space } from "@/constants/theme";
import type { AppointmentStatus } from "@/lib/types";

import { Button } from "./button";
import { Text } from "./text";

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="heading">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text variant="small" style={{ color: colors.gold }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.onGold : colors.muted} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.onGold }]}>{label}</Text>
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

export function Avatar({ uri, size = 48, name }: { uri?: string | null; size?: number; name?: string }) {
  if (!uri)
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name={name ? "person" : "people"} size={size * 0.45} color={colors.gold} />
      </View>
    );
  return <Image source={uri} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.elevated }} contentFit="cover" transition={200} />;
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small">{label}</Text>
      <TextInput placeholderTextColor={colors.faint} selectionColor={colors.gold} style={[styles.input, error ? { borderColor: colors.danger } : null, style]} {...props} />
      {error ? (
        <Text variant="small" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.gold} />
      {label ? <Text variant="muted">{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; body?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.gold} />
      </View>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body ? (
        <Text variant="muted" style={{ textAlign: "center", maxWidth: 280 }}>
          {body}
        </Text>
      ) : null}
      {action ? <Button title={action} onPress={onAction} compact style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon="cloud-offline-outline" title="Something's not right" body={message} action={onRetry ? "Try again" : undefined} onAction={onRetry} />;
}

const statusMeta: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", color: colors.warning },
  CONFIRMED: { label: "Confirmed", color: colors.success },
  COMPLETED: { label: "Completed", color: colors.muted },
  CANCELLED: { label: "Cancelled", color: colors.danger },
  NO_SHOW: { label: "Missed", color: colors.danger },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = statusMeta[status];
  return (
    <View style={[styles.badge, { borderColor: `${meta.color}55` }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function InfoRow({ icon, label, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void }) {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {value ? <Text variant="small">{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function SummaryLine({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text variant={strong ? "subheading" : "muted"} style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant={strong ? "subheading" : "body"} style={accent ? { color: colors.success } : strong ? { color: colors.goldLight } : undefined}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: space.lg },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: space.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, height: 38, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  avatarFallback: { backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  input: { height: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, color: colors.text, fontFamily: fonts.body, fontSize: 15.5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.xxl, minHeight: 220 },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, borderWidth: 1, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 0.3 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  summaryLine: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
});
