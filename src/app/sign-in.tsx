import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Field } from "@/components/ui";
import { colors, fonts, space } from "@/constants/theme";
import { useAuth } from "@/lib/auth";

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen back>
        <View style={styles.brand}>
          <Text style={styles.wordmark}>REGENT</Text>
          <Text variant="label">Grooming Co.</Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text variant="title">Welcome back</Text>
          <Text variant="muted">Sign in to book, manage appointments and collect points.</Text>
        </View>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" placeholder="••••••••" onSubmitEditing={submit} />
        {error ? (
          <Text variant="small" style={{ color: colors.danger }}>
            {error}
          </Text>
        ) : null}
        <Button title="Sign in" loading={loading} disabled={!email || !password} onPress={submit} />
        <View style={styles.switch}>
          <Text variant="muted">New to REGENT?</Text>
          <Link href="/sign-up" replace>
            <Text variant="body" style={{ color: colors.gold }}>
              Create an account
            </Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", paddingVertical: space.xxl, gap: 2 },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 40, letterSpacing: 10, color: colors.text },
  switch: { flexDirection: "row", justifyContent: "center", gap: 6 },
});
