import { Tabs } from "expo-router/js-tabs";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fonts } from "@/constants/theme";
import { useBookingDraft } from "@/lib/booking-draft";

type IconName = keyof typeof Ionicons.glyphMap;
function icon(name: IconName, active: IconName) {
  return function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={22} color={color} />;
  };
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { start } = useBookingDraft();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10.5, letterSpacing: 0.3 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(11,11,12,0.97)",
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 10,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home-outline", "home") }} />
      <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: icon("cut-outline", "cut") }} />
      <Tabs.Screen
        name="book-tab"
        options={{
          title: "Book",
          tabBarButton: ({ onPress }) => (
            <View style={styles.bookWrap}>
              <Pressable accessibilityRole="button" accessibilityLabel="Book an appointment" onPress={onPress} style={({ pressed }) => [styles.bookButton, pressed && { transform: [{ scale: 0.95 }] }]}>
                <Ionicons name="calendar" size={24} color={colors.onGold} />
              </Pressable>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            start();
            router.push("/book");
          },
        }}
      />
      <Tabs.Screen name="bookings" options={{ title: "Bookings", tabBarIcon: icon("receipt-outline", "receipt") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("person-circle-outline", "person-circle") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bookWrap: { flex: 1, alignItems: "center" },
  bookButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -22,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.bg,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
