import { useLocalSearchParams } from "expo-router";
import { Pressable } from "react-native";
import { useConfirm } from "@/components/Confirm";
import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useSafetyStore } from "@/store/extras";

// Emergency contacts (called from SOS) and trip-sharing contacts (get the live trip link).
const Contacts = () => {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const k = kind === "share" ? "share" : "emergency";
  const list = useSafetyStore((s) => s[k]);
  const { add, remove } = useSafetyStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [ask, dialog] = useConfirm();

  const save = () => {
    if (!name.trim()) return setErr("Enter a name.");
    if (phone.replace(/\D/g, "").length < 10) return setErr("Enter a valid 10-digit phone number.");
    add(k, name.trim(), phone.replace(/\D/g, ""));
    setName("");
    setPhone("");
    setErr("");
    setOk(`${name.trim()} added.`);
  };

  return (
    <Page title={k === "share" ? "Share trip location" : "Emergency contacts"}>
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>
        {k === "share" ? "People you add here get a live link to your trip with the driver, vehicle and route, so they can follow along." : "These people are called or messaged when you press the emergency button during a ride."}
      </T>
      {list.length === 0 && <T style={{ marginTop: 22, color: colors.muted }}>Nobody added yet.</T>}
      {list.map((c) => (
        <Row key={c.id} style={{ gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
            <T style={{ fontFamily: font.bold, fontSize: 18 }}>{c.name[0]?.toUpperCase()}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{c.name}</T>
            <T style={{ color: colors.muted }}>+91 {c.phone}</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${c.name}`} hitSlop={8} onPress={() => ask({ title: `Remove ${c.name}?`, message: "They will no longer be contacted or get your trip link.", confirm: "Remove", destructive: true, onConfirm: () => remove(k, c.id) })} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="trash-outline" size={22} color={colors.red} />
          </Pressable>
        </Row>
      ))}
      <T style={{ fontFamily: font.bold, fontSize: 20, marginTop: 26, marginBottom: 10 }}>Add a person</T>
      <Field value={name} onChangeText={setName} placeholder="Name" />
      <Field value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" maxLength={10} style={{ marginTop: 10 }} />
      {!!err && <T style={{ color: colors.red, marginTop: 8 }}>{err}</T>}
      {!!ok && !err && <T style={{ color: colors.green, marginTop: 8, fontFamily: font.semi }}>{ok}</T>}
      {dialog}
      <Button title="Add" onPress={save} style={{ marginTop: 14 }} />
    </Page>
  );
};

export default Contacts;
