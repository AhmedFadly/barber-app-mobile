import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import { Text } from "@/components/text";
import { Card, Divider, Field, Loading, SummaryLine } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { payWithStripe, paymentReturnUrl } from "@/lib/checkout";
import { aed, duration, longDate, time12 } from "@/lib/format";
import { scheduleReminder } from "@/lib/notifications";

export default function Review() {
  const router = useRouter();
  const { customer, refresh } = useAuth();
  const { catalog, serviceById } = useCatalog();
  const { draft, update } = useBookingDraft();
  const [useCredit, setUseCredit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!catalog || !draft.slot || !draft.branchId) return <Screen back title="Review"><Loading /></Screen>;

  const branch = catalog.branches.find((b) => b.id === draft.branchId)!;
  const barber = catalog.barbers.find((b) => b.id === draft.barberId);
  const services = draft.serviceIds.map(serviceById).filter((s) => !!s);
  const subtotal = services.reduce((s, x) => s + x.priceFils, 0);
  const minutes = services.reduce((s, x) => s + x.durationMin, 0);
  const deposit = Math.round((subtotal * catalog.policy.depositPercent) / 100);
  const credit = customer && useCredit ? Math.min(customer.creditFils, subtotal) : 0;
  const dueNow = Math.max(0, deposit - credit);
  const atShop = subtotal - credit - dueNow;
  const rescheduling = !!draft.rescheduleId;

  const submit = async () => {
    if (!customer) return router.push("/sign-in");
    setSubmitting(true);
    setError(null);
    try {
      if (rescheduling) {
        const { appointment } = await api.reschedule(draft.rescheduleId!, draft.slot!.startsAt, draft.barberId);
        await scheduleReminder(appointment);
        router.dismissAll();
        router.replace({ pathname: "/booking-confirmed", params: { id: appointment.id, rescheduled: "1" } });
        return;
      }
      const { appointment, checkout } = await api.book({
        branchId: branch.id,
        serviceIds: draft.serviceIds,
        barberId: draft.barberId,
        startsAt: draft.slot!.startsAt,
        notes: draft.notes.trim() || undefined,
        useCredit,
        returnUrl: paymentReturnUrl(),
      });
      void refresh();
      if (!checkout) {
        await scheduleReminder(appointment);
        router.dismissAll();
        router.replace({ pathname: "/booking-confirmed", params: { id: appointment.id } });
      } else if (checkout.mode === "demo") {
        router.push({ pathname: "/pay", params: { paymentId: checkout.paymentId, amountFils: String(checkout.amountFils), appointmentId: appointment.id, label: `Deposit · ${appointment.reference}` } });
      } else if (await payWithStripe(checkout)) {
        const { appointment: paid } = await api.appointment(appointment.id);
        await scheduleReminder(paid);
        router.dismissAll();
        router.replace({ pathname: "/booking-confirmed", params: { id: appointment.id } });
      } else {
        router.dismissAll();
        router.push({ pathname: "/appointment/[id]", params: { id: appointment.id } });
      }
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
      if (err.code === "slot_taken") update({ slot: null });
    } finally {
      setSubmitting(false);
    }
  };

  const cta = !customer ? "Sign in to book" : rescheduling ? "Confirm new time" : dueNow > 0 ? `Pay deposit · ${aed(dueNow)}` : "Confirm booking";

  return (
    <Screen
      back
      eyebrow={rescheduling ? "Reschedule" : "Almost done"}
      title="Review & confirm"
      footer={
        <>
          {error ? (
            <Text variant="small" style={{ color: colors.danger, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}
          {error && !draft.slot ? null : <Button title={cta} loading={submitting} icon={customer ? "lock-closed" : "person"} onPress={submit} />}
        </>
      }>
      <Steps current={4} />

      <Card style={{ gap: space.md }}>
        <View style={styles.when}>
          <View style={styles.whenIcon}>
            <Ionicons name="calendar" size={20} color={colors.onGold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{longDate(draft.slot.startsAt)}</Text>
            <Text variant="muted">
              {time12(draft.slot.startsAt)} – {time12(new Date(new Date(draft.slot.startsAt).getTime() + minutes * 60_000).toISOString())} · {duration(minutes)}
            </Text>
          </View>
        </View>
        <Divider />
        <View style={styles.line}>
          <Ionicons name="location-outline" size={18} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text variant="body">REGENT {branch.name}</Text>
            <Text variant="small">{branch.address}</Text>
          </View>
        </View>
        <View style={styles.line}>
          {barber ? <Image source={barber.photoUrl} style={{ width: 22, height: 22, borderRadius: 11 }} /> : <Ionicons name="people-outline" size={18} color={colors.gold} />}
          <Text variant="body">{barber ? `${barber.name} · ${barber.title}` : "First available barber"}</Text>
        </View>
      </Card>

      <Card style={{ gap: 2 }}>
        {services.map((s) => (
          <SummaryLine key={s.id} label={s.name} value={aed(s.priceFils)} />
        ))}
        <Divider style={{ marginVertical: space.sm }} />
        <SummaryLine label="Total" value={aed(subtotal)} strong />
        {!rescheduling && credit > 0 ? <SummaryLine label="Wallet credit" value={`– ${aed(credit)}`} accent /> : null}
        {!rescheduling ? (
          <>
            <SummaryLine label={`Due now (${catalog.policy.depositPercent}% deposit)`} value={aed(dueNow)} />
            <SummaryLine label="Pay at the shop" value={aed(atShop)} />
          </>
        ) : null}
      </Card>

      {!rescheduling && customer && customer.creditFils > 0 ? (
        <Card style={styles.creditRow}>
          <Ionicons name="wallet-outline" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Use wallet credit</Text>
            <Text variant="small">{aed(customer.creditFils)} available</Text>
          </View>
          <Switch value={useCredit} onValueChange={setUseCredit} trackColor={{ true: colors.gold, false: colors.line }} thumbColor={colors.text} />
        </Card>
      ) : null}

      {!rescheduling ? (
        <Field label="Notes for your barber (optional)" placeholder="e.g. keep length on top, sensitive skin" value={draft.notes} onChangeText={(notes) => update({ notes })} multiline style={{ height: 88, paddingTop: 14, textAlignVertical: "top" }} />
      ) : null}

      <View style={styles.policy}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} />
        <Text variant="small" style={{ flex: 1 }}>
          Free cancellation or rescheduling up to {catalog.policy.cancellationHours} hours before — prepaid amounts return to your REGENT wallet. Later cancellations forfeit the deposit.
          {customer ? ` You'll earn about ${Math.floor(subtotal / 100) * catalog.policy.pointsPerAed} points for this visit.` : ""}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  when: { flexDirection: "row", alignItems: "center", gap: space.md },
  whenIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  line: { flexDirection: "row", alignItems: "center", gap: space.md },
  creditRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  policy: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.xs },
});
