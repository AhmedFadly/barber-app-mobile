import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import { Text } from "@/components/text";
import { ErrorState, Loading } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { dateKey, dateKeyParts, hhmmTo12 } from "@/lib/format";

export default function ChooseBranch() {
  const router = useRouter();
  const { catalog, error, reload } = useCatalog();
  const { draft, update } = useBookingDraft();
  const today = dateKeyParts(dateKey()).weekdayIndex;

  return (
    <Screen back eyebrow="Book an appointment" title="Choose a location">
      <Steps current={0} />
      {!catalog ? (
        error ? <ErrorState message={error} onRetry={reload} /> : <Loading />
      ) : (
        catalog.branches.map((b) => {
          const hours = b.openingHours.find((h) => h.weekday === today);
          const selected = draft.branchId === b.id;
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                const barber = catalog.barbers.find((x) => x.id === draft.barberId);
                const branchChanged = draft.branchId !== b.id;
                update({ branchId: b.id, slot: branchChanged ? null : draft.slot, barberId: barber && barber.branchId !== b.id ? null : draft.barberId });
                router.push("/book/services");
              }}
              style={({ pressed }) => [styles.card, selected && styles.selected, pressed && { opacity: 0.85 }]}>
              <Image source={b.imageUrl} style={styles.image} contentFit="cover" transition={200} />
              <View style={{ flex: 1, gap: 4, padding: space.md }}>
                <Text variant="label" style={{ fontSize: 10 }}>
                  {b.area}
                </Text>
                <Text variant="heading">{b.name}</Text>
                <Text variant="small" numberOfLines={1}>
                  {b.address}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <View style={[styles.dot, { backgroundColor: hours ? colors.success : colors.danger }]} />
                  <Text variant="small" style={{ color: colors.text }}>
                    {hours ? `Today ${hhmmTo12(hours.open)} – ${hhmmTo12(hours.close)}` : "Closed today"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} style={{ marginRight: space.md }} />
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  selected: { borderColor: colors.gold },
  image: { width: 104, alignSelf: "stretch", minHeight: 118, backgroundColor: colors.elevated },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
