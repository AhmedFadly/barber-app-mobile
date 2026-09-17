import { useRouter } from "expo-router";
import { Alert, Linking, Platform, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { TierCard } from "@/components/tier-card";
import { Card, Divider, EmptyState, InfoRow } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shortDate } from "@/lib/format";

function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [{ text: "Not now", style: "cancel" }, { text: action, style: "destructive", onPress: onConfirm }]);
}

export default function Account() {
  const router = useRouter();
  const { customer, signOut, setCustomer } = useAuth();

  if (!customer)
    return (
      <Screen eyebrow="REGENT membership" title="Account" tabBarInset>
        <EmptyState icon="person-circle-outline" title="Join REGENT" body="Earn points on every visit, unlock Gold and Black tiers, and keep your bookings in one place." action="Sign in or create account" onAction={() => router.push("/sign-in")} />
        <Card>
          <InfoRow icon="gift-outline" label="Gift cards" value="Give the gift of a great cut" onPress={() => router.push("/gift-cards")} />
          <Divider />
          <InfoRow icon="location-outline" label="Our locations" value="Opening hours & directions" onPress={() => router.push("/locations")} />
        </Card>
      </Screen>
    );

  return (
    <Screen eyebrow={`Member since ${shortDate(customer.memberSince)}`} title={`Hello, ${customer.firstName}`} tabBarInset>
      <TierCard customer={customer} />

      <Card style={styles.menu}>
        <InfoRow icon="sparkles-outline" label="Rewards & wallet" value="Redeem points, see your activity" onPress={() => router.push("/rewards")} />
        <Divider />
        <InfoRow icon="gift-outline" label="Gift cards" value="Buy or redeem a gift card" onPress={() => router.push("/gift-cards")} />
        <Divider />
        <InfoRow icon="location-outline" label="Our locations" value="Opening hours & directions" onPress={() => router.push("/locations")} />
      </Card>

      <Card style={styles.menu}>
        <InfoRow icon="person-outline" label="Personal details" value={customer.email} onPress={() => router.push("/profile")} />
        <Divider />
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <InfoRow icon="notifications-outline" label="News & offers" value="Notifications about openings and offers" />
          </View>
          <Switch
            value={customer.marketingOptIn}
            trackColor={{ true: colors.gold, false: colors.line }}
            thumbColor={colors.text}
            onValueChange={async (v) => {
              setCustomer({ ...customer, marketingOptIn: v });
              try {
                setCustomer((await api.updateMe({ marketingOptIn: v })).customer);
              } catch {
                setCustomer({ ...customer, marketingOptIn: !v });
              }
            }}
          />
        </View>
        <Divider />
        <InfoRow icon="chatbubble-ellipses-outline" label="Help & contact" value="Call or WhatsApp your branch" onPress={() => void Linking.openURL("tel:+97145550101")} />
      </Card>

      <Button title="Sign out" variant="secondary" icon="log-out-outline" onPress={() => void signOut()} />
      <Button
        title="Delete account"
        variant="ghost"
        onPress={() =>
          confirm("Delete your account?", "Your profile, points and wallet credit will be permanently removed and upcoming bookings cancelled.", "Delete", async () => {
            await api.deleteMe();
            await signOut();
          })
        }
      />
      <Text variant="small" style={{ textAlign: "center", color: colors.faint }}>
        REGENT Grooming Co. · v1.0
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: { paddingVertical: space.xs },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
});
