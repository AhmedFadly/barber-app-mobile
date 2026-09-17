import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Card, ErrorState, Loading } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { dateKey, dateKeyParts, hhmmTo12 } from "@/lib/format";
import { mapsUrl, telUrl, whatsappUrl } from "@/lib/links";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Collapses identical consecutive days: "Mon – Thu 10:00 AM – 10:00 PM". */
function hoursSummary(hours: { weekday: number; open: string; close: string }[]) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows: { from: number; to: number; text: string }[] = [];
  for (const d of order) {
    const h = hours.find((x) => x.weekday === d);
    const text = h ? `${hhmmTo12(h.open)} – ${hhmmTo12(h.close)}` : "Closed";
    const last = rows[rows.length - 1];
    if (last && last.text === text) last.to = d;
    else rows.push({ from: d, to: d, text });
  }
  return rows.map((r) => ({ days: r.from === r.to ? DAY_NAMES[r.from] : `${DAY_NAMES[r.from]} – ${DAY_NAMES[r.to]}`, text: r.text }));
}

export default function Locations() {
  const router = useRouter();
  const { catalog, error, reload } = useCatalog();
  const { start } = useBookingDraft();
  const today = dateKeyParts(dateKey()).weekdayIndex;

  return (
    <Screen back eyebrow={`${catalog?.branches.length ?? ""} houses across the UAE`} title="Our locations">
      {!catalog ? (
        error ? <ErrorState message={error} onRetry={reload} /> : <Loading />
      ) : (
        catalog.branches.map((b) => {
          const open = b.openingHours.find((h) => h.weekday === today);
          return (
            <Card key={b.id} style={{ padding: 0, overflow: "hidden" }}>
              <Image source={b.imageUrl} style={styles.image} contentFit="cover" transition={200} />
              <View style={{ padding: space.lg, gap: space.sm }}>
                <Text variant="label">{b.area}</Text>
                <Text variant="heading">REGENT {b.name}</Text>
                <Text variant="muted">{b.address}</Text>
                <Text variant="small" style={{ color: open ? colors.success : colors.danger }}>
                  {open ? `Open today ${hhmmTo12(open.open)} – ${hhmmTo12(open.close)}` : "Closed today"}
                </Text>
                <View style={styles.hours}>
                  {hoursSummary(b.openingHours).map((r) => (
                    <View key={r.days} style={{ flexDirection: "row" }}>
                      <Text variant="small" style={{ width: 96 }}>
                        {r.days}
                      </Text>
                      <Text variant="small" style={{ color: colors.text }}>
                        {r.text}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actions}>
                  <Button compact variant="secondary" icon="navigate-outline" title="Directions" onPress={() => void Linking.openURL(mapsUrl(b))} style={{ flex: 1 }} />
                  <Button compact variant="secondary" icon="call-outline" title="Call" onPress={() => void Linking.openURL(telUrl(b.phone))} style={{ flex: 1 }} />
                  <Button compact variant="secondary" icon="logo-whatsapp" title="" onPress={() => void Linking.openURL(whatsappUrl(b.phone))} />
                </View>
                <Button
                  compact
                  title="Book here"
                  onPress={() => {
                    start({ branchId: b.id });
                    router.push("/book/services");
                  }}
                />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 150, backgroundColor: colors.elevated },
  hours: { gap: 3, padding: space.md, borderRadius: radius.md, backgroundColor: colors.bg },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
});
