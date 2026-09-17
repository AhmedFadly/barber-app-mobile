import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Field } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { useAuth } from "@/lib/auth";

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "+971 ", password: "", marketingOptIn: true });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signUp({ ...form, phone: form.phone.trim() });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const ready = form.firstName && form.lastName && form.email && form.phone.length > 8 && form.password.length >= 8;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen back eyebrow="Join REGENT" title="Create your account">
        <Text variant="muted">Earn points on every visit and unlock Gold and Black member benefits.</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="First name" value={form.firstName} onChangeText={set("firstName")} autoComplete="given-name" textContentType="givenName" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Last name" value={form.lastName} onChangeText={set("lastName")} autoComplete="family-name" textContentType="familyName" />
          </View>
        </View>
        <Field label="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Field label="Mobile number" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
        <Field label="Password" value={form.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="At least 8 characters" />
        <View style={styles.optIn}>
          <Text variant="muted" style={{ flex: 1 }}>
            Send me news, offers and new-branch openings
          </Text>
          <Switch value={form.marketingOptIn} onValueChange={set("marketingOptIn")} trackColor={{ true: colors.gold, false: colors.line }} thumbColor={colors.text} />
        </View>
        {error ? (
          <Text variant="small" style={{ color: colors.danger }}>
            {error}
          </Text>
        ) : null}
        <Button title="Create account" loading={loading} disabled={!ready} onPress={submit} />
        <View style={styles.switch}>
          <Text variant="muted">Already a member?</Text>
          <Link href="/sign-in" replace>
            <Text variant="body" style={{ color: colors.gold }}>
              Sign in
            </Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md },
  optIn: { flexDirection: "row", alignItems: "center", gap: space.md },
  switch: { flexDirection: "row", justifyContent: "center", gap: 6, paddingBottom: space.lg },
});
