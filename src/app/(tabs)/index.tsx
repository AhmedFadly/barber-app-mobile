import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppointmentCard } from "@/components/appointment-card";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { ErrorState, Loading, SectionHeader } from "@/components/ui";
import { colors, fonts, radius, space, tierStyle } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useBookingDraft } from "@/lib/booking-draft";
import { useCatalog } from "@/lib/catalog";
import { aed, duration, greeting, shortDate } from "@/lib/format";
import type { Appointment, NewsSummary } from "@/lib/types";

const HERO = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=70&auto=format&fit=crop";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customer, refresh } = useAuth();
  const { catalog, error, reload } = useCatalog();
  const { start } = useBookingDraft();
  const [news, setNews] = useState<NewsSummary[] | null>(null);
  const [next, setNext] = useState<Appointment | null>(null);
  const [last, setLast] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    const [newsRes, apptRes] = await Promise.allSettled([api.news(), customer ? api.appointments() : Promise.resolve(null)]);
    if (newsRes.status === "fulfilled") setNews(newsRes.value.posts);
    if (apptRes.status === "fulfilled" && apptRes.value) {
      const now = Date.now();
      const list = apptRes.value.appointments;
      setNext(list.filter((a) => a.status === "CONFIRMED" && new Date(a.endsAt).getTime() > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0] ?? null);
      setLast(list.find((a) => a.status === "COMPLETED") ?? null);
    } else {
      setNext(null);
      setLast(null);
    }
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      void load();
      void refresh().catch(() => {});
    }, [load]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const book = (initial?: Parameters<typeof start>[0]) => {
    start(initial);
    router.push("/book");
  };

  if (error && !catalog) return <View style={styles.root}><ErrorState message={error} onRetry={reload} /></View>;

  const popular = catalog?.categories.flatMap((c) => c.services).filter((s) => s.popular) ?? [];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrap}>
        <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient colors={["rgba(11,11,12,0.45)", "rgba(11,11,12,0.35)", "rgba(11,11,12,0.85)", colors.bg]} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroTop, { paddingTop: insets.top + space.md }]}>
          <View>
            <Text style={styles.wordmark}>REGENT</Text>
            <Text style={styles.wordmarkSub}>GROOMING CO. · EST. 2026</Text>
          </View>
          {customer ? (
            <Pressable onPress={() => router.push("/rewards")} style={styles.tierPill}>
              <Ionicons name="diamond" size={12} color={tierStyle[customer.tier].accent} />
              <Text style={styles.tierPillText}>{customer.pointsBalance.toLocaleString("en-US")} pts</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push("/sign-in")} style={styles.tierPill}>
              <Text style={styles.tierPillText}>Sign in</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.heroBottom}>
          <Text variant="label">{customer ? `${greeting()}, ${customer.firstName}` : greeting()}</Text>
          <Text variant="hero">The art of the{"\n"}modern gentleman</Text>
          <Button title="Book an appointment" icon="calendar-outline" onPress={() => book()} style={{ alignSelf: "flex-start", marginTop: space.sm }} />
        </View>
      </View>

      <View style={styles.body}>
        {next ? (
          <View style={{ gap: space.md }}>
            <SectionHeader title="Your next visit" action="All bookings" onAction={() => router.push("/bookings")} />
            <AppointmentCard appointment={next} highlight onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: next.id } })} />
          </View>
        ) : null}

        <View style={styles.quickRow}>
          {[
            { icon: "refresh" as const, label: "Rebook", onPress: () => (last ? book({ branchId: last.branch.id, serviceIds: last.items.map((i) => i.serviceId), barberId: last.barber.id }) : book()) },
            { icon: "gift-outline" as const, label: "Gift cards", onPress: () => router.push("/gift-cards") },
            { icon: "location-outline" as const, label: "Locations", onPress: () => router.push("/locations") },
            { icon: "sparkles-outline" as const, label: "Rewards", onPress: () => router.push(customer ? "/rewards" : "/sign-in") },
          ].map((q) => (
            <Pressable key={q.label} onPress={q.onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
              <View style={styles.quickIcon}>
                <Ionicons name={q.icon} size={20} color={colors.gold} />
              </View>
              <Text variant="small" style={{ color: colors.text }}>
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {last && !next ? (
          <Pressable onPress={() => book({ branchId: last.branch.id, serviceIds: last.items.map((i) => i.serviceId), barberId: last.barber.id })} style={styles.rebook}>
            <Image source={last.barber.photoUrl} style={{ width: 44, height: 44, borderRadius: 22 }} />
            <View style={{ flex: 1 }}>
              <Text variant="subheading">Same again?</Text>
              <Text variant="small" numberOfLines={1}>
                {last.items.map((i) => i.name).join(" + ")} with {last.barber.name.split(" ")[0]}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.gold} />
          </Pressable>
        ) : null}

        <SectionHeader title="Signature services" action="Full menu" onAction={() => router.push("/services")} />
      </View>
      {!catalog ? (
        <Loading />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} decelerationRate="fast" snapToInterval={232}>
          {popular.map((s) => (
            <Pressable key={s.id} onPress={() => router.push({ pathname: "/service/[id]", params: { id: s.id } })} style={styles.serviceCard}>
              <Image source={s.imageUrl} style={styles.serviceImage} contentFit="cover" transition={200} />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={StyleSheet.absoluteFill} />
              <View style={styles.serviceText}>
                <Text variant="heading" numberOfLines={2}>
                  {s.name}
                </Text>
                <Text variant="small" style={{ color: colors.goldLight }}>
                  {aed(s.priceFils)} · {duration(s.durationMin)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.body}>
        <SectionHeader title="News & offers" />
        {news === null ? (
          <Loading />
        ) : (
          news.map((post, i) =>
            i === 0 ? (
              <Pressable key={post.id} onPress={() => router.push({ pathname: "/news/[id]", params: { id: post.id } })} style={styles.featured}>
                <Image source={post.imageUrl} style={styles.featuredImage} contentFit="cover" transition={200} />
                <View style={{ padding: space.lg, gap: 6 }}>
                  <Text variant="label">{post.tag}</Text>
                  <Text variant="heading">{post.title}</Text>
                  <Text variant="muted" numberOfLines={2}>
                    {post.summary}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable key={post.id} onPress={() => router.push({ pathname: "/news/[id]", params: { id: post.id } })} style={styles.newsRow}>
                <Image source={post.imageUrl} style={styles.newsThumb} contentFit="cover" transition={200} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text variant="label" style={{ fontSize: 10 }}>
                    {post.tag} · {shortDate(post.publishedAt)}
                  </Text>
                  <Text variant="subheading" numberOfLines={2}>
                    {post.title}
                  </Text>
                </View>
              </Pressable>
            ),
          )
        )}

        {catalog ? (
          <>
            <SectionHeader title="Meet the barbers" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg }} style={{ marginHorizontal: -space.xl }}>
              <View style={{ width: space.xl - space.lg }} />
              {catalog.barbers.map((b) => (
                <Pressable key={b.id} onPress={() => router.push({ pathname: "/barber/[id]", params: { id: b.id } })} style={{ alignItems: "center", width: 84, gap: 6 }}>
                  <Image source={b.photoUrl} style={styles.barberPhoto} contentFit="cover" transition={200} />
                  <Text variant="small" numberOfLines={1} style={{ color: colors.text }}>
                    {b.name.split(" ")[0]}
                  </Text>
                </Pressable>
              ))}
              <View style={{ width: space.xl - space.lg }} />
            </ScrollView>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroWrap: { height: 470, justifyContent: "space-between" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: space.xl },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 26, letterSpacing: 7, color: colors.text },
  wordmarkSub: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 2.4, color: colors.goldLight, marginTop: -2 },
  tierPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 34, borderRadius: radius.pill, backgroundColor: "rgba(11,11,12,0.6)", borderWidth: 1, borderColor: "rgba(230,203,143,0.3)" },
  tierPillText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.text },
  heroBottom: { paddingHorizontal: space.xl, gap: space.sm, paddingBottom: space.md },
  body: { paddingHorizontal: space.xl, gap: space.lg, marginTop: space.lg },
  quickRow: { flexDirection: "row", justifyContent: "space-between" },
  quick: { alignItems: "center", gap: 8, width: 76 },
  quickIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  rebook: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  carousel: { paddingHorizontal: space.xl, gap: space.md, paddingTop: space.md },
  serviceCard: { width: 220, height: 280, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface },
  serviceImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  serviceText: { position: "absolute", left: space.lg, right: space.lg, bottom: space.lg, gap: 4 },
  featured: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  featuredImage: { height: 190, backgroundColor: colors.elevated },
  newsRow: { flexDirection: "row", gap: space.md, alignItems: "center" },
  newsThumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.elevated },
  barberPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: colors.goldDeep, backgroundColor: colors.elevated },
});
