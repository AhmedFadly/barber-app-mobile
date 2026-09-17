import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Screen } from "@/components/screen";
import { Steps } from "@/components/steps";
import { Text } from "@/components/text";
import { Loading } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";

export default function ChooseBarber() {
  const router = useRouter();
  const { catalog } = useCatalog();
  const { draft, update } = useBookingDraft();
  if (!catalog) return <Screen back title="Barber"><Loading /></Screen>;

  const barbers = catalog.barbers.filter((b) => b.branchId === draft.branchId && draft.serviceIds.every((id) => b.serviceIds.includes(id)));
  const choose = (barberId: string | null) => {
    if (barberId !== draft.barberId) update({ barberId, slot: null });
    router.push("/book/time");
  };

  return (
    <Screen back eyebrow="Who would you like?" title="Choose your barber">
      <Steps current={2} />
      <Pressable onPress={() => choose(null)} style={({ pressed }) => [styles.row, draft.barberId === null && styles.selected, pressed && { opacity: 0.85 }]}>
        <View style={styles.any}>
          <Ionicons name="people" size={26} color={colors.gold} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="subheading">Any available barber</Text>
          <Text variant="small">See the most times — we&apos;ll match you with a top barber</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Pressable>
      {barbers.map((b) => (
        <Pressable key={b.id} onPress={() => choose(b.id)} style={({ pressed }) => [styles.row, draft.barberId === b.id && styles.selected, pressed && { opacity: 0.85 }]}>
          <Image source={b.photoUrl} style={styles.photo} contentFit="cover" transition={200} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="subheading">{b.name}</Text>
            <Text variant="small">{b.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Ionicons name="star" size={12} color={colors.gold} />
              <Text variant="small" style={{ color: colors.text }}>
                {b.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <Pressable hitSlop={10} onPress={() => router.push({ pathname: "/barber/[id]", params: { id: b.id } })}>
            <Ionicons name="information-circle-outline" size={22} color={colors.muted} />
          </Pressable>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  selected: { borderColor: colors.gold },
  photo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.elevated },
  any: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.goldDeep },
});
