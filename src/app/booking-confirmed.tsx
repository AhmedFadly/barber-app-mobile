import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Card, Divider, InfoRow, Loading } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { aed, longDate, time12 } from "@/lib/format";
import { mapsUrl } from "@/lib/links";
import type { Appointment } from "@/lib/types";

export default function BookingConfirmed() {
  const router = useRouter();
  const { id, rescheduled } = useLocalSearchParams<{ id: string; rescheduled?: string }>();
  const [appt, setAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    api.appointment(id).then((r) => setAppt(r.appointment), () => {});
  }, [id]);

  return (
    <Screen footer={<Button title="Done" onPress={() => router.replace("/bookings")} />}>
      <View style={styles.hero}>
        <View style={styles.ring}>
          <Ionicons name="checkmark" size={44} color={colors.onGold} />
        </View>
        <Text variant="label">{rescheduled ? "Rescheduled" : "You're booked"}</Text>
        <Text variant="title" style={{ textAlign: "center" }}>
          {rescheduled ? "Your new time is set" : "See you in the chair"}
        </Text>
        {appt ? <Text variant="muted">Reference {appt.reference}</Text> : null}
      </View>
      {!appt ? (
        <Loading />
      ) : (
        <Card style={{ gap: 2, paddingVertical: space.sm }}>
          <InfoRow icon="calendar-outline" label={longDate(appt.startsAt)} value={`${time12(appt.startsAt)} – ${time12(appt.endsAt)}`} />
          <Divider />
          <InfoRow icon="cut-outline" label={appt.items.map((i) => i.name).join(" + ")} value={`with ${appt.barber.name}`} />
          <Divider />
          <InfoRow icon="location-outline" label={`REGENT ${appt.branch.name}`} value="Get directions" onPress={() => void Linking.openURL(mapsUrl(appt.branch))} />
          <Divider />
          <InfoRow icon="wallet-outline" label={`${aed(appt.balanceDueFils)} to pay at the shop`} value={appt.paidFils + appt.creditUsedFils > 0 ? `${aed(appt.paidFils + appt.creditUsedFils)} already paid` : undefined} />
        </Card>
      )}
      <Text variant="small" style={{ textAlign: "center" }}>
        We&apos;ll remind you before your appointment.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: space.sm, paddingTop: space.xxxl, paddingBottom: space.lg },
  ring: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginBottom: space.md, shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 },
});
