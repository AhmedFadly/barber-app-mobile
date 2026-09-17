import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { colors, fonts, radius, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { aed } from "@/lib/format";
import { scheduleReminder } from "@/lib/notifications";

/**
 * Demo payment sheet, used while the backend has no Stripe keys.
 * With Stripe configured the app opens Stripe Checkout instead and never shows this screen.
 */
export default function Pay() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { paymentId, amountFils, appointmentId, label } = useLocalSearchParams<{ paymentId: string; amountFils: string; appointmentId?: string; label: string }>();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      await api.confirmDemoPayment(paymentId);
      const result = await api.payment(paymentId);
      void refresh();
      router.dismissAll();
      if (appointmentId) {
        const { appointment } = await api.appointment(appointmentId);
        await scheduleReminder(appointment);
        router.replace({ pathname: "/booking-confirmed", params: { id: appointmentId } });
      } else if (result.giftCard) {
        router.push({ pathname: "/gift-cards", params: { purchasedCode: result.giftCard.code, purchasedAmount: String(result.giftCard.amountFils), purchasedFor: result.giftCard.recipientName } });
      }
    } catch (e) {
      setError((e as Error).message);
      setPaying(false);
    }
  };

  return (
    <Screen
      back
      eyebrow="Secure checkout"
      title="Payment"
      footer={
        <>
          {error ? (
            <Text variant="small" style={{ color: colors.danger, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}
          <Button title={`Pay ${aed(Number(amountFils))}`} icon="lock-closed" loading={paying} onPress={pay} />
        </>
      }>
      <View style={styles.demo}>
        <Ionicons name="flask-outline" size={16} color={colors.warning} />
        <Text variant="small" style={{ color: colors.warning, flex: 1 }}>
          Demo mode — no card is charged. Add Stripe keys to the backend to take real payments (Apple Pay, Google Pay & cards).
        </Text>
      </View>

      <LinearGradient colors={["#2B2418", "#121110"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Ionicons name="card" size={28} color={colors.goldLight} />
          <Text style={styles.brand}>VISA</Text>
        </View>
        <Text style={styles.number}>••••  ••••  ••••  4242</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.meta}>CARDHOLDER</Text>
          <Text style={styles.meta}>12 / 30</Text>
        </View>
      </LinearGradient>

      <View style={styles.summary}>
        <Text variant="muted">{label}</Text>
        <Text variant="title" style={{ color: colors.goldLight }}>
          {aed(Number(amountFils))}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { flexDirection: "row", gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: "rgba(227,181,91,0.08)", borderWidth: 1, borderColor: "rgba(227,181,91,0.25)" },
  card: { height: 200, borderRadius: radius.xl, padding: space.xl, justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(230,203,143,0.25)" },
  brand: { fontFamily: fonts.semibold, fontSize: 18, letterSpacing: 2, color: colors.text, fontStyle: "italic" },
  number: { fontFamily: fonts.medium, fontSize: 20, letterSpacing: 2, color: colors.text },
  meta: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.5, color: colors.muted },
  summary: { alignItems: "center", gap: 4, marginTop: space.md },
});
