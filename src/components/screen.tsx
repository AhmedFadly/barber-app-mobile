import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, space } from "@/constants/theme";

import { Text } from "./text";

type Props = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  back?: boolean;
  right?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom padding when the screen sits above the tab bar. */
  tabBarInset?: boolean;
};

export function Screen({ children, title, eyebrow, back, right, footer, scroll = true, refreshing, onRefresh, contentStyle, tabBarInset }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const header =
    back || title || right ? (
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        {back ? (
          <Pressable accessibilityLabel="Back" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={[styles.iconButton, { marginTop: eyebrow ? 12 : 0 }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text variant="label">{eyebrow}</Text> : null}
          {title ? (
            <Text variant="title" numberOfLines={2}>
              {title}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    ) : (
      <View style={{ height: insets.top }} />
    );

  const bottomPad = (footer ? space.lg : insets.bottom + space.xl) + (tabBarInset ? 84 : 0);
  return (
    <View style={styles.root}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.gold} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "flex-start", gap: space.md, paddingHorizontal: space.xl, paddingBottom: space.md },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  content: { paddingHorizontal: space.xl, gap: space.lg },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: space.sm },
});
