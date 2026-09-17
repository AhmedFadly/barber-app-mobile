import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { TierCard } from "@/components/tier-card";
import { Card, Divider, EmptyState, Loading } from "@/components/ui";
import { colors, radius, space, tierStyle } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { aed, shortDate } from "@/lib/format";
import type { WalletActivity } from "@/lib/types";

export default function Rewards() {
  const router = useRouter();
  const { customer, setCustomer } = useAuth();
  const { catalog } = useCatalog();
  const [activity, setActivity] = useState<WalletActivity[] | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    api.wallet().then((w) => {
      setCustomer(w.customer);
      setActivity(w.activity);
    }, () => setActivity([]));
  }, [setCustomer]);
  useFocusEffect(load);

  if (!customer)
    return (
      <Screen back title="Rewards">
        <EmptyState icon="sparkles-outline" title="Sign in to earn rewards" action="Sign in" onAction={() => router.push("/sign-in")} />
      </Screen>
    );
  if (!catalog) return <Screen back title="Rewards"><Loading /></Screen>;

  const p = catalog.policy;
  const blocks = Math.floor(customer.pointsBalance / p.redeemBlockPoints);

  const redeem = async () => {
    setRedeeming(true);
    setMessage(null);
    try {
      const { customer: updated } = await api.redeemPoints(blocks);
      setCustomer(updated);
      setMessage({ text: `${aed(blocks * p.redeemBlockFils)} added to your wallet`, ok: true });
      load();
    } catch (e) {
      setMessage({ text: (e as Error).message, ok: false });
    } finally {
      setRedeeming(false);
    }
  };

  const tiers = [
    { key: "SILVER" as const, from: 0, perks: "1 point per AED · birthday treat" },
    { key: "GOLD" as const, from: p.goldThreshold, perks: "Priority booking · complimentary hot towel upgrade" },
    { key: "BLACK" as const, from: p.blackThreshold, perks: "Free beard line-up every visit · exclusive events" },
  ];

  return (
    <Screen back eyebrow="REGENT membership" title="Rewards & wallet">
      <TierCard customer={customer} />

      <Card style={{ gap: space.md }}>
        <View style={styles.row}>
          <Ionicons name="swap-horizontal" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text variant="subheading">Turn points into credit</Text>
            <Text variant="small">
              Every {p.redeemBlockPoints} points = {aed(p.redeemBlockFils)} to spend on any service
            </Text>
          </View>
        </View>
        <Button title={blocks > 0 ? `Redeem ${blocks * p.redeemBlockPoints} pts for ${aed(blocks * p.redeemBlockFils)}` : `${p.redeemBlockPoints - customer.pointsBalance} more points to redeem`} disabled={blocks === 0} loading={redeeming} onPress={redeem} />
        {message ? (
          <Text variant="small" style={{ color: message.ok ? colors.success : colors.danger, textAlign: "center" }}>
            {message.text}
          </Text>
        ) : null}
      </Card>

      <Text variant="heading">Membership tiers</Text>
      <Card style={{ paddingVertical: space.sm }}>
        {tiers.map((t, i) => (
          <View key={t.key}>
            {i > 0 ? <Divider /> : null}
            <View style={[styles.row, { paddingVertical: space.md }]}>
              <View style={[styles.tierDot, { borderColor: tierStyle[t.key].accent }, customer.tier === t.key && { backgroundColor: tierStyle[t.key].accent }]} />
              <View style={{ flex: 1 }}>
                <Text variant="subheading">
                  {tierStyle[t.key].label}
                  {customer.tier === t.key ? "  ·  You're here" : ""}
                </Text>
                <Text variant="small">{t.perks}</Text>
              </View>
              <Text variant="small">{t.from ? `${t.from.toLocaleString("en-US")} pts` : "Joined"}</Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.row}>
        <Text variant="heading" style={{ flex: 1 }}>
          Activity
        </Text>
        <Button compact variant="ghost" title="Gift cards" icon="gift-outline" onPress={() => router.push("/gift-cards")} />
      </View>
      {!activity ? (
        <Loading />
      ) : activity.length === 0 ? (
        <Text variant="muted">Points from your visits will show up here.</Text>
      ) : (
        <Card style={{ paddingVertical: space.xs }}>
          {activity.map((a, i) => (
            <View key={a.id}>
              {i > 0 ? <Divider /> : null}
              <View style={[styles.row, { paddingVertical: space.md }]}>
                <View style={styles.activityIcon}>
                  <Ionicons name={a.kind === "points" ? "diamond-outline" : "wallet-outline"} size={16} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body">{a.reason}</Text>
                  <Text variant="small">{shortDate(a.createdAt)}</Text>
                </View>
                <Text variant="subheading" style={{ color: a.amount > 0 ? colors.success : colors.muted }}>
                  {a.amount > 0 ? "+" : "–"}
                  {a.kind === "points" ? `${Math.abs(a.amount)} pts` : aed(Math.abs(a.amount))}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  tierDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  activityIcon: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
});
