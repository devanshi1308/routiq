import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import Vehicle, { VehicleKind } from "@/components/Vehicle";
import Ionicons from "@/components/Icon";
import { Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useHistoryStore } from "@/store";
import { FAQ } from "./help-topic";

const ICONS: Record<string, string> = {
  Account: "person-outline",
  "Ride problems": "car-outline",
  "Payments and wallet": "wallet-outline",
  "Cancellation policy": "close-circle-outline",
  "Safety and emergencies": "shield-outline",
  "Maps and routes": "map-outline",
  Accessibility: "accessibility-outline",
  "Grievance redressal": "document-text-outline",
};

const Help = () => {
  const rides = useHistoryStore((s) => s.rides).slice(0, 3);
  const [q, setQ] = useState("");
  const open = (t: string) => router.push({ pathname: "/(root)/help-topic", params: { t } } as any);
  const topics = Object.keys(FAQ);
  // search the questions as well as the topic names
  const hits = q.trim() ? topics.filter((t) => `${t} ${FAQ[t].map((x) => x.join(" ")).join(" ")}`.toLowerCase().includes(q.toLowerCase())) : topics;
  return (
    <Page title="Help">
      <Field value={q} onChangeText={setQ} placeholder="Search help" style={{ marginTop: 16 }} />
      {rides.length > 0 && !q && (
        <>
          <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 24, marginBottom: 8 }}>Help with a ride</T>
          {rides.map((r) => (
            <Row key={r.id} onPress={() => open("Ride problems")} style={{ gap: 14, paddingVertical: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
                <Vehicle kind={r.emoji as VehicleKind} size={34} />
              </View>
              <View style={{ flex: 1 }}>
                <T numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 17 }}>{r.place}</T>
                <T style={{ color: colors.muted }}>{r.date} · ₹{r.fare.toFixed(0)}</T>
              </View>
            </Row>
          ))}
        </>
      )}
      <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 24, marginBottom: 4 }}>Help topics</T>
      {hits.length === 0 && <T style={{ color: colors.muted, marginTop: 8 }}>Nothing matches “{q}”.</T>}
      {hits.map((t) => (
        <Row key={t} onPress={() => open(t)} style={{ gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name={ICONS[t] as any} size={24} />
          <T style={{ flex: 1, fontFamily: font.semi, fontSize: 18 }}>{t}</T>
        </Row>
      ))}
    </Page>
  );
};

export default Help;
