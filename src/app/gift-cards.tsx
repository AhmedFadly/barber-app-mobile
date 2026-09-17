import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Share, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Card, Chip, Divider, Field } from "@/components/ui";
import { colors, fonts, radius, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { payWithStripe, paymentReturnUrl } from "@/lib/checkout";
import { aed, shortDate } from "@/lib/format";
import type { GiftCardSent } from "@/lib/types";

const AMOUNTS = [15_000, 30_000, 50_000, 100_000];

export default function GiftCards() {
  const router = useRouter();
  const { customer, setCustomer } = useAuth();
  const params = useLocalSearchParams<{ purchasedCode?: string; purchasedAmount?: string; purchasedFor?: string }>();
  const [amount, setAmount] = useState(AMOUNTS[1]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"buy" | "redeem" | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [sent, setSent] = useState<GiftCardSent[]>([]);
  const [boughtHere, setBoughtHere] = useState<{ code: string; amountFils: number; recipientName: string } | null>(null);
  // Demo checkout returns here with the new card in the route params; Stripe checkout sets it in place.
  const purchased = boughtHere ?? (params.purchasedCode ? { code: params.purchasedCode, amountFils: Number(params.purchasedAmount), recipientName: params.purchasedFor ?? "" } : null);

  useEffect(() => {
    if (customer) api.wallet().then((w) => setSent(w.giftCardsSent), () => {});
  }, [customer, purchased?.code]);

  const requireAccount = () => {
    if (customer) return true;
    router.push("/sign-in");
    return false;
  };

  const buy = async () => {
    if (!requireAccount()) return;
    setBusy("buy");
    setFeedback(null);
    try {
      const { checkout } = await api.buyGiftCard({ amountFils: amount, recipientName, recipientEmail: recipientEmail || undefined, message: message || undefined, returnUrl: paymentReturnUrl() });
      if (checkout.mode === "demo") {
        router.push({ pathname: "/pay", params: { paymentId: checkout.paymentId, amountFils: String(checkout.amountFils), label: `Gift card for ${recipientName}` } });
      } else if (await payWithStripe(checkout)) {
        const r = await api.payment(checkout.paymentId);
        if (r.giftCard) setBoughtHere(r.giftCard);
      } else {
        setFeedback({ text: "Payment wasn't completed.", ok: false });
      }
    } catch (e) {
      setFeedback({ text: (e as Error).message, ok: false });
    } finally {
      setBusy(null);
    }
  };

  const redeem = async () => {
    if (!requireAccount()) return;
    setBusy("redeem");
    setFeedback(null);
    try {
      const r = await api.redeemGiftCard(code);
      setCustomer(r.customer);
      setCode("");
      setFeedback({ text: `${aed(r.amountFils)} added to your wallet 🎉`, ok: true });
    } catch (e) {
      setFeedback({ text: (e as Error).message, ok: false });
    } finally {
      setBusy(null);
    }
  };

  const shareCode = async (g: { code: string; amountFils: number; recipientName: string }) => {
    const text = `A REGENT gift card for you, ${g.recipientName}: ${aed(g.amountFils)}. Redeem code ${g.code} in the REGENT app.`;
    if (Platform.OS === "web") await Clipboard.setStringAsync(text);
    else await Share.share({ message: text });
  };

  return (
    <Screen back eyebrow="Give the gift of grooming" title="Gift cards">
      {purchased ? (
        <Card style={{ gap: space.md, borderColor: colors.goldDeep }}>
          <Text variant="label">Gift card ready</Text>
          <Text variant="body">
            Your {aed(purchased.amountFils)} gift card for {purchased.recipientName} is ready. Share the code — they can redeem it in the app.
          </Text>
          <Text style={styles.code}>{purchased.code}</Text>
          <Button title="Share gift card" icon="share-outline" onPress={() => void shareCode(purchased)} />
        </Card>
      ) : null}

      <LinearGradient colors={["#2B2418", "#0E0D0B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.giftCard}>
        <Text style={styles.giftBrand}>REGENT</Text>
        <View>
          <Text variant="label">Gift card</Text>
          <Text style={styles.giftAmount}>{aed(amount)}</Text>
          <Text variant="small">{recipientName ? `For ${recipientName}` : "For someone sharp"}</Text>
        </View>
      </LinearGradient>

      <View style={styles.amounts}>
        {AMOUNTS.map((a) => (
          <Chip key={a} label={aed(a)} selected={amount === a} onPress={() => setAmount(a)} />
        ))}
      </View>
      <Field label="Recipient's name" value={recipientName} onChangeText={setRecipientName} />
      <Field label="Recipient's email (optional)" value={recipientEmail} onChangeText={setRecipientEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Personal message (optional)" value={message} onChangeText={setMessage} multiline style={{ height: 80, paddingTop: 14, textAlignVertical: "top" }} />
      <Button title={`Buy gift card · ${aed(amount)}`} icon="gift" disabled={!recipientName.trim()} loading={busy === "buy"} onPress={buy} />

      <Divider style={{ marginVertical: space.md }} />

      <Text variant="heading">Have a gift card?</Text>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-end" }}>
        <View style={{ flex: 1 }}>
          <Field label="Gift card code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" placeholder="GIFT-XXXX-XXXX" />
        </View>
        <Button title="Redeem" variant="secondary" disabled={code.length < 6} loading={busy === "redeem"} onPress={redeem} style={{ minHeight: 52 }} />
      </View>
      {feedback ? (
        <Text variant="small" style={{ color: feedback.ok ? colors.success : colors.danger }}>
          {feedback.text}
        </Text>
      ) : null}

      {sent.length ? (
        <>
          <Text variant="heading" style={{ marginTop: space.md }}>
            Gift cards you&apos;ve sent
          </Text>
          <Card style={{ paddingVertical: space.xs }}>
            {sent.map((g, i) => (
              <View key={g.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.sentRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body">
                      {aed(g.amountFils)} for {g.recipientName}
                    </Text>
                    <Text variant="small">
                      {g.code} · {shortDate(g.createdAt)}
                    </Text>
                  </View>
                  {g.redeemed ? (
                    <Text variant="small" style={{ color: colors.success }}>
                      Redeemed
                    </Text>
                  ) : (
                    <Button compact variant="ghost" title="Share" onPress={() => void shareCode(g)} />
                  )}
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  giftCard: { height: 190, borderRadius: radius.xl, padding: space.xl, justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(230,203,143,0.3)" },
  giftBrand: { fontFamily: fonts.displayBold, fontSize: 22, letterSpacing: 6, color: colors.text },
  giftAmount: { fontFamily: fonts.display, fontSize: 38, color: colors.goldLight, lineHeight: 44 },
  amounts: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  code: { fontFamily: fonts.semibold, fontSize: 22, letterSpacing: 2, color: colors.goldLight, textAlign: "center", paddingVertical: space.md, borderRadius: radius.md, backgroundColor: colors.bg, overflow: "hidden" },
  sentRow: { flexDirection: "row", alignItems: "center", paddingVertical: space.md, gap: space.md },
});
