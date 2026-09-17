import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { ErrorState, Loading } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { api } from "@/lib/api";
import { useBookingDraft } from "@/lib/booking-draft";
import { longDate } from "@/lib/format";
import type { NewsPost } from "@/lib/types";

export default function NewsDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { start } = useBookingDraft();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.newsPost(id).then((r) => setPost(r.post), (e: Error) => setError(e.message));
  }, [id]);

  return (
    <View style={styles.root}>
      {error ? (
        <ErrorState message={error} />
      ) : !post ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
          <View style={{ height: 340 }}>
            <Image source={post.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            <LinearGradient colors={["rgba(11,11,12,0.4)", "transparent", colors.bg]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          </View>
          <View style={styles.body}>
            <Text variant="label">
              {post.tag} · {longDate(post.publishedAt)}
            </Text>
            <Text variant="title">{post.title}</Text>
            <Text variant="body" style={{ fontSize: 16.5, lineHeight: 26, color: colors.goldLight }}>
              {post.summary}
            </Text>
            {post.body.split(/\n\s*\n/).map((para, i) => (
              <Text key={i} variant="body" style={{ lineHeight: 25, color: "#D8D4CB" }}>
                {para.trim()}
              </Text>
            ))}
            <Button
              title="Book an appointment"
              icon="calendar-outline"
              style={{ marginTop: space.lg }}
              onPress={() => {
                start();
                router.push("/book");
              }}
            />
          </View>
        </ScrollView>
      )}
      <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + space.sm }]} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: space.xl, gap: space.md, marginTop: -30 },
  back: { position: "absolute", left: space.xl, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(11,11,12,0.7)", alignItems: "center", justifyContent: "center" },
});
