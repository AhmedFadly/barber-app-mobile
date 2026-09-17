import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { colors, fonts, radius, space, tierStyle } from "@/constants/theme";
import { aed } from "@/lib/format";
import type { Customer } from "@/lib/types";

import { Text } from "./text";

/** The membership card: tier, points, wallet credit and progress to the next tier. */
export function TierCard({ customer }: { customer: Customer }) {
  const tier = tierStyle[customer.tier];
  const next = customer.nextTier;
  const progress = next ? Math.min(1, customer.lifetimePoints / next.threshold) : 1;
  return (
    <LinearGradient colors={tier.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.sheen} />
      <View style={styles.top}>
        <Text style={styles.brand}>REGENT</Text>
        <Text style={[styles.tier, { color: tier.accent }]}>{tier.label.toUpperCase()} MEMBER</Text>
      </View>
      <Text style={styles.name}>
        {customer.firstName} {customer.lastName}
      </Text>
      <View style={styles.stats}>
        <View>
          <Text style={styles.statValue}>{customer.pointsBalance.toLocaleString("en-US")}</Text>
          <Text style={styles.statLabel}>POINTS</Text>
        </View>
        <View style={styles.statDivider} />
        <View>
          <Text style={styles.statValue}>{aed(customer.creditFils)}</Text>
          <Text style={styles.statLabel}>WALLET</Text>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: tier.accent }]} />
        </View>
        <Text style={styles.progressText}>{next ? `${next.pointsNeeded.toLocaleString("en-US")} points to ${tierStyle[next.tier].label}` : "You've reached our highest tier"}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: space.xl, gap: space.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(230,203,143,0.22)" },
  sheen: { position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: 5, color: colors.text },
  tier: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 2 },
  name: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  stats: { flexDirection: "row", alignItems: "center", gap: space.xl },
  statValue: { fontFamily: fonts.semibold, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.6, color: "rgba(244,241,234,0.55)", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(244,241,234,0.15)" },
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(244,241,234,0.12)", overflow: "hidden" },
  fill: { height: 4, borderRadius: 2 },
  progressText: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(244,241,234,0.7)" },
});
