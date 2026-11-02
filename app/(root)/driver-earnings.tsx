import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useHistoryStore } from "@/store";
import { useDriverStore } from "@/store/extras";

const FEE = 0.1; // Routiq keeps 10% of the fare; tips go fully to the driver (the fare shown is what the driver is paid)

// What the driver earned: totals and every trip. Cash-out goes to the UPI ID saved in My account.
const DriverEarnings = () => {
  const all = useHistoryStore((s) => s.rides);
  const { q: qParam } = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(qParam ?? "");
  const rides = all.filter((r) => !q.trim() || `${r.place} ${r.rideType} ${r.date}`.toLowerCase().includes(q.trim().toLowerCase()));
  const upi = useDriverStore((d) => d.upi);
  const gross = all.reduce((t, r) => t + r.fare, 0);
  const fee = gross * FEE;
  const net = gross - fee;
  return (
    <Page title="Earnings">
      <View style={{ backgroundColor: colors.ink, borderRadius: 22, padding: 22, marginTop: 18 }}>
        <T style={{ color: colors.onInk, opacity: 0.7, fontSize: 13 }}>YOU KEEP</T>
        <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 44 }}>₹{net.toFixed(0)}</T>
        <T style={{ color: colors.onInk, opacity: 0.8, marginTop: 4 }}>{all.length} trip{all.length === 1 ? "" : "s"} · ₹{gross.toFixed(0)} in fares · ₹{fee.toFixed(0)} Routiq fee (10%)</T>
      </View>
      <Button
        title={upi ? `Cash out to ${upi}` : "Add UPI ID to cash out"}
        onPress={() => router.push("/(root)/driver-account" as any)}
        style={{ marginTop: 14 }}
      />
      <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 26, marginBottom: 10 }}>Trips</T>
      <Field value={q} onChangeText={setQ} placeholder="Search your trips" />
      {rides.length === 0 && <T style={{ color: colors.muted, marginTop: 10 }}>{all.length ? `No trips match "${q}".` : "No trips yet. Your finished trips will show up here."}</T>}
      {all.length === 0 && <Button title="Go online and get requests" onPress={() => { useDriverStore.getState().setOnline(true); router.replace("/(root)/driver" as any); }} style={{ marginTop: 14 }} />}
      {rides.map((r) => (
        <Row key={r.id} style={{ gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          <View style={{ flex: 1 }}>
            <T numberOfLines={1} style={{ fontFamily: font.semi, fontSize: 16 }}>{r.place}</T>
            <T style={{ color: colors.muted, fontSize: 13 }}>{r.date} · {r.rideType}</T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T style={{ fontFamily: font.bold }}>₹{(r.fare * (1 - FEE)).toFixed(0)}</T>
            <T style={{ color: colors.muted, fontSize: 12 }}>of ₹{r.fare.toFixed(0)}</T>
          </View>
        </Row>
      ))}
    </Page>
  );
};

export default DriverEarnings;
