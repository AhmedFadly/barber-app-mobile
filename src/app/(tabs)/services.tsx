import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceRow } from "@/components/service-row";
import { Text } from "@/components/text";
import { Chip, ErrorState, Loading } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { useCatalog } from "@/lib/catalog";

export default function Services() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { catalog, error, reload } = useCatalog();
  const [active, setActive] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (!catalog) return <View style={styles.root}>{error ? <ErrorState message={error} onRetry={reload} /> : <Loading />}</View>;
  const categories = active ? catalog.categories.filter((c) => c.id === active) : catalog.categories;

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, gap: 2 }}>
        <Text variant="label">The menu</Text>
        <Text variant="title">Services</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
        <Chip label="All" selected={!active} onPress={() => setActive(null)} />
        {catalog.categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={active === c.id}
            onPress={() => {
              setActive(c.id);
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }}
          />
        ))}
      </ScrollView>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + 110, gap: space.md }} showsVerticalScrollIndicator={false}>
        {categories.map((c) => (
          <View key={c.id} style={{ gap: space.md, marginBottom: space.md }}>
            <Text variant="heading" style={{ marginTop: space.sm }}>
              {c.name}
            </Text>
            {c.services.map((s) => (
              <ServiceRow key={s.id} service={s} onPress={() => router.push({ pathname: "/service/[id]", params: { id: s.id } })} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chips: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.sm },
});
