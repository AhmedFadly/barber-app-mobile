import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppointmentCard } from "@/components/appointment-card";
import { Screen } from "@/components/screen";
import { Chip, EmptyState, ErrorState, Loading } from "@/components/ui";
import { space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBookingDraft } from "@/lib/booking-draft";
import type { Appointment } from "@/lib/types";

export default function Bookings() {
  const router = useRouter();
  const { customer } = useAuth();
  const { start } = useBookingDraft();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [list, setList] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      setList((await api.appointments()).appointments);
      setNow(Date.now());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [customer]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!customer)
    return (
      <Screen eyebrow="Your visits" title="Bookings" tabBarInset>
        <EmptyState icon="calendar-outline" title="Sign in to see your bookings" body="Manage upcoming appointments, reschedule, and rebook your favourites." action="Sign in" onAction={() => router.push("/sign-in")} />
      </Screen>
    );

  const upcoming = (list ?? [])
    .filter((a) => (a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT") && new Date(a.endsAt).getTime() > now && !(a.holdExpiresAt && new Date(a.holdExpiresAt).getTime() < now))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = (list ?? []).filter((a) => !upcoming.includes(a) && !(a.status === "PENDING_PAYMENT"));
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <Screen
      eyebrow="Your visits"
      title="Bookings"
      tabBarInset
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}>
      <View style={styles.tabs}>
        <Chip label={`Upcoming${list ? ` · ${upcoming.length}` : ""}`} selected={tab === "upcoming"} onPress={() => setTab("upcoming")} />
        <Chip label="History" selected={tab === "past"} onPress={() => setTab("past")} />
      </View>
      {error && !list ? (
        <ErrorState message={error} onRetry={load} />
      ) : !list ? (
        <Loading />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? "calendar-clear-outline" : "time-outline"}
          title={tab === "upcoming" ? "Nothing booked yet" : "No past visits"}
          body={tab === "upcoming" ? "Your chair is waiting. Pick a service and a time that suits you." : "Completed and cancelled appointments will appear here."}
          action={tab === "upcoming" ? "Book now" : undefined}
          onAction={() => {
            start();
            router.push("/book");
          }}
        />
      ) : (
        shown.map((a) => <AppointmentCard key={a.id} appointment={a} highlight={tab === "upcoming" && a === upcoming[0]} onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: a.id } })} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ tabs: { flexDirection: "row", gap: space.sm } });
