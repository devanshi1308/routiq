import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { useConfirm } from "@/components/Confirm";
import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useThemeStore } from "@/lib/theme";
import { useAuthStore, useHistoryStore } from "@/store";
import { DocKey, useDriverStore } from "@/store/extras";

const DOCS: { k: DocKey; label: string }[] = [
  { k: "licence", label: "Driving licence" },
  { k: "rc", label: "Vehicle registration (RC)" },
  { k: "insurance", label: "Vehicle insurance" },
  { k: "police", label: "Police verification" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <>
    <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 28, marginBottom: 6 }}>{title}</T>
    {children}
  </>
);

// The driver's own account: profile, vehicle, documents, earnings, payout, appearance and log out.
const DriverAccount = () => {
  const { name, phone, vehicle, plate, signOut } = useAuthStore();
  const rides = useHistoryStore((s) => s.rides);
  const { upi, setUpi, docs, toggleDoc, gender, setGender } = useDriverStore();
  const { mode, setMode } = useThemeStore();
  const [v, setV] = useState(vehicle);
  const [pl, setPl] = useState(plate);
  const [upiText, setUpiText] = useState(upi);
  const [saved, setSaved] = useState("");
  const [ask, dialog] = useConfirm();
  const total = rides.reduce((t, r) => t + r.fare, 0);
  const verified = Object.values(docs).filter(Boolean).length;

  return (
    <Page title="My account">
      {dialog}
      <Row style={{ gap: 14, marginTop: 18 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
          <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 26 }}>{name[0]}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.extra, fontSize: 24 }}>{name}</T>
          <T style={{ color: colors.muted }}>+91 {phone}</T>
        </View>

      </Row>

      <Row style={{ gap: 12, marginTop: 18 }}>
        {[["Trips", String(rides.length)], ["Earned", `₹${total.toFixed(0)}`], ["Documents", `${verified}/4`]].map(([l, val]) => (
          <View key={l} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 }}>
            <T style={{ color: colors.muted, fontSize: 12 }}>{l}</T>
            <T style={{ fontFamily: font.extra, fontSize: 22, marginTop: 2 }}>{val}</T>
          </View>
        ))}
      </Row>

      <Section title="About you">
        <Row style={{ gap: 8 }}>
          {([["woman", "Woman"], ["man", "Man"], ["na", "Prefer not to say"]] as const).map(([g, l]) => (
            <Pressable key={g} onPress={() => setGender(g)} style={{ flex: 1, minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, backgroundColor: gender === g ? colors.ink : colors.card }}>
              <T style={{ fontFamily: font.semi, fontSize: 14, textAlign: "center", color: gender === g ? colors.onInk : colors.text }}>{l}</T>
            </Pressable>
          ))}
        </Row>
        <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Women drivers also receive Women Rider requests. Riders never see this setting.</T>
      </Section>

      <Section title="Vehicle">
        <Field value={v} onChangeText={setV} placeholder="Vehicle (e.g. Bajaj RE Auto)" />
        <Field value={pl} onChangeText={(t) => setPl(t.toUpperCase())} placeholder="Number plate" autoCapitalize="characters" style={{ marginTop: 10 }} />
        <Button title="Save vehicle" variant="grey" disabled={!v.trim() || !pl.trim()} onPress={() => { useAuthStore.setState({ vehicle: v.trim(), plate: pl.trim() }); setSaved("Vehicle details saved."); }} style={{ marginTop: 10 }} />
      </Section>

      <Section title="Documents">
        {DOCS.map((d) => (
          <Row key={d.k} onPress={() => toggleDoc(d.k)} style={{ gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Ionicons name={docs[d.k] ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={docs[d.k] ? colors.green : colors.muted} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.semi, fontSize: 16 }}>{d.label}</T>
              <T style={{ color: docs[d.k] ? colors.green : colors.muted, fontSize: 13 }}>{docs[d.k] ? "Verified" : "Tap to upload"}</T>
            </View>
          </Row>
        ))}
        <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Uploads are simulated here. A real app would open the camera and wait for review.</T>
      </Section>

      <Section title="Payout">
        <Field value={upiText} onChangeText={setUpiText} placeholder="UPI ID (name@bank)" autoCapitalize="none" />
        <Button title="Save payout details" variant="grey" disabled={!/^[\w.-]+@[\w]+$/.test(upiText.trim())} onPress={() => { setUpi(upiText.trim()); setSaved("Payout UPI saved."); }} style={{ marginTop: 10 }} />
      </Section>

      <Section title="Recent trips">
        {rides.length === 0 && <T style={{ color: colors.muted }}>No trips yet.</T>}
        {rides.slice(0, 5).map((r) => (
          <Row key={r.id} style={{ justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.semi, fontSize: 16 }} numberOfLines={1}>{r.place}</T>
              <T style={{ color: colors.muted, fontSize: 13 }}>{r.date}</T>
            </View>
            <T style={{ fontFamily: font.bold }}>₹{r.fare.toFixed(0)}</T>
          </Row>
        ))}
      </Section>

      <Section title="Appearance">
        <Row style={{ backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
          {(["system", "light", "dark"] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, height: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: mode === m ? colors.ink : "transparent" }}>
              <T style={{ fontFamily: font.semi, color: mode === m ? colors.onInk : colors.text }}>{m === "system" ? "Auto" : m === "light" ? "Light" : "Dark"}</T>
            </Pressable>
          ))}
        </Row>
      </Section>

      <Row onPress={() => router.push("/(root)/help" as any)} style={{ gap: 12, paddingVertical: 18, marginTop: 14 }}>
        <Ionicons name="help-buoy-outline" size={24} />
        <T style={{ flex: 1, fontFamily: font.semi, fontSize: 17 }}>Help</T>
      </Row>

      {!!saved && <T style={{ color: colors.green, fontFamily: font.semi, marginTop: 6 }}>{saved}</T>}

      <Pressable accessibilityRole="button" onPress={() => ask({ title: "Log out?", message: "You will stop receiving ride requests.", confirm: "Log out", destructive: true, onConfirm: () => { signOut(); router.replace("/(auth)/welcome"); } })} style={{ marginTop: 18, height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: colors.red, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Ionicons name="log-out-outline" size={24} color={colors.red} />
        <T style={{ fontFamily: font.bold, color: colors.red, fontSize: 18 }}>Log out</T>
      </Pressable>
    </Page>
  );
};

export default DriverAccount;
