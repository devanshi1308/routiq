import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useAuthStore } from "@/store";
import { useSafetyStore } from "@/store/extras";

// Account checkup: four quick steps. Each one ticks itself off once it is done.
const Checkup = () => {
  const { email, phone } = useAuthStore();
  const { emergency, rideCheck, setRideCheck, twoStep, setFlag } = useSafetyStore();
  const [mail, setMail] = useState(email);
  const [saved, setSaved] = useState(!!email);
  const valid = /^\S+@\S+\.\S+$/.test(mail);

  const steps = [
    { done: !!phone, t: "Phone number verified", d: phone ? `+91 ${phone}` : "Sign in with your number" },
    { done: saved, t: "Add a backup email", d: "Helps you get back in if you lose your phone." },
    { done: emergency.length > 0, t: "Add an emergency contact", d: "Someone we can reach if you need help.", to: "/(root)/contacts?kind=emergency" },
    { done: rideCheck, t: "Turn on RideCheck", d: "We check in if a trip looks unusual.", act: () => setRideCheck(true) },
    { done: twoStep, t: "Turn on 2-step verification", d: "A code is asked when you sign in on a new phone.", act: () => setFlag("twoStep", true) },
  ];
  const n = steps.filter((s) => s.done).length;

  return (
    <Page title="Account checkup">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16 }}>{n} of {steps.length} done</T>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.card, marginTop: 10 }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.green, width: `${(n / steps.length) * 100}%` }} />
      </View>
      {steps.map((s) => (
        <Row key={s.t} onPress={() => !s.done && (s.to ? router.push(s.to as any) : s.act?.())} style={{ gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name={s.done ? "checkmark-circle" : "ellipse-outline"} size={28} color={s.done ? colors.green : colors.muted} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{s.t}</T>
            <T style={{ color: colors.muted }}>{s.d}</T>
          </View>
          {!s.done && (s.to || s.act) && <T style={{ color: colors.blue, fontFamily: font.bold }}>{s.to ? "Add" : "Turn on"}</T>}
        </Row>
      ))}
      {!saved && (
        <>
          <Field value={mail} onChangeText={setMail} placeholder="Backup email" keyboardType="email-address" autoCapitalize="none" style={{ marginTop: 16 }} />
          <Button title="Save email" disabled={!valid} onPress={() => { useAuthStore.setState({ email: mail.trim() }); setSaved(true); }} style={{ marginTop: 10 }} />
        </>
      )}
      {n === steps.length && <T style={{ color: colors.green, fontFamily: font.bold, fontSize: 18, marginTop: 20 }}>All done. Your account is in good shape.</T>}
    </Page>
  );
};

export default Checkup;
