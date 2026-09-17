import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import { Text } from "@/components/text";
import { EmptyState, ErrorState, Loading } from "@/components/ui";
import { colors, fonts, radius, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { dateKey, dateKeyParts, hhmmTo12 } from "@/lib/format";
import type { Slot } from "@/lib/types";

const PERIODS = [
  { label: "Morning", from: "00:00", to: "12:00" },
  { label: "Afternoon", from: "12:00", to: "17:00" },
  { label: "Evening", from: "17:00", to: "24:00" },
];

export default function ChooseTime() {
  const router = useRouter();
  const { catalog } = useCatalog();
  const { draft, update } = useBookingDraft();
  const branch = catalog?.branches.find((b) => b.id === draft.branchId);
  const windowDays = catalog?.policy.bookingWindowDays ?? 30;

  const days = useMemo(() => Array.from({ length: windowDays + 1 }, (_, i) => dateKey(i)), [windowDays]);
  const isOpen = (key: string) => !!branch?.openingHours.some((h) => h.weekday === dateKeyParts(key).weekdayIndex);
  const [date, setDate] = useState(() => draft.date ?? days.find(isOpen) ?? days[0]);
  const [result, setResult] = useState<{ key: string; slots?: Slot[]; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Until the customer picks a day themselves, skip forward past days with nothing free.
  const autoAdvance = useRef(!draft.date);
  const stripRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Keep the selected day in view (day pill 62 wide + 8 gap).
    stripRef.current?.scrollTo({ x: Math.max(0, days.indexOf(date) * 70 - 70), animated: true });
  }, [date, days]);

  useEffect(() => {
    if (!draft.branchId) return;
    let cancelled = false;
    const key = `${date}|${attempt}`;
    api
      .availability({ branchId: draft.branchId, serviceIds: draft.serviceIds, date, barberId: draft.barberId, excludeAppointmentId: draft.rescheduleId ?? undefined })
      .then((r) => {
        if (cancelled) return;
        const nextOpen = days.slice(days.indexOf(date) + 1).find(isOpen);
        if (!r.slots.length && autoAdvance.current && nextOpen && days.indexOf(date) < 14) return setDate(nextOpen);
        autoAdvance.current = false;
        setResult({ key, slots: r.slots });
      })
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [date, draft.branchId, draft.serviceIds, draft.barberId, draft.rescheduleId, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Results for a different day (or an older retry) count as still loading.
  const current = result?.key === `${date}|${attempt}` ? result : null;
  const slots = current?.slots ?? null;
  const error = current?.error ?? null;

  const barberName = draft.barberId ? catalog?.barbers.find((b) => b.id === draft.barberId)?.name : "any barber";

  return (
    <Screen
      back
      eyebrow={`With ${barberName}`}
      title="Pick a time"
      footer={
        <Button
          title={draft.slot ? `Continue · ${dateKeyParts(date).weekday} ${hhmmTo12(draft.slot.time)}` : "Select a time"}
          disabled={!draft.slot}
          onPress={() => router.push("/book/review")}
        />
      }>
      <Steps current={3} />
      <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }} style={{ marginHorizontal: -space.xl, flexGrow: 0 }}>
        {days.map((key, i) => {
          const p = dateKeyParts(key);
          const open = isOpen(key);
          const selected = key === date;
          return (
            <Pressable
              key={key}
              disabled={!open}
              onPress={() => {
                autoAdvance.current = false;
                setDate(key);
                update({ date: key, slot: null });
              }}
              style={[styles.day, selected && styles.daySelected, !open && { opacity: 0.35 }]}>
              <Text style={[styles.dayLabel, selected && { color: colors.onGold }]}>{i === 0 ? "TODAY" : p.weekday.toUpperCase()}</Text>
              <Text style={[styles.dayNum, selected && { color: colors.onGold }]}>{p.day}</Text>
              <Text style={[styles.dayLabel, selected && { color: colors.onGold }]}>{p.month.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : !slots ? (
        <Loading />
      ) : slots.length === 0 ? (
        <EmptyState icon="calendar-clear-outline" title="No times this day" body={draft.barberId ? "Your barber is fully booked or not working. Try another day, or choose any available barber." : "Try another day — new times open up often."} />
      ) : (
        PERIODS.map((period) => {
          const inPeriod = slots.filter((s) => s.time >= period.from && s.time < period.to);
          if (!inPeriod.length) return null;
          return (
            <View key={period.label} style={{ gap: space.sm }}>
              <Text variant="label">{period.label}</Text>
              <View style={styles.grid}>
                {inPeriod.map((s) => {
                  const selected = draft.slot?.startsAt === s.startsAt;
                  return (
                    <Pressable key={s.startsAt} onPress={() => update({ date, slot: { startsAt: s.startsAt, time: s.time } })} style={[styles.slot, selected && styles.slotSelected]}>
                      <Text style={[styles.slotText, selected && { color: colors.onGold }]}>{hhmmTo12(s.time)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: { width: 62, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center" },
  daySelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayLabel: { fontFamily: fonts.semibold, fontSize: 9.5, letterSpacing: 1, color: colors.muted },
  dayNum: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  slot: { width: "31.5%", height: 46, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  slotSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});
