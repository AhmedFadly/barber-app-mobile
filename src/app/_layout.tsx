import { CormorantGaramond_500Medium_Italic, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold, useFonts } from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import * as Notifications from "expo-notifications";
import { DarkTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import { colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BookingDraftProvider } from "@/lib/booking-draft";
import { CatalogProvider } from "@/lib/catalog";

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.gold, text: colors.text, border: colors.line },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <CatalogProvider>
          <BookingDraftProvider>
            <StatusBar style="light" />
            {fontsLoaded ? <RootStack /> : null}
          </BookingDraftProvider>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Tapping a notification opens the booking or news post it refers to.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { appointmentId?: string; newsId?: string };
      if (data.appointmentId) router.push({ pathname: "/appointment/[id]", params: { id: data.appointmentId } });
      else if (data.newsId) router.push({ pathname: "/news/[id]", params: { id: data.newsId } });
    });
    return () => sub.remove();
  }, [router]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="sign-up" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="pay" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: false }} />
      <Stack.Screen name="booking-confirmed" options={{ animation: "fade", gestureEnabled: false }} />
    </Stack>
  );
}
