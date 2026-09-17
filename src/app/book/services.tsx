import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { ServiceRow } from "@/components/service-row";
import { Steps } from "@/components/steps";
import { Text } from "@/components/text";
import { Loading } from "@/components/ui";
import { space } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { aed, duration } from "@/lib/format";

export default function ChooseServices() {
  const router = useRouter();
  const { catalog, serviceById } = useCatalog();
  const { draft, toggleService, update } = useBookingDraft();

  if (!catalog || !draft.branchId) return <Screen back title="Services"><Loading /></Screen>;

  // Only offer services someone at this branch can actually do.
  const branchBarbers = catalog.barbers.filter((b) => b.branchId === draft.branchId);
  const offered = new Set(branchBarbers.flatMap((b) => b.serviceIds));
  const picked = draft.serviceIds.map(serviceById).filter((s) => !!s);
  const total = picked.reduce((s, x) => s + x.priceFils, 0);
  const minutes = picked.reduce((s, x) => s + x.durationMin, 0);
  const capable = branchBarbers.filter((b) => draft.serviceIds.every((id) => b.serviceIds.includes(id)));
  const branchName = catalog.branches.find((b) => b.id === draft.branchId)?.name;

  return (
    <Screen
      back
      eyebrow={branchName}
      title="Choose services"
      footer={
        <>
          {picked.length > 0 && capable.length === 0 ? (
            <Text variant="small" style={{ textAlign: "center" }}>
              No single barber here offers all of these together. Try removing one.
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
            <View style={{ flex: 1 }}>
              <Text variant="subheading">{picked.length ? aed(total) : "Select a service"}</Text>
              {picked.length ? (
                <Text variant="small">
                  {picked.length} service{picked.length > 1 ? "s" : ""} · {duration(minutes)}
                </Text>
              ) : null}
            </View>
            <Button
              title="Continue"
              disabled={!picked.length || capable.length === 0}
              onPress={() => {
                if (draft.barberId && !capable.some((b) => b.id === draft.barberId)) update({ barberId: null });
                router.push("/book/barber");
              }}
              style={{ minWidth: 150 }}
            />
          </View>
        </>
      }>
      <Steps current={1} />
      {catalog.categories.map((c) => {
        const services = c.services.filter((s) => offered.has(s.id));
        if (!services.length) return null;
        return (
          <View key={c.id} style={{ gap: space.md }}>
            <Text variant="heading" style={{ marginTop: space.sm }}>
              {c.name}
            </Text>
            {services.map((s) => (
              <ServiceRow key={s.id} service={s} selectable selected={draft.serviceIds.includes(s.id)} onPress={() => toggleService(s.id)} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
