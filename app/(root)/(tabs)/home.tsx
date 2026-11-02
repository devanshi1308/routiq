import Vehicle, { VehicleKind } from "@/components/Vehicle";
import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { H2, Row, Skeleton, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { startFlushing, track, useAnalytics } from "@/lib/analytics";
import { locate, LocationState } from "@/lib/location";
import { fmtVisits, popularNear } from "@/lib/popular";
import { Place, recentFrom, SERVICE_RIDE, SERVICES } from "@/lib/mock";
import { useAuthStore, useHistoryStore, useTripStore } from "@/store";
import { useCommuteStore, useFavStore } from "@/store/extras";

const BADGES: Record<string, string> = { trip: "25%", reserve: "20%", carpool: "35%" };
const FOR_YOU = ["auto", "trip", "bike", "carpool", "reserve"];

const Home = () => {
  const s = mkStyles();
  const name = useAuthStore((s) => s.name).split(" ")[0];
  const rides = useHistoryStore((s) => s.rides);
  const recents = recentFrom(rides, 2);
  const { setDestination, setPreferred, pickup, status: tripStatus, destination: tripDest } = useTripStore();
  // Own recent trips first, then the most-visited places around you (first-time riders see only the second kind).
  const popular = popularNear(pickup, rides, 4, recents);
  const items = [
    ...recents.map((p) => ({ place: p, recent: true, visits: 0 })),
    ...popular.map((x) => ({ place: x.place, recent: false, visits: x.visits })),
  ].slice(0, 4);
  const plans = useCommuteStore((c) => c.plans);
  const favs = useFavStore((f) => f.items);
  // today's commute that is due: from half an hour ago to one and a half hours ahead
  const due = (() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return plans.find((p) => {
      if (!p.on || !p.days.includes(now.getDay())) return false;
      const [h, m] = p.time.split(":").map(Number);
      const diff = h * 60 + m - mins;
      return diff >= -30 && diff <= 90;
    });
  })();
  const bookCommute = () => {
    if (!due) return;
    const t = useTripStore.getState();
    t.setPreferred(due.rideId);
    t.setPickup({ id: "commute-from", ...due.from });
    t.setDestination({ id: "commute-to", ...due.to });
    useTripStore.setState({ favDriver: due.favourite ? favs.find((f) => f.rideId === due.rideId)?.id ?? favs[0]?.id ?? null : null });
    router.push("/(root)/choose-ride");
  };
  const [loading, setLoading] = useState(true);
  const [locState, setLocState] = useState<LocationState>("locating");

  // Use the phone's real location as the pickup; tapping the location name refreshes it.
  const refreshLocation = () => {
    setLocState("locating");
    locate().then(setLocState);
  };
  useEffect(refreshLocation, []);

  useEffect(() => {
    startFlushing();
    useAnalytics.getState().setScreen("home");
    track("screen_view", { screen: "home" });
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    track("impression", { surface: "home", items: items.length + 4 });
    items.forEach((it) => track("shortcut_shown", { place_id: it.place.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const go = (p: Place) => {
    track("shortcut_clicked", { place_id: p.id });
    setPreferred(null);
    useAnalytics.getState().setSource("shortcut");
    setDestination(p);
    router.push("/(root)/choose-ride");
  };

  // A tile such as Bike remembers its ride, so the ride screen opens with Bike selected and first in the list.
  const openService = (id: string) => {
    if (id === "carpool") return router.push("/(root)/carpool" as any);
    setPreferred(SERVICE_RIDE[id] ?? null);
    useAnalytics.getState().setSource("search");
    router.push("/(root)/where-to");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Row style={{ justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, }}>
          <Row style={{ gap: 8, flex: 1, marginRight: 12 }} onPress={refreshLocation}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: locState === "denied" || locState === "unavailable" ? colors.muted : colors.blue }} />
            <T numberOfLines={1} style={{ fontFamily: font.medium, fontSize: 18, flexShrink: 1 }}>{locState === "locating" ? "Locating you…" : pickup.name}</T>
            <Ionicons name="chevron-down" size={16} />
          </Row>
          <Row style={{ gap: 6 }} onPress={() => router.push("/(root)/inbox")}>
            <Ionicons name="notifications-outline" size={20} />
            <T style={{ fontFamily: font.medium, fontSize: 17 }}>Inbox</T>
          </Row>
        </Row>

        {due && tripStatus === "idle" && (
          <Pressable accessibilityRole="button" onPress={bookCommute} style={{ marginHorizontal: 20, marginTop: 14, backgroundColor: colors.card, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="repeat" size={24} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold }}>Your {due.time} commute</T>
              <T style={{ color: colors.muted, fontSize: 13 }}>{due.label} · tap to book</T>
            </View>
            <T style={{ fontFamily: font.bold, color: colors.blue }}>Book</T>
          </Pressable>
        )}

        {tripStatus !== "idle" && tripStatus !== "cancelled" && tripDest && (
          <Pressable onPress={() => router.push("/(root)/trip")} style={{ marginHorizontal: 20, marginTop: 14, backgroundColor: colors.ink, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="car" size={20} color={colors.onInk} />
            <T style={{ flex: 1, color: colors.onInk, fontFamily: font.bold }}>Ride to {tripDest.name} in progress</T>
            <T style={{ color: colors.onInk, fontFamily: font.semi }}>View</T>
          </Pressable>
        )}

          <View style={{ paddingHorizontal: 20 }}>
            <T style={{ fontFamily: font.extra, fontSize: 26, marginTop: 18 }}>Hi, {name}</T>
            <Pressable style={[s.search, { marginTop: 12 }]} onPress={() => router.push("/(root)/where-to")}>
              <Ionicons name="search" size={22} color={colors.muted} />
              <T style={{ flex: 1, fontFamily: font.medium, fontSize: 18, color: colors.muted }}>
                Where to?
              </T>
              <Row style={s.later} onPress={() => router.push("/(root)/where-to")}>
                <Ionicons name="calendar-outline" size={18} />
                <T style={{ fontFamily: font.semi }}>Later</T>
              </Row>
            </Pressable>

            {loading ? (
              <>
                <Skeleton h={44} w="60%" style={{ marginTop: 20 }} />
                <Skeleton h={26} w="25%" style={{ marginTop: 26 }} />
                <Skeleton h={300} style={{ marginTop: 12 }} r={20} />
                <Skeleton h={300} style={{ marginTop: 28 }} r={20} />
              </>
            ) : (
              <>
                <View style={s.recent}>
                  {items.map((it, i) => (
                    <Row key={it.place.id} onPress={() => go(it.place)} style={[{ padding: 14, gap: 14 }, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View style={s.iconBox}>
                        <Ionicons name={it.recent ? "time-outline" : "trending-up"} size={22} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T numberOfLines={2} style={{ fontFamily: font.bold, fontSize: 16 }}>{it.place.name}</T>
                        <T numberOfLines={1} style={{ color: colors.muted, fontSize: 14 }}>{it.recent ? it.place.address : `Popular · ${fmtVisits(it.visits)}`}</T>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </Row>
                  ))}
                </View>

                <Row onPress={() => router.push("/(root)/(tabs)/services" as any)} style={{ gap: 8, marginTop: 28, marginBottom: 12 }}>
                  <H2 style={{ fontSize: 22 }}>For you</H2>
                  <Ionicons name="chevron-forward-circle-outline" size={20} color={colors.muted} />
                </Row>
                <View style={s.grid}>
                  {FOR_YOU.map((id) => {
                    const svc = SERVICES.find((x) => x.id === id)!;
                    return (
                      <Pressable key={id} onPress={() => openService(id)} style={s.gridItem}>
                        <View style={s.gridCircle}>
                          <Vehicle kind={svc.emoji as VehicleKind} size={42} />
                          {BADGES[id] && (
                            <View style={s.badge}>
                              <T style={s.badgeText}>{BADGES[id]}</T>
                            </View>
                          )}
                        </View>
                        <T style={{ fontSize: 15, marginTop: 8 }}>{svc.label}</T>
                      </Pressable>
                    );
                  })}
                </View>

                <H2 style={{ fontSize: 22, marginTop: 28, marginBottom: 12 }}>Ride as you like it</H2>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
                  {[
                    { t: "Auto", d: "Quick, affordable rides", c: "#FFE8A3", e: "auto", id: "auto" },
                    { t: "Go AC", d: "Cool comfort, fixed fare", c: "#CFE3FF", e: "sedan", id: "trip" },
                    { t: "Bike", d: "Beat the traffic", c: "#FFD5C2", e: "bike", id: "bike" },
                  ].map((c) => (
                    <Pressable key={c.t} onPress={() => openService(c.id)} style={[s.promo, { backgroundColor: c.c }]}>
                      <Vehicle kind={c.e as VehicleKind} size={90} />
                      <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 8, color: "#000" }}>{c.t}</T>
                      <T style={{ fontSize: 14, color: "#222" }}>{c.d}</T>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const mkStyles = () => StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 14, height: 64, borderRadius: 32, borderWidth: 1, borderColor: colors.border, paddingLeft: 20, paddingRight: 10, marginTop: 20, backgroundColor: colors.bg, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  later: { gap: 8, backgroundColor: colors.card, paddingHorizontal: 16, height: 46, borderRadius: 23 },
  recent: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginTop: 20 },
  iconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  gridItem: { width: "25%", alignItems: "center" },
  gridCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -10, backgroundColor: colors.promo, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.onInk, fontFamily: font.bold, fontSize: 12 },
  promo: { width: 240, borderRadius: 20, padding: 18, height: 200 },
});

export default Home;
