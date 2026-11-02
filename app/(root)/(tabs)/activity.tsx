import Vehicle, { VehicleKind } from "@/components/Vehicle";
import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import UberMap from "@/components/UberMap";
import { H1, H2, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { CURRENT_LOCATION, PLACES } from "@/lib/mock";
import { useHistoryStore } from "@/store";
import { useCommuteStore } from "@/store/extras";

const Activity = () => {
  const all = useHistoryStore((s) => s.rides);
  const [filter, setFilter] = useState("All");
  const commutes = useCommuteStore((c) => c.plans).filter((p) => p.on);
  const [showFilter, setShowFilter] = useState(false);
  const rides = all.filter((r) => filter === "All" || (filter === "Business" ? r.business : r.status.toLowerCase() === filter.toLowerCase()));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <H1 style={{ marginTop: 16 }}>Activity</H1>
        <H2 style={{ fontSize: 26, marginTop: 28, marginBottom: 14 }}>Upcoming</H2>
        {commutes.map((p) => (
          <Pressable key={p.id} onPress={() => router.push("/(root)/commute" as any)} style={[card, { marginBottom: 12 }]}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>{p.label} · {p.time}</T>
              <T style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>Daily commute · {p.days.length === 7 ? "Every day" : p.days.length === 5 && p.days.every((d) => d >= 1 && d <= 5) ? "Weekdays" : `${p.days.length} days a week`}</T>
            </View>
            <Ionicons name="repeat" size={26} />
          </Pressable>
        ))}
        <Pressable onPress={() => router.push((commutes.length ? "/(root)/where-to" : "/(root)/commute") as any)} style={card}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 26, lineHeight: 32 }}>{commutes.length ? "Need another ride?" : "You have no upcoming trips"}</T>
            <T style={{ fontFamily: font.semi, fontSize: 18, color: colors.muted, marginTop: 8 }}>{commutes.length ? "Plan a ride →" : "Set up a daily commute →"}</T>
          </View>
          <Vehicle kind="calendar" size={70} />
        </Pressable>

        <Row style={{ justifyContent: "space-between", marginTop: 28, marginBottom: 14 }}>
          <H2 style={{ fontSize: 26 }}>Past</H2>
          <Pressable accessibilityLabel="Filter trips" onPress={() => setShowFilter((v) => !v)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: filter === "All" ? colors.card : colors.ink, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="options-outline" size={22} color={filter === "All" ? colors.text : colors.onInk} />
          </Pressable>
        </Row>
        {showFilter && (
          <Row style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {["All", "Completed", "Cancelled", "Business"].map((f) => (
              <T key={f} onPress={() => { setFilter(f); setShowFilter(false); }} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, overflow: "hidden", fontFamily: font.semi, backgroundColor: filter === f ? colors.ink : colors.card, color: filter === f ? colors.onInk : colors.text }}>{f}</T>
            ))}
          </Row>
        )}
        <Pressable onPress={() => router.push("/(root)/routiq-one" as any)} style={card}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 24, lineHeight: 30 }}>You could have earned ₹51.00 Routiq Cash on your last ride</T>
            <T style={{ fontFamily: font.semi, fontSize: 18, color: colors.muted, marginTop: 8 }}>Try Routiq One →</T>
          </View>
          <Vehicle kind="coin" size={64} />
        </Pressable>
        {rides.length === 0 && <T style={{ color: colors.muted, marginTop: 20 }}>{all.length ? `No ${filter.toLowerCase()} trips.` : "Your trips will show up here after your first ride."}</T>}
        {rides.length === 0 && (
          <Pressable accessibilityRole="button" onPress={() => (all.length ? setFilter("All") : router.push("/(root)/where-to" as any))} style={{ marginTop: 14, alignSelf: "flex-start", paddingHorizontal: 20, height: 46, borderRadius: 23, backgroundColor: colors.ink, justifyContent: "center" }}>
            <T style={{ fontFamily: font.bold, color: colors.onInk }}>{all.length ? "Show all trips" : "Book a ride"}</T>
          </Pressable>
        )}

        {rides.map((r) => (
          <View key={r.id} style={[card, { flexDirection: "column", alignItems: "stretch", padding: 16, marginTop: 20 }]}>
            <View style={{ borderRadius: 12, overflow: "hidden" }}>
              <UberMap pickup={CURRENT_LOCATION} destination={PLACES[0]} height={150} showVehicles={false} />
            </View>
            <T style={{ fontFamily: font.bold, fontSize: 24, marginTop: 14 }}>{r.place}</T>
            <T style={{ fontFamily: font.medium, fontSize: 17, color: colors.muted, marginTop: 6 }}>{r.date}</T>
            <T style={{ fontFamily: font.medium, fontSize: 17, color: colors.muted, marginTop: 2 }}>
              ₹{r.fare.toFixed(2)} • {r.status}{r.business ? " • Business" : ""}
              {r.drivers ? ` • ${r.drivers} drivers` : ""}
            </T>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const card = {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 20,
  padding: 20,
} as const;

export default Activity;
