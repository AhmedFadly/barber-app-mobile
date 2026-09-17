import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { Loading } from "@/components/ui";
import { colors, radius, space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { aed, duration } from "@/lib/format";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { catalog, serviceById } = useCatalog();
  const { start } = useBookingDraft();
  const service = serviceById(id);
  if (!catalog || !service) return <View style={styles.root}><Loading /></View>;

  const barbers = catalog.barbers.filter((b) => b.serviceIds.includes(service.id));
  const branches = catalog.branches.filter((br) => barbers.some((b) => b.branchId === br.id));

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 380 }}>
          <Image source={service.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient colors={["rgba(11,11,12,0.4)", "transparent", colors.bg]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        </View>
        <View style={styles.body}>
          <Text variant="label">{catalog.categories.find((c) => c.services.some((s) => s.id === service.id))?.name}</Text>
          <Text variant="hero">{service.name}</Text>
          <View style={styles.meta}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={14} color={colors.gold} />
              <Text variant="small" style={{ color: colors.text }}>
                {duration(service.durationMin)}
              </Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="pricetag-outline" size={14} color={colors.gold} />
              <Text variant="small" style={{ color: colors.text }}>
                {aed(service.priceFils)}
              </Text>
            </View>
          </View>
          <Text variant="body" style={{ color: "#D8D4CB", lineHeight: 24 }}>
            {service.description}
          </Text>
          <Text variant="heading" style={{ marginTop: space.md }}>
            Available at
          </Text>
          <Text variant="muted">{branches.map((b) => b.name).join(" · ")}</Text>
          <Text variant="heading" style={{ marginTop: space.md }}>
            Barbers offering this
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg }}>
            {barbers.map((b) => (
              <Pressable key={b.id} onPress={() => router.push({ pathname: "/barber/[id]", params: { id: b.id } })} style={{ alignItems: "center", gap: 6, width: 72 }}>
                <Image source={b.photoUrl} style={{ width: 60, height: 60, borderRadius: 30 }} />
                <Text variant="small" numberOfLines={1}>
                  {b.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + space.sm }]} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Button
          title={`Book · ${aed(service.priceFils)}`}
          icon="calendar-outline"
          onPress={() => {
            start({ serviceIds: [service.id], branchId: branches.length === 1 ? branches[0].id : null });
            router.push(branches.length === 1 ? "/book/barber" : "/book");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: space.xl, gap: space.md, marginTop: -40 },
  meta: { flexDirection: "row", gap: space.sm },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 32, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  back: { position: "absolute", left: space.xl, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(11,11,12,0.7)", alignItems: "center", justifyContent: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
