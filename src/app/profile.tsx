import { useRouter } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { Field } from "@/components/ui";
import { colors } from "@/constants/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const router = useRouter();
  const { customer, setCustomer } = useAuth();
  const [form, setForm] = useState({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
    birthday: customer?.birthday ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!customer) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { customer: updated } = await api.updateMe({ ...form, birthday: form.birthday.trim() || null });
      setCustomer(updated);
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen back eyebrow="Account" title="Personal details" footer={<Button title="Save changes" loading={saving} onPress={save} />}>
      <Field label="First name" value={form.firstName} onChangeText={(firstName) => setForm((f) => ({ ...f, firstName }))} />
      <Field label="Last name" value={form.lastName} onChangeText={(lastName) => setForm((f) => ({ ...f, lastName }))} />
      <Field label="Mobile number" value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm((f) => ({ ...f, phone }))} />
      <Field label="Birthday (YYYY-MM-DD) — for your birthday treat" value={form.birthday} placeholder="1990-05-21" onChangeText={(birthday) => setForm((f) => ({ ...f, birthday }))} />
      <Field label="Email" value={customer.email} editable={false} style={{ opacity: 0.6 }} />
      {error ? (
        <Text variant="small" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
