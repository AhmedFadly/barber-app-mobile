import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Card, Divider, ErrorState, InfoRow, Loading, StatusBadge, SummaryLine } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBookingDraft } from "@/lib/booking-draft";
import { payWithStripe, paymentReturnUrl } from "@/lib/checkout";
import { aed, dateKeyOf, longDate, time12 } from "@/lib/format";
import { mapsUrl, telUrl } from "@/lib/links";
import { cancelReminder, scheduleReminder } from "@/lib/notifications";
import type { Appointment } from "@/lib/types";

function ask(title: string, message: string, confirmText: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Keep booking", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useAuth();
  const { start } = useBookingDraft();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"cancel" | "pay" | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    api.appointment(id).then(
      (r) => {
        setAppt(r.appointment);
        setNow(Date.now());
      },
      (e: Error) => setError(e.message),
    );
  }, [id]);
  useFocusEffect(load);

  if (error && !appt) return <Screen back title="Booking"><ErrorState message={error} onRetry={load} /></Screen>;
  if (!appt) return <Screen back title="Booking"><Loading /></Screen>;

  const holdActive = appt.status === "PENDING_PAYMENT" && appt.holdExpiresAt && new Date(appt.holdExpiresAt).getTime() > now;
  const prepaid = appt.paidFils + appt.creditUsedFils;

  const cancel = async () => {
    const message = appt.lateCancellation
      ? `This is within ${appt.cancellationHours} hours of your appointment, so the ${aed(appt.depositFils)} deposit won't be refunded.`
      : prepaid > 0
        ? `${aed(prepaid)} will be returned to your REGENT wallet.`
        : "Your slot will be released.";
    if (!(await ask("Cancel this booking?", message, "Cancel booking"))) return;
    setBusy("cancel");
    try {
      const r = await api.cancel(appt.id);
      setAppt(r.appointment);
      await cancelReminder(appt.id);
      void refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    setBusy("pay");
    try {
      const { checkout } = await api.resumePayment(appt.id, paymentReturnUrl());
      if (checkout.mode === "demo") {
        router.push({ pathname: "/pay", params: { paymentId: checkout.paymentId, amountFils: String(checkout.amountFils), appointmentId: appt.id, label: `Deposit · ${appt.reference}` } });
      } else if (await payWithStripe(checkout)) {
        const { appointment } = await api.appointment(appt.id);
        setAppt(appointment);
        await scheduleReminder(appointment);
      }
    } catch (e) {
      setError((e as Error).message);
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen back eyebrow={`Ref ${appt.reference}`} title={appt.items.map((i) => i.name).join(" + ")}>
      <StatusBadge status={holdActive || appt.status !== "PENDING_PAYMENT" ? appt.status : "CANCELLED"} />

      {holdActive ? (
        <Card style={{ gap: space.md, borderColor: "rgba(227,181,91,0.4)" }}>
          <Text variant="body">Your slot is held until {time12(appt.holdExpiresAt!)}. Pay the deposit to confirm it.</Text>
          <Button title={`Pay deposit · ${aed(Math.max(0, appt.depositFils - appt.creditUsedFils))}`} icon="lock-closed" loading={busy === "pay"} onPress={pay} />
        </Card>
      ) : null}

      <Card style={{ paddingVertical: space.sm }}>
        <InfoRow icon="calendar-outline" label={longDate(appt.startsAt)} value={`${time12(appt.startsAt)} – ${time12(appt.endsAt)}`} />
        <Divider />
        <View style={styles.barberRow}>
          <Image source={appt.barber.photoUrl} style={styles.barberPhoto} />
          <View style={{ flex: 1 }}>
            <Text variant="body">{appt.barber.name}</Text>
            <Text variant="small">{appt.barber.title}</Text>
          </View>
        </View>
        <Divider />
        <InfoRow icon="location-outline" label={`REGENT ${appt.branch.name}`} value={appt.branch.address} onPress={() => void Linking.openURL(mapsUrl(appt.branch))} />
        <Divider />
        <InfoRow icon="call-outline" label="Call the branch" value={appt.branch.phone} onPress={() => void Linking.openURL(telUrl(appt.branch.phone))} />
      </Card>

      <Card style={{ gap: 2 }}>
        {appt.items.map((i) => (
          <SummaryLine key={i.serviceId} label={i.name} value={aed(i.priceFils)} />
        ))}
        <Divider style={{ marginVertical: space.sm }} />
        <SummaryLine label="Total" value={aed(appt.subtotalFils)} strong />
        {appt.creditUsedFils > 0 ? <SummaryLine label="Wallet credit" value={`– ${aed(appt.creditUsedFils)}`} accent /> : null}
        {appt.paidFils > 0 ? <SummaryLine label="Deposit paid" value={`– ${aed(appt.paidFils)}`} accent /> : null}
        {appt.status === "CONFIRMED" ? <SummaryLine label="Pay at the shop" value={aed(appt.balanceDueFils)} /> : null}
        {appt.paymentStatus === "REFUNDED" ? (
          <Text variant="small" style={{ marginTop: space.sm, color: colors.success }}>
            Prepaid amount returned to your wallet.
          </Text>
        ) : null}
      </Card>

      {appt.notes ? (
        <Card>
          <Text variant="small">Notes for your barber</Text>
          <Text variant="body">{appt.notes}</Text>
        </Card>
      ) : null}

      {error ? (
        <Text variant="small" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}

      <View style={{ gap: space.sm }}>
        {appt.canReschedule ? (
          <Button
            title="Reschedule"
            variant="secondary"
            icon="swap-horizontal"
            onPress={() => {
              start({ branchId: appt.branch.id, serviceIds: appt.items.map((i) => i.serviceId), barberId: appt.barber.id, rescheduleId: appt.id, date: dateKeyOf(appt.startsAt) });
              router.push("/book/barber");
            }}
          />
        ) : null}
        {(appt.status === "COMPLETED" || appt.status === "CANCELLED" || appt.status === "NO_SHOW") && (
          <Button
            title="Book again"
            icon="refresh"
            onPress={() => {
              start({ branchId: appt.branch.id, serviceIds: appt.items.map((i) => i.serviceId), barberId: appt.barber.id });
              router.push("/book/time");
            }}
          />
        )}
        {appt.canCancel && !(appt.status === "PENDING_PAYMENT" && !holdActive) ? <Button title="Cancel booking" variant="danger" loading={busy === "cancel"} onPress={cancel} /> : null}
        {appt.status === "CONFIRMED" && !appt.canReschedule && appt.canCancel ? (
          <Text variant="small" style={{ textAlign: "center" }}>
            Changes within {appt.cancellationHours} hours of your visit? Call the branch and we&apos;ll do our best.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  barberRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  barberPhoto: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.elevated },
});
