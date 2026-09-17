import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { ServiceRow } from "@/components/service-row";
import { Text } from "@/components/text";
import { Loading } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";

export default function BarberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { catalog, serviceById } = useCatalog();
  const { start } = useBookingDraft();
  const barber = catalog?.barbers.find((b) => b.id === id);
  if (!catalog || !barber) return <Screen back><Loading /></Screen>;

  const branch = catalog.branches.find((b) => b.id === barber.branchId);
  const signature = barber.serviceIds.map(serviceById).filter((s) => !!s && s.popular);

  return (
    <Screen
      back
      footer={
        <Button
          title={`Book with ${barber.name.split(" ")[0]}`}
          icon="calendar-outline"
          onPress={() => {
            start({ branchId: barber.branchId, barberId: barber.id });
            router.push("/book/services");
          }}
        />
      }>
      <View style={styles.hero}>
        <Image source={barber.photoUrl} style={styles.photo} contentFit="cover" transition={200} />
        <Text variant="label">{barber.title}</Text>
        <Text variant="title">{barber.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={styles.meta}>
            <Ionicons name="star" size={14} color={colors.gold} />
            <Text variant="small" style={{ color: colors.text }}>
              {barber.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={14} color={colors.gold} />
            <Text variant="small" style={{ color: colors.text }}>
              REGENT {branch?.name}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="body" style={{ color: "#D8D4CB", textAlign: "center", lineHeight: 24 }}>
        {barber.bio}
      </Text>
      {signature.length ? (
        <>
          <Text variant="heading" style={{ marginTop: space.md }}>
            Signature services
          </Text>
          {signature.map((s) => (
            <ServiceRow key={s!.id} service={s!} onPress={() => router.push({ pathname: "/service/[id]", params: { id: s!.id } })} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 6 },
  photo: { width: 148, height: 148, borderRadius: 74, borderWidth: 2, borderColor: colors.goldDeep, marginBottom: space.md, backgroundColor: colors.elevated },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
});
