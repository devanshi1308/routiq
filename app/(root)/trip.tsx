import React from "react";
import Ionicons from "@/components/Icon";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverInfo from "@/components/DriverInfo";
import LiveMap from "@/components/LiveMap";
import { shortName } from "@/lib/privacy";
import { coRiders, lookAlikeTrips } from "@/lib/pool";
import { useFavStore, useSafetyStore } from "@/store/extras";
import { Linking, Platform } from "react-native";
import Vehicle, { VehicleKind } from "@/components/Vehicle";
import { Button, IconCircle, Row, T } from "@/components/ui";
import { DEMO } from "@/constants/config";
import { colors, font } from "@/constants/theme";
import { track, useAnalytics } from "@/lib/analytics";
import { findNearby, kindFor, simulateFleet, toBatches } from "@/lib/dispatch";
import { clockTime, fareFor, haversineKm, RIDE_TYPES, RideType } from "@/lib/mock";
import { surgeFor } from "@/lib/surge";
import { useAuthStore, useChatStore, useHistoryStore, useNoticeStore, useTripStore } from "@/store";

const BOOSTS = [10, 20, 30, 40];
const TIPS = [0, 10, 20, 50];

// Rider's trip screen. The trip itself is driven by lib/tripEngine.ts and the driver's actions (driver screen).
const Trip = () => {
  const { etaSec, autopilot, batchNo, progress, driverPos, dispatch, pickup, destination, routes, routeIndex, rideType, status, driver, pin, fare, boost, tip, payment, reset } = useTripStore();
  const addHistory = useHistoryStore((s) => s.add);
  const push = useNoticeStore((n) => n.push);
  const [stars, setStars] = useState(5);
  const [details, setDetails] = useState(false);
  const [info, setInfo] = useState(false);
  const favItems = useFavStore((f) => f.items);
  const together = useMemo(() => (rideType?.id === "pool" && destination ? coRiders(lookAlikeTrips(pickup, destination), pickup) : []), [rideType?.id, pickup, destination]);
  const trusted = useSafetyStore((x) => x.share);
  const safeOn = useSafetyStore((x) => x.safeArrival);
  const hourNow = new Date().getHours();
  const night = hourNow >= 21 || hourNow < 6;
  const splitPeople = useTripStore((t) => t.split);
  const [panel, setPanel] = useState<null | "details" | "cancel" | "cancel2">(null);
  const [pending, setPending] = useState(0);
  const unread = useChatStore((c) => c.unread);
  const clearChat = useChatStore((c) => c.clear);
  useEffect(() => useAnalytics.getState().setScreen("trip"), []);
  const sheet = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, [panel]);
  useFocusEffect(
    useCallback(() => {
      sheet.current?.scrollTo({ y: 0, animated: false });
    }, [status]),
  );
  const batches = useMemo(() => toBatches(dispatch?.candidates ?? []), [dispatch]);
  const route = routes[routeIndex];

  // Other rides the rider could add to get matched sooner, priced for this trip.
  const extrasNow = useTripStore((s) => s.extras);
  const suggestions = useMemo(() => {
    if (!route || !rideType) return [] as { type: RideType; price: number }[];
    const fleet = simulateFleet(pickup).filter((v) => !useTripStore.getState().womenOnly || v.gender === "woman");
    // one suggestion per vehicle kind (auto, bike, car), cheapest first, so a car can always be added too
    const priced = RIDE_TYPES.filter((r) => r.id !== rideType.id && r.id !== "pool" && !extrasNow.some((e) => e.type.id === r.id)).map((type) => {
      const d = findNearby(fleet, pickup, type);
      return { type, price: +(fareFor(type, route) * surgeFor(d.originCell, d.supply)).toFixed(0), kind: kindFor(type) };
    });
    const best = new Map<string, (typeof priced)[number]>();
    for (const x of priced.sort((a, b) => a.price - b.price)) if (!best.has(x.kind)) best.set(x.kind, x);
    return [...best.values()].sort((a, b) => a.price - b.price).slice(0, 3);
  }, [route, rideType, pickup, extrasNow]);

  if (!destination || !rideType) return <Redirect href="/(root)/(tabs)/home" />;

  const kind = rideType.emoji as VehicleKind;
  const totalDrivers = dispatch?.candidates.length ?? 0;
  const triedDrivers = batches.slice(0, batchNo).reduce((n, b) => n + b.length, 0);
  const noOneLeft = batches.length > 0 && !batches[batchNo];
  const remainingMin = route ? Math.max(1, Math.round(route.minutes * (1 - progress))) : 0;
  const first = driver?.name.split(" ")[0] ?? "your driver";
  const fmtEta = `${Math.floor(etaSec / 60)}:${String(Math.floor(etaSec % 60)).padStart(2, "0")}`;

  const cancel = () => {
    track("ride_cancelled", { request_id: useTripStore.getState().requestId });
    push({ kind: "ride", title: "Ride cancelled", body: `Your request to ${destination.name} was cancelled.` });
    const d = new Date();
    addHistory({ id: `r${Date.now()}`, place: destination.name, dest: destination, date: `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })} • ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`, fare: 0, status: "Cancelled", rideType: rideType.name, emoji: rideType.emoji });
    clearChat();
    reset();
    (router as any).dismissAll?.();
    router.replace("/(root)/(tabs)/home");
  };

  const done = () => {
    clearChat();
    reset();
    (router as any).dismissAll?.();
    router.replace("/(root)/(tabs)/activity");
  };

  // Before a driver is matched the ride is cancelled straight away; after that the rider goes through the reasons list.
  const askCancel = () => (status === "searching" ? cancel() : setPanel("cancel"));

  // "Find another driver": drop the current driver and search again for no fee, skipping the one who was matched.
  const findAnother = () => {
    const fleet = simulateFleet(pickup).filter((v) => v.id !== driver?.id && (!useTripStore.getState().womenOnly || v.gender === "woman"));
    const d = findNearby(fleet, pickup, rideType);
    clearChat();
    useTripStore.setState({ status: "searching", driver: null, dispatch: d, batchNo: 0, etaSec: 0, driverPos: null, progress: 0, requestId: `req-${Date.now().toString(36)}` });
    push({ kind: "ride", title: "Finding another driver", body: "We're looking for another driver near you. No fee." });
    setPanel(null);
  };

  // "Increase your chances": adds a little extra to the fare; picking another amount replaces the first.
  const setBoost = (n: number) => useTripStore.setState((s) => ({ fare: +(s.fare - s.boost + (s.boost === n ? 0 : n)).toFixed(2), boost: s.boost === n ? 0 : n }));

  // "Add services": keep the ride and ask the nearby drivers of the added type as well. The first driver to accept
  // from either type takes the ride, and the other search stops.
  const addService = (t: RideType, price: number) => {
    const d = findNearby(simulateFleet(pickup).filter((v) => !useTripStore.getState().womenOnly || v.gender === "woman"), pickup, t);
    const merged = [...(dispatch?.candidates ?? []).map((c) => ({ ...c, rideId: c.rideId ?? rideType.id })), ...d.candidates.map((c) => ({ ...c, rideId: t.id }))].sort((a, b) => a.km - b.km);
    useTripStore.setState((s) => ({ extras: [...s.extras, { type: t, price }], dispatch: s.dispatch ? { ...s.dispatch, candidates: merged } : d, batchNo: 0 }));
    push({ kind: "ride", title: `${t.name} added`, body: `We are asking ${rideType.name} and ${t.name} drivers near you at the same time.` });
  };
  const removeService = (id: string) => {
    useTripStore.setState((s) => ({ extras: s.extras.filter((e) => e.type.id !== id), dispatch: s.dispatch ? { ...s.dispatch, candidates: s.dispatch.candidates.filter((c) => c.rideId !== id) } : s.dispatch, batchNo: 0 }));
  };

  const tile = (icon: any, label: string, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={24} />
      <T style={{ fontFamily: font.semi, fontSize: 13 }}>{label}</T>
    </Pressable>
  );

  const title =
    status === "searching" ? "Ride requested" : status === "driver_assigned" ? (etaSec > 0 ? `Pick-up in ${Math.max(1, Math.ceil(etaSec / 60))} min` : "Your driver is almost there") : status === "driver_arrived" ? "Your ride is ready to start" : status === "in_progress" ? (progress >= 1 ? "You've reached your destination" : `Dropoff at ${clockTime(remainingMin)}`) : "You've arrived!";

  // "<ride> details" card shared by the searching and driver-found screens
  const detailsCard = (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 14 }}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <T style={{ color: colors.muted, fontSize: 13 }}>{[rideType.name, ...extrasNow.map((e) => e.type.name)].join(" + ")} {extrasNow.length ? "request" : "details"}</T>
          <T style={{ fontFamily: font.extra, fontSize: 22, marginTop: 2 }}>Meet at the pickup point for {pickup.name}</T>
          <Row style={{ alignSelf: "flex-start", backgroundColor: "#E8F6E5", borderRadius: 6, paddingHorizontal: 8, height: 22, gap: 4, marginTop: 8 }}>
            <Ionicons name={payment === "Cash" ? "cash-outline" : "qr-code-outline"} size={12} color="#1B5E20" />
            <T style={{ color: "#1B5E20", fontFamily: font.bold, fontSize: 12 }}>{payment === "UPI Scan and Pay" ? "UPI" : payment}</T>
          </Row>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ride details" onPress={() => setPanel("details")} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} />
        </Pressable>
      </Row>
    </View>
  );

  const reasons = [
    ["Driver arrived early", "alarm-outline"],
    ["Could not find driver", "search-outline"],
    ["Wait time was too long", "hourglass-outline"],
    ["Driver not getting closer", "navigate-outline"],
    ["Driver asked me to cancel or ride off app", "chatbubble-outline"],
    ["Other", "ellipsis-horizontal"],
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <LiveMap
          pickup={pickup}
          destination={destination}
          routes={routes}
          routeIndex={routeIndex}
          height={status === "completed" ? 200 : status === "searching" ? 240 : 290}
          driverPos={status === "driver_assigned" ? driverPos : null}
          progress={status === "in_progress" ? progress : status === "completed" ? 1 : null}
          vehicleKind={kindFor(rideType)}
          tripMode={status === "driver_assigned" || status === "driver_arrived" || status === "in_progress"}
        />
        {(status === "driver_assigned" || status === "driver_arrived" || status === "in_progress") && trusted.length === 0 && (
          <Pressable accessibilityRole="button" onPress={() => router.push("/(root)/contacts?kind=share" as any)} style={{ position: "absolute", left: 12, right: 12, bottom: 12, height: 56, borderRadius: 28, backgroundColor: colors.blue, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 }}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
            <T style={{ flex: 1, color: "#fff", fontFamily: font.bold, fontSize: 15 }}>Add trusted contacts?</T>
            <View style={{ backgroundColor: "#DCE8FF", borderRadius: 18, paddingHorizontal: 16, height: 36, justifyContent: "center" }}>
              <T style={{ color: colors.blue, fontFamily: font.extra }}>Add</T>
            </View>
          </Pressable>
        )}
        {status !== "completed" && (
          <SafeAreaView style={{ position: "absolute", top: 0, left: 16 }}>
            <IconCircle name="arrow-back" size={46} onPress={askCancel} />
          </SafeAreaView>
        )}
        {status !== "completed" && (
          <SafeAreaView style={{ position: "absolute", top: 0, right: 16 }}>
            <Pressable onPress={() => router.push("/(root)/safety")} style={{ marginTop: 4, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
              <Ionicons name="shield" size={16} color={colors.blue} />
              <T style={{ fontFamily: font.bold, fontSize: 13 }}>Safety</T>
            </Pressable>
          </SafeAreaView>
        )}
      </View>

      <ScrollView ref={sheet} style={{ flex: 1, marginTop: -20, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <T style={{ fontFamily: font.extra, fontSize: 24, textAlign: status === "driver_arrived" ? "center" : "left" }}>{title}</T>

        {together.length > 0 && (status === "searching" || status === "driver_assigned" || status === "driver_arrived" || status === "in_progress") && (
          <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: 14 }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="people" size={20} />
              <T style={{ fontFamily: font.bold, fontSize: 16 }}>Riding together</T>
              <T style={{ marginLeft: "auto", color: colors.green, fontFamily: font.bold, fontSize: 13 }}>You save about 35%</T>
            </Row>
            {together.map((c) => (
              <Row key={c.name} style={{ gap: 12, marginTop: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
                  <T style={{ color: colors.onInk, fontFamily: font.bold }}>{c.name[0]}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.semi }}>{c.name}</T>
                  <T style={{ color: colors.muted, fontSize: 12 }}>Joins {c.walkMin} min from you · adds about {c.detourMin} min</T>
                </View>
              </Row>
            ))}
            <T style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Co-riders only see your first name. If nobody joins, you still pay the lower carpool fare.</T>
          </View>
        )}

        {/* ---------- searching ("Ride requested"): finding drivers, add extra to get matched sooner ---------- */}
        {status === "searching" && (
          <>
            <T style={{ color: colors.muted, fontSize: 17, marginTop: 2 }}>{noOneLeft ? "No driver accepted your ride. You can cancel and try again." : "Finding drivers nearby"}</T>
            <View style={{ height: 4, backgroundColor: colors.card, borderRadius: 2, marginTop: 14, overflow: "hidden" }}>
              <View style={{ width: `${Math.max(10, totalDrivers ? (triedDrivers / totalDrivers) * 100 : 10)}%`, height: 4, backgroundColor: colors.blue }} />
            </View>
            {!noOneLeft && <T style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>{triedDrivers} of {totalDrivers} drivers didn't accept yet</T>}
            {noOneLeft && (
              <Button
                title="Search again"
                onPress={() => {
                  useTripStore.setState({ batchNo: 0, requestId: `req-${Date.now().toString(36)}` });
                  push({ kind: "ride", title: "Searching again", body: "We are asking the drivers near you once more." });
                }}
                style={{ marginTop: 14, height: 48 }}
              />
            )}

            {detailsCard}

            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 14 }}>
              <T style={{ fontFamily: font.bold, fontSize: 16 }}>Increase your chances by adding extra</T>
              <Row style={{ gap: 8, marginTop: 12 }}>
                {[20, 30, 40].map((n) => (
                  <Pressable key={n} onPress={() => setPending(pending === n ? 0 : n)} style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: pending === n ? colors.ink : colors.card, alignItems: "center", justifyContent: "center" }}>
                    <T style={{ fontFamily: font.bold, fontSize: 14, color: pending === n ? colors.onInk : colors.text }}>+₹{n}</T>
                  </Pressable>
                ))}
              </Row>
              <Row style={{ gap: 8, marginTop: 14 }}>
                <Ionicons name="cash-outline" size={18} />
                <T style={{ fontFamily: font.semi, fontSize: 15 }}>Current price: ₹{fare.toFixed(2)}</T>
              </Row>
              <T style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>100% of the extra amount goes to your driver.</T>
              <Button title={boost && pending === boost ? "Added" : "Confirm"} disabled={pending === 0 || pending === boost} onPress={() => setBoost(pending)} style={{ marginTop: 12, height: 48 }} />
            </View>

            {extrasNow.length > 0 && (
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 14 }}>
                <T style={{ fontFamily: font.bold, fontSize: 16 }}>Searching {extrasNow.length + 1} services</T>
                <T style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>The first driver to accept takes your ride.</T>
                {[{ type: rideType, price: Math.round(fare - boost), main: true }, ...extrasNow.map((e) => ({ ...e, main: false }))].map(({ type, price, main }) => (
                  <Row key={type.id} style={{ gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Vehicle kind={type.emoji as VehicleKind} size={34} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold, fontSize: 16 }}>{type.name}</T>
                      <T style={{ color: colors.muted, fontSize: 13 }}>₹{price} · {main ? "Your ride" : "Added"} · searching…</T>
                    </View>
                    {!main && (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${type.name}`} onPress={() => removeService(type.id)} style={{ paddingHorizontal: 12, height: 40, justifyContent: "center" }}>
                        <T style={{ color: colors.red, fontFamily: font.bold, fontSize: 14 }}>Remove</T>
                      </Pressable>
                    )}
                  </Row>
                ))}
              </View>
            )}

            {suggestions.length > 0 && (
              <View style={{ backgroundColor: "#F2F6FF", borderRadius: 18, padding: 16, marginTop: 14 }}>
                <T style={{ fontFamily: font.bold, fontSize: 16, marginBottom: 2 }}>Add more services to get a ride faster</T>
                <T style={{ color: colors.muted, fontSize: 13 }}>Your {rideType.name} request stays. We ask these drivers too.</T>
                {suggestions.map(({ type, price }) => (
                  <Row key={type.id} style={{ backgroundColor: colors.bg, borderRadius: 14, padding: 12, marginTop: 8, gap: 12 }}>
                    <Vehicle kind={type.emoji as VehicleKind} size={34} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold, fontSize: 16 }}>{type.name}</T>
                      <T style={{ color: colors.muted, fontSize: 14 }}>₹{price}</T>
                    </View>
                    <Pressable onPress={() => addService(type, price)} style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 16, height: 40, justifyContent: "center" }}>
                      <T style={{ fontFamily: font.bold, fontSize: 14 }}>+ ADD</T>
                    </Pressable>
                  </Row>
                ))}
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 16 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {[
                { t: "Insure your Routiq rides", d: "Coverage for medical costs, missed flights & more", c: "#F6C343" },
                { t: "Earn up to 10% Routiq One credits on rides", d: "Don't miss earning credit on this ride", c: "#1F3A5F", light: true },
                { t: "Quality rides, every time", d: "Top-rated drivers and quality cars on every ride", c: "#E8A33B" },
              ].map((c) => (
                <View key={c.t} style={{ width: 250, minHeight: 130, borderRadius: 18, backgroundColor: c.c, padding: 16, justifyContent: "flex-end" }}>
                  <T style={{ fontFamily: font.extra, fontSize: 18, color: c.light ? "#fff" : "#000" }}>{c.t}</T>
                  <T style={{ fontSize: 13, color: c.light ? "#dde" : "#222", marginTop: 4 }}>{c.d}</T>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ---------- driver matched: "Pick-up in N min" ---------- */}
        {driver && status === "driver_assigned" && (
          <View style={{ marginTop: 14 }}>
            {driverPos && <T style={{ fontFamily: font.extra, fontSize: 24, textAlign: "center", marginBottom: 12 }}>{Math.max(1, Math.ceil(etaSec / 60))} min · {(haversineKm({ ...pickup, ...driverPos }, pickup) * 1.3).toFixed(1)} km</T>}
            <Row style={{ backgroundColor: colors.blue, borderRadius: 14, paddingHorizontal: 16, height: 56, justifyContent: "space-between" }}>
              <Row style={{ gap: 10 }}>
                <Ionicons name="keypad" size={18} color={colors.onInk} />
                <T style={{ color: colors.onInk, fontFamily: font.semi, fontSize: 16 }}>Your PIN</T>
              </Row>
              <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 24, letterSpacing: 3 }}>{pin}</T>
            </Row>
            {detailsCard}
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 14 }}>
              <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Row style={{ gap: 10 }}>
                  <View style={{ alignItems: "center" }}>
                    <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="person" size={26} />
                    </View>
                    <T style={{ fontSize: 12, fontFamily: font.bold, marginTop: 2 }}>★ {driver.rating}</T>
                  </View>
                  <Vehicle kind={kind} size={46} />
                </Row>
                <View style={{ alignItems: "flex-end" }}>
                  <T style={{ fontFamily: font.extra, fontSize: 22 }}>{driver.plate.replace(/ /g, "")}</T>
                  <T style={{ color: colors.muted, fontSize: 14 }}>{driver.vehicle}</T>
                  <T style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{driver.acceptance >= 90 ? "Top-rated driver" : "Rated driver"}</T>
                </View>
              </Row>
              <T style={{ fontFamily: font.bold, fontSize: 17, marginTop: 8 }}>{driver.name}</T>
              <Row style={{ gap: 8, marginTop: 12 }}>
                <Pressable onPress={() => router.push("/(root)/chat")} style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} />
                  <T style={{ fontFamily: font.bold, fontSize: 15 }}>{unread ? `Message (${unread})` : "Message"}</T>
                </Pressable>
                <View style={{ width: 52, height: 48, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="call-outline" size={20} />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={() => setPanel("details")} style={{ width: 52, height: 48, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="ellipsis-horizontal" size={20} />
                </Pressable>
              </Row>
            </View>
            {etaSec <= 0 && !autopilot && <T style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Waiting for the driver to confirm arrival.</T>}
          </View>
        )}

        {/* ---------- driver at the pickup: "ride is ready to start" ---------- */}
        {driver && status === "driver_arrived" && (
          <View style={{ marginTop: 6 }}>
            <T style={{ color: colors.muted, fontSize: 16, textAlign: "center" }}>Meet your driver and share your PIN</T>
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, marginTop: 16 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Vehicle kind={kind} size={56} />
                <View style={{ alignItems: "flex-end" }}>
                  <T style={{ fontFamily: font.extra, fontSize: 26 }}>{driver.plate}</T>
                  <T style={{ color: colors.muted, fontSize: 15 }}>{driver.vehicle}</T>
                </View>
              </Row>
              <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 10 }}>{driver.name}</T>
              <T style={{ color: colors.muted }}>★ {driver.rating} · {driver.trips} trips</T>
              <View style={{ marginTop: 14, backgroundColor: colors.ink, borderRadius: 12, padding: 14 }}>
                <T style={{ color: "#bbb", fontSize: 13 }}>Your PIN. Tell it to the driver to start the ride.</T>
                <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 32, letterSpacing: 10 }}>{pin}</T>
              </View>
              <Row style={{ gap: 8, marginTop: 12 }}>
                {tile("headset-outline", "Support", () => router.push("/(root)/help"))}
                {tile("chatbubble-ellipses-outline", unread ? `Message (${unread})` : "Message", () => router.push("/(root)/chat"))}
                {tile("ellipsis-horizontal", "More", () => router.push("/(root)/safety"))}
              </Row>
            </View>
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, marginTop: 14 }}>
              <T style={{ color: colors.muted, fontSize: 13 }}>Ride details</T>
              <T style={{ fontFamily: font.extra, fontSize: 22, marginTop: 2 }}>Meet at {pickup.name}</T>
            </View>
          </View>
        )}

        {/* ---------- trip in progress ---------- */}
        {status === "in_progress" && (
          <View style={{ marginTop: 14 }}>
            <View style={{ height: 6, backgroundColor: colors.card, borderRadius: 3 }}>
              <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.ink, borderRadius: 3 }} />
            </View>
            <Row style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 16, justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <T style={{ color: colors.muted, fontSize: 13 }}>Ride details</T>
                <T style={{ fontFamily: font.extra, fontSize: 22 }} numberOfLines={2}>Heading to {destination.name}</T>
              </View>
              <Pressable onPress={() => router.push("/(root)/safety")} style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
                <Ionicons name="ellipsis-horizontal" size={22} />
              </Pressable>
            </Row>
            <Row style={{ gap: 10, marginTop: 14 }}>
              {tile("share-social-outline", "Share trip", () => router.push("/(root)/share-trip" as any))}
              {tile("shield-outline", "Safety", () => router.push("/(root)/safety"))}
              {tile("chatbubble-ellipses-outline", unread ? `Message (${unread})` : "Message", () => router.push("/(root)/chat"))}
              {tile("headset-outline", "Support", () => router.push("/(root)/help"))}
            </Row>
            <T style={{ fontFamily: font.extra, fontSize: 20, marginTop: 22 }}>Tip {first}?</T>
            <T style={{ color: colors.muted, marginTop: 2 }}>We'll deliver your tip after the ride.</T>
            <Row style={{ gap: 8, marginTop: 12 }}>
              {TIPS.map((n) => (
                <Pressable key={n} onPress={() => useTripStore.setState({ tip: n })} style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: tip === n ? colors.ink : colors.border, backgroundColor: tip === n ? colors.ink : colors.card, alignItems: "center", justifyContent: "center" }}>
                  <T style={{ fontFamily: font.bold, fontSize: 14, color: tip === n ? colors.onInk : colors.text }}>{n === 0 ? "No tip" : `₹${n}`}</T>
                </Pressable>
              ))}
            </Row>
          </View>
        )}

        {/* ---------- finished ---------- */}
        {status === "completed" && (
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <T style={{ fontFamily: font.extra, fontSize: 40 }}>₹{(fare + tip).toFixed(2)}</T>
            <T style={{ color: colors.muted, marginTop: 2 }}>Pay by {payment}{tip ? ` · includes ₹${tip} tip` : ""}</T>
            {driver && (
              <Pressable accessibilityRole="button" accessibilityLabel={`About ${shortName(driver.name)}`} onPress={() => setInfo(true)} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 12, marginTop: 18, alignSelf: "stretch" }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
                  <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 18 }}>{driver.name[0]}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 16 }}>Rate {shortName(driver.name)}</T>
                  <T style={{ color: colors.muted, fontSize: 13 }}>Tap to see the driver and vehicle</T>
                </View>
                <Ionicons name="information-circle-outline" size={24} />
              </Pressable>
            )}
            {driver && (() => {
              const id = `${driver.name}|${driver.plate}`;
              const isFav = favItems.some((f) => f.id === id);
              return (
                <Pressable accessibilityRole="button" onPress={() => (isFav ? useFavStore.getState().remove(id) : useFavStore.getState().add({ id, name: driver.name, vehicle: driver.vehicle, plate: driver.plate, rating: driver.rating, rideId: rideType.id }))} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingHorizontal: 16, height: 40, borderRadius: 20, backgroundColor: isFav ? colors.ink : colors.card }}>
                  <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? colors.onInk : colors.red} />
                  <T style={{ fontFamily: font.semi, color: isFav ? colors.onInk : colors.text }}>{isFav ? "Favourite driver" : "Add to favourites"}</T>
                </Pressable>
              );
            })()}
            {safeOn && trusted.length > 0 && (
              <View style={{ alignSelf: "stretch", backgroundColor: night ? colors.ink : colors.card, borderRadius: 16, padding: 14, marginTop: 14 }}>
                <T style={{ fontFamily: font.bold, color: night ? colors.onInk : colors.text }}>{night ? "It's late. Tell them you're safe 🏠" : "Tell someone you arrived"}</T>
                {trusted.map((c) => {
                  const msg = `${useAuthStore.getState().name.split(" ")[0]} reached ${destination.name} safely 🏠 Sent from Routiq.`;
                  return (
                    <Row key={c.id} style={{ gap: 12, marginTop: 8 }}>
                      <T style={{ flex: 1, color: night ? colors.onInk : colors.text }}>{c.name}</T>
                      <T onPress={() => Linking.openURL(`https://wa.me/91${c.phone}?text=${encodeURIComponent(msg)}`).catch(() => {})} style={{ color: night ? colors.onInk : colors.blue, fontFamily: font.bold, padding: 6 }}>WhatsApp</T>
                      <T onPress={() => Linking.openURL(`sms:${c.phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(msg)}`).catch(() => {})} style={{ color: night ? colors.onInk : colors.blue, fontFamily: font.bold, padding: 6 }}>Message</T>
                    </Row>
                  );
                })}
              </View>
            )}
            {splitPeople.length > 0 && (
              <View style={{ alignSelf: "stretch", backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 14 }}>
                <T style={{ fontFamily: font.bold }}>Split fare · ₹{((fare + tip) / (splitPeople.length + 1)).toFixed(0)} each</T>
                {splitPeople.map((p) => (
                  <Row key={p.phone + p.name} style={{ gap: 10, marginTop: 8 }}>
                    <T style={{ flex: 1 }}>{p.name}</T>
                    <T onPress={() => Linking.openURL(`sms:${p.phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(`Hi ${p.name}, our Routiq ride to ${destination.name} cost ₹${(fare + tip).toFixed(0)}. Your share is ₹${((fare + tip) / (splitPeople.length + 1)).toFixed(0)}. Please pay me on UPI.`)}`).catch(() => {})} style={{ color: colors.blue, fontFamily: font.bold, padding: 6 }}>Ask to pay</T>
                  </Row>
                ))}
              </View>
            )}
            <Row style={{ gap: 6, marginTop: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`} onPress={() => setStars(n)} hitSlop={6}>
                  <Ionicons name={n <= stars ? "star" : "star-outline"} size={36} />
                </Pressable>
              ))}
            </Row>
            <T style={{ color: colors.muted, marginTop: 6 }}>{["", "Poor", "Fair", "Good", "Great", "Excellent"][stars]}</T>
            <DriverInfo visible={info} driver={driver} kind={rideType.emoji as VehicleKind} onClose={() => setInfo(false)} />
          </View>
        )}

        <View style={{ marginTop: 22, gap: 10 }}>
          {status === "completed" ? (
            <Button title="Done" onPress={done} />
          ) : status !== "in_progress" ? (
            <Button title="Cancel ride" variant="grey" onPress={askCancel} />
          ) : null}
          {DEMO && status !== "completed" && (
            <Pressable onPress={() => router.push("/(root)/driver")} style={{ alignSelf: "center", paddingVertical: 6 }}>
              <T style={{ color: colors.muted, fontSize: 13, fontFamily: font.semi }}>Demo: open Driver view</T>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ---------- Ride details sheet ---------- */}
      <Modal visible={panel === "details"} transparent animationType="slide" onRequestClose={() => setPanel(null)}>
        <Pressable onPress={() => Date.now() - openedAt.current > 500 && setPanel(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <Pressable style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 }}>
            <T style={{ fontFamily: font.extra, fontSize: 22, textAlign: "center", marginBottom: 12 }}>Ride details</T>
            {[
              { i: "ellipse", t: `Meet at the pickup point for ${pickup.name}`, r: "pencil" },
              { i: "square", t: destination.name, sub: route ? `${clockTime(route.minutes + (status === "searching" ? 5 : 0))}` : "", r: "pencil" },
            ].map((x) => (
              <Row key={x.t} style={{ gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Ionicons name={x.i as any} size={12} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.semi, fontSize: 16 }} numberOfLines={2}>{x.t}</T>
                  {!!x.sub && <T style={{ color: colors.muted, fontSize: 13 }}>{x.sub}</T>}
                </View>
              </Row>
            ))}
            <Row style={{ gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name="keypad-outline" size={18} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.bold, fontSize: 16 }}>Your PIN</T>
                <T style={{ color: colors.muted, fontSize: 13 }}>Share PIN with your driver</T>
              </View>
              <View style={{ backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 12, height: 32, justifyContent: "center" }}>
                <T style={{ color: colors.onInk, fontFamily: font.extra, letterSpacing: 2 }}>{pin}</T>
              </View>
            </Row>
            <Row style={{ gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name="person-outline" size={18} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.bold, fontSize: 16 }}>₹{fare.toFixed(2)}</T>
                <T style={{ color: colors.muted, fontSize: 13 }}>{payment === "UPI Scan and Pay" ? "UPI" : payment}</T>
              </View>
              <Pressable onPress={() => { setPanel(null); router.push("/(root)/pay-with"); }} style={{ backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 14, height: 34, justifyContent: "center" }}>
                <T style={{ fontFamily: font.bold, fontSize: 13 }}>Switch</T>
              </Pressable>
            </Row>
            <Row style={{ gap: 14, paddingVertical: 12 }}>
              <Ionicons name="share-social-outline" size={18} />
              <T style={{ flex: 1, fontFamily: font.bold, fontSize: 16 }}>Share trip status</T>
              <Pressable onPress={() => { setPanel(null); router.push("/(root)/share-trip" as any); }} style={{ backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 14, height: 34, justifyContent: "center" }}>
                <T style={{ fontFamily: font.bold, fontSize: 13 }}>Share</T>
              </Pressable>
            </Row>
            {status !== "completed" && status !== "in_progress" && (
              <Pressable onPress={() => (status === "searching" ? cancel() : setPanel("cancel"))} style={{ height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.red, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <T style={{ color: colors.red, fontFamily: font.bold, fontSize: 16 }}>Cancel ride</T>
              </Pressable>
            )}
            <Button title="Close" onPress={() => setPanel(null)} style={{ marginTop: 10 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- Cancel flow: reasons, then "Find another driver" ---------- */}
      <Modal visible={panel === "cancel" || panel === "cancel2"} transparent animationType="slide" onRequestClose={() => setPanel(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 }}>
            {panel === "cancel" ? (
              <>
                <Row style={{ justifyContent: "space-between" }}>
                  <Pressable onPress={() => setPanel("details")} hitSlop={10}>
                    <Ionicons name="arrow-back" size={22} />
                  </Pressable>
                  <T style={{ fontFamily: font.extra, fontSize: 20 }}>Cancel trip?</T>
                  <Pressable onPress={() => setPanel("cancel2")} hitSlop={10}>
                    <T style={{ fontFamily: font.bold, fontSize: 15 }}>Skip</T>
                  </Pressable>
                </Row>
                <T style={{ fontFamily: font.extra, fontSize: 20, marginTop: 18 }}>Why do you want to cancel?</T>
                <T style={{ color: colors.muted, marginBottom: 6 }}>Optional</T>
                {reasons.map(([label, icon]) => (
                  <Pressable key={label} onPress={() => setPanel("cancel2")} style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14 }}>
                    <Ionicons name={icon as any} size={22} />
                    <T style={{ flex: 1, fontFamily: font.semi, fontSize: 16 }}>{label}</T>
                  </Pressable>
                ))}
                <Button title="Keep my trip" onPress={() => setPanel(null)} style={{ marginTop: 10 }} />
              </>
            ) : (
              <>
                <Row style={{ justifyContent: "space-between" }}>
                  <T style={{ fontFamily: font.extra, fontSize: 22 }}>Cancel ride?</T>
                  <Pressable onPress={() => setPanel(null)} hitSlop={10}>
                    <Ionicons name="close" size={24} />
                  </Pressable>
                </Row>
                <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 14 }}>Cancel your ride with {driver ? driver.name : "your driver"}?</T>
                <T style={{ fontFamily: font.bold, fontSize: 17, marginTop: 10, lineHeight: 24 }}>Instead, we can find you another nearby driver for no fee.</T>
                <Row style={{ justifyContent: "space-between", marginTop: 16 }}>
                  <Row style={{ gap: 10, flex: 1 }}>
                    <Ionicons name="location" size={18} />
                    <T style={{ fontFamily: font.semi, fontSize: 15 }}>Wrong pickup location?</T>
                  </Row>
                  <Pressable onPress={() => setPanel(null)} style={{ backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 14, height: 34, justifyContent: "center" }}>
                    <T style={{ fontFamily: font.bold, fontSize: 13 }}>Edit Pickup</T>
                  </Pressable>
                </Row>
                <Pressable onPress={() => { setPanel(null); cancel(); }} style={{ height: 54, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginTop: 18 }}>
                  <T style={{ color: colors.red, fontFamily: font.extra, fontSize: 16, letterSpacing: 0.5 }}>YES, CANCEL</T>
                </Pressable>
                <Pressable onPress={findAnother} style={{ height: 54, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
                  <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 16, letterSpacing: 0.5 }}>FIND ANOTHER DRIVER</T>
                </Pressable>
                <Pressable onPress={() => setPanel(null)} style={{ height: 48, alignItems: "center", justifyContent: "center", marginTop: 6 }}>
                  <T style={{ fontFamily: font.extra, fontSize: 16 }}>NO</T>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Trip;
