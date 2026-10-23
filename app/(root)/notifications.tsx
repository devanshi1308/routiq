import { useState } from "react";
import { Platform, Switch, View } from "react-native";

import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { askNotifyPermission, rescheduleAll, sendTest } from "@/lib/notify";
import { useNotifyStore } from "@/store/extras";

const KINDS = [
  ["rides", "Ride updates", "Driver accepted, driver arrived, trip finished. Only when the app is closed."],
  ["commute", "Commute reminders", "A nudge at the time of each daily commute you set up."],
  ["nudges", "Fun reminders", "A cheeky message every other day at 6:30pm. Never between 10pm and 8am."],
] as const;

// Choose which notifications reach your phone.
const Notifications = () => {
  const n = useNotifyStore();
  const [msg, setMsg] = useState("");
  const web = Platform.OS === "web";

  const allow = async () => {
    const ok = await askNotifyPermission();
    if (ok) await rescheduleAll();
    setMsg(ok ? "Notifications are on." : "Notifications are blocked. Turn them on for Routiq in your phone's settings.");
  };
  const test = async () => setMsg((await sendTest()) ? "Sent. Look at the top of your screen." : "Allow notifications first.");

  return (
    <Page title="Notifications">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Short, friendly messages about your rides. You choose which ones you get.</T>
      {web && <T style={{ color: colors.red, marginTop: 12, fontFamily: font.semi }}>Notifications work in the phone app, not in the browser.</T>}
      {KINDS.map(([k, label, desc]) => (
        <Row key={k} style={{ gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{label}</T>
            <T style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{desc}</T>
          </View>
          <Switch value={n[k]} onValueChange={(v) => n.set(k, v)} trackColor={{ true: colors.green }} />
        </Row>
      ))}
      <Button title="Allow notifications" onPress={allow} style={{ marginTop: 20 }} />
      <Button title="Send me a test" variant="grey" onPress={test} style={{ marginTop: 10 }} />
      {!!msg && <T style={{ color: colors.green, fontFamily: font.semi, marginTop: 10 }}>{msg}</T>}
    </Page>
  );
};

export default Notifications;
