import Vehicle, { VehicleKind } from "@/components/Vehicle";
import Ionicons from "@/components/Icon";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LiveMap from "@/components/LiveMap";
import { Button, IconCircle, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { BATCH_SIZE, Dispatch, findNearby, kindFor, simulateFleet } from "@/lib/dispatch";
import { isLand } from "@/lib/land";
import { snapToRoad } from "@/lib/snap";
import { servesRide } from "@/lib/fleet";
import { askNotifyPermission } from "@/lib/notify";
import { shortName } from "@/lib/privacy";
import { useFavStore, useSafetyStore } from "@/store/extras";
import { startFlushing, track, useAnalytics } from "@/lib/analytics";
import { fetchRoutes } from "@/lib/routes";
import { useIntegrity } from "@/lib/integrity";
import { lookAlikeTrips } from "@/lib/pool";
import { startRealtime, useRealtime } from "@/lib/realtime";
import { gridDisk, latLngToCell } from "@/lib/h3";
import { H3_RES } from "@/lib/dispatch";
import { surgeFor } from "@/lib/surge";
import { clockTime, fareFor, PAYMENT_METHODS, RIDE_TYPES } from "@/lib/mock";
import { useBusinessStore, useNoticeStore, useTripStore } from "@/store";

const PAY_ICON = { Cash: "cash-outline", "UPI Scan and Pay": "qr-code-outline", "Routiq Cash": "wallet-outline" } as const;
const PAY_HINT = {
  Cash: "Pay the driver at the end of the trip",
  "UPI Scan and Pay": "Scan the driver's QR code with any UPI app",
  "Routiq Cash": "Balance: ₹0.00",
} as const;

// Map with only a few vehicles of the selected ride type near the pickup (hooks live here so the screen's early return stays safe).
const RideMap = ({ pickup, destination, routes, routeIndex, height, etaLabel, selected, disp, live }: { pickup: any; destination: any; routes: any; routeIndex: number; height: number; etaLabel: string; selected: any; disp: Dispatch; live: ReturnType<typeof useRealtime.getState> }) => {
  // Only vehicles of the selected ride (rickshaws for Auto, bikes for Bike, cars for the rest), a few of them, inside the
  // H3 hexagons around the pickup, and only on land. With the live server connected its vehicles are used instead.
  const wantKind = kindFor(selected);
  const near = new Set(gridDisk(latLngToCell(pickup.latitude, pickup.longitude, H3_RES), Math.min(disp.k, 2)));
  const rawLive = live.connected ? live.vehicles.filter((v) => v.kind === wantKind && isLand(v.lat, v.lon) && near.has(latLngToCell(v.lat, v.lon, H3_RES))).map((v) => ({ latitude: v.lat, longitude: v.lon, kind: wantKind })) : [];
  const raw = (rawLive.length ? rawLive : disp.candidates.filter((c) => isLand(c.latitude, c.longitude)).map((c) => ({ latitude: c.latitude, longitude: c.longitude, kind: wantKind })))
    .sort((a, b) => Math.hypot(a.latitude - pickup.latitude, a.longitude - pickup.longitude) - Math.hypot(b.latitude - pickup.latitude, b.longitude - pickup.longitude))
    .slice(0, 5);
  const rawKey = JSON.stringify(raw.map((r) => [r.latitude.toFixed(4), r.longitude.toFixed(4)]));
  const [snapped, setSnapped] = useState<{ key: string; list: typeof raw }>({ key: "", list: [] });
  useEffect(() => {
    let live = true;
    Promise.all(raw.map(async (r) => ({ ...r, ...(await snapToRoad(r)) }))).then((list) => live && setSnapped({ key: rawKey, list: list.filter((v) => isLand(v.latitude, v.longitude)) }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawKey]);
  const shownVehicles = snapped.key === rawKey ? snapped.list : raw; // until snapped, show them where they were drawn
  return <LiveMap pickup={pickup} destination={destination} routes={routes} routeIndex={routeIndex} height={height} etaLabel={etaLabel} vehicles={shownVehicles} />;
};

const ChooseRide = () => {
  const { preferred, voucher, pickup, destination, routes, routeIndex, setRoutes, setRouteIndex, rideType, selectRide, payment, setPayment, setFare, setStatus } = useTripStore();
  const [showRoutes, setShowRoutes] = useState(false);
  const [chosen, setChosen] = useState(false);
  const { height: winH } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const route = routes[routeIndex];
  useEffect(() => {
    startFlushing();
    useAnalytics.getState().setScreen("choose_ride");
    track("screen_view", { screen: "choose_ride" });
  }, []);
  useEffect(() => useIntegrity.getState().reportLocation(pickup), [pickup]);
  useEffect(() => startRealtime(), []);
  const live = useRealtime();
  const pool = useMemo(() => (destination ? lookAlikeTrips(pickup, destination) : []), [pickup, destination]);
  const bizActive = useBusinessStore((b) => b.active && !!b.business);
  const push = useNoticeStore((n) => n.push);
  const setDispatch = useTripStore((t) => t.setDispatch);
  // H3: index every vehicle into a hex cell, then search rings of cells around the rider.
  const womenOnly = useTripStore((t) => t.womenOnly);
  const favDriver = useTripStore((t) => t.favDriver);
  const split = useTripStore((t) => t.split);
  const favs = useFavStore((f) => f.items);
  useEffect(() => useTripStore.setState({ womenOnly: useSafetyStore.getState().womenPref }), []);
  const fleet = useMemo(() => simulateFleet(pickup).filter((v) => !womenOnly || v.gender === "woman"), [pickup, womenOnly]);
  const dispatches = useMemo(() => Object.fromEntries(RIDE_TYPES.map((r) => [r.id, findNearby(fleet, pickup, r)])), [fleet, pickup]);

  useEffect(() => {
    if (!destination) return;
    let live = true;
    setLoading(true);
    fetchRoutes(pickup, destination).then((r) => {
      if (!live) return;
      setRoutes(r);
      setChosen(false);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [pickup, destination, setRoutes]);

  useEffect(() => {
    // a ride picked on Home or Services (Auto, Go AC, Bike) is selected straight away
    const pick = RIDE_TYPES.find((r) => r.id === preferred);
    if (pick) selectRide(pick);
    else if (!rideType) selectRide(RIDE_TYPES[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferred, selectRide]);

  if (!destination) return <Redirect href="/(root)/where-to" />;

  const selected = rideType ?? RIDE_TYPES[0];
  const disp = dispatches[selected.id];
  const surgeOf = (id: string) => surgeFor(dispatches[id].originCell, dispatches[id].supply);
  const priceOf = (r: (typeof RIDE_TYPES)[number]) => (route ? fareFor(r, route) * surgeOf(r.id) * (r.id === "pool" ? (pool.length ? 0.65 : 0.8) : 1) * (voucher ? 0.9 : 1) : 0);
  const etaOf = (id: string, fallback: number) => dispatches[id]?.candidates[0]?.etaMin ?? fallback;
  // Option badges: cheapest price and earliest arrival among the standard (non-shared) options.
  const standard = RIDE_TYPES.filter((r) => r.id !== "pool");
  const cheapestId = route ? standard.reduce((b, r) => (priceOf(r) < priceOf(b) ? r : b)).id : "";
  const fastestId = standard.reduce((b, r) => (etaOf(r.id, r.etaMin) < etaOf(b.id, b.etaMin) ? r : b)).id;

  const book = () => {
    if (!route) return;
    askNotifyPermission(); // so the ride card can appear on the lock screen
    useTripStore.setState({ batchNo: 0, progress: 0, driver: null });
    // a favourite driver for this kind of ride is placed first, so they are asked before anyone else
    const fav = favs.find((f) => f.id === favDriver && servesRide(f.vehicle, selected.id));
    const favCandidate = fav ? { id: 900000 + Math.abs(fav.id.length), name: fav.name, rating: fav.rating, acceptance: 99, trips: 1200, vehicle: fav.vehicle, plate: fav.plate, phone: "+91 98•••• 0000", gender: "man" as const, kind: disp.candidates[0]?.kind ?? "auto", latitude: pickup.latitude + 0.002, longitude: pickup.longitude + 0.002, cell: disp.originCell, km: 0.3, ring: 0, etaMin: 3 } : null;
    setDispatch(favCandidate ? { ...disp, candidates: [favCandidate as any, ...disp.candidates] } : disp);
    push({ kind: "ride", title: "Looking for a driver", body: `Your ${selected.name} request to ${destination.name} was sent to nearby drivers.` });
    const price = +priceOf(selected).toFixed(2);
    const reqId = `req-${Date.now().toString(36)}`;
    useTripStore.setState({ requestId: reqId });
    track("ride_booked", { request_id: reqId, ride_type: selected.id, fare: price, surge: surgeOf(selected.id), source: useAnalytics.getState().source });
    setFare(price);
    router.push("/(root)/confirm-pickup" as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <RideMap pickup={pickup} destination={destination} routes={routes} routeIndex={routeIndex} height={Math.max(180, Math.min(300, winH * 0.34))} etaLabel={String(etaOf(selected.id, selected.etaMin))} selected={selected} disp={disp} live={live} />
        <SafeAreaView style={{ position: "absolute", top: 0, left: 16 }}>
          <IconCircle name="arrow-back" size={46} onPress={() => router.back()} />
        </SafeAreaView>
        {!loading && route && (
          <SafeAreaView style={{ position: "absolute", top: 0, right: 16 }}>
            <Pressable
              onPress={() => setShowRoutes((v) => !v)}
              style={{ marginTop: 4, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
            >
              <T style={{ fontFamily: font.bold, fontSize: 13 }}>{route.km} km · {route.minutes} min</T>
              <Ionicons name={showRoutes ? "chevron-up" : "chevron-down"} size={14} />
            </Pressable>
          </SafeAreaView>
        )}
      </View>

      <View style={{ flex: 1, marginTop: -20, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginTop: 8 }} />
        
        {/* Section 1: route. Defaults to the shortest; only the rider changes it. */}
        <View style={{ paddingHorizontal: 16, paddingTop: showRoutes ? 10 : 0 }}>
          {showRoutes && (
            <View style={{ marginTop: 10, gap: 8 }}>
              {routes.map((rt, i) => {
                const m = rt;
                const on = i === routeIndex;
                const tc = rt.traffic === "Heavy" ? colors.red : rt.traffic === "Moderate" ? "#B7791F" : colors.green;
                return (
                  <Pressable
                    key={rt.id}
                    onPress={() => {
                      setRouteIndex(i);
                      track("route_selected", { request_id: "pending", route: rt.name, km: rt.km, minutes: rt.minutes });
                      setChosen(i !== 0);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border }}
                  >
                    <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold, fontSize: 15 }}>{rt.name}{i === 0 ? " (default)" : ""} · {m.km} km · {m.minutes} min</T>
                      <T style={{ fontSize: 12, color: colors.muted }}>{rt.via}</T>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <T style={{ fontFamily: font.semi, fontSize: 12, color: tc }}>{rt.traffic} traffic</T>
                      <T style={{ fontSize: 12, color: colors.muted }}>{rt.priceFactor === 1 ? "base fare" : `+${Math.round((rt.priceFactor - 1) * 100)}% traffic fare`}</T>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginTop: showRoutes ? 10 : 6 }} />

        {/* Section 2: ride options */}
        <T style={{ fontFamily: font.semi, fontSize: 12, color: colors.muted, letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 10 }}>CHOOSE A RIDE</T>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {[...RIDE_TYPES].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0)).map((r) => {
            const on = r.id === selected.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => selectRide(r)}
                style={{ flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: on ? 2 : 0, borderColor: colors.text, marginBottom: 8 }}
              >
                <View style={{ width: 86 }}><Vehicle kind={r.emoji as VehicleKind} size={52} /></View>
                <View style={{ flex: 1 }}>
                  <Row style={{ gap: 6 }}>
                    <T style={{ fontFamily: font.bold, fontSize: 18 }}>{r.name}</T>
                    {r.ac && <Ionicons name="snow" size={14} />}
                    <Ionicons name="person" size={12} />
                    <T style={{ fontFamily: font.semi, fontSize: 13 }}>{r.seats}</T>
                  </Row>
                  <T style={{ color: colors.muted, fontFamily: font.medium, marginTop: 2 }}>
                    {route ? clockTime(etaOf(r.id, r.etaMin) + route.minutes) : "--"} · {etaOf(r.id, r.etaMin)} min · {r.id === "pool" ? (pool.length ? `${pool.length} riders going your way` : "waiting for a match") : `${dispatches[r.id].candidates.length} nearby`}
                  </T>
                  <Row style={{ gap: 6, marginTop: 6 }}>
                    {r.id === fastestId && (
                      <Row style={{ backgroundColor: colors.blue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, gap: 4 }}>
                        <Ionicons name="flash" size={12} color={colors.onInk} />
                        <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>Fastest</T>
                      </Row>
                    )}
                    {r.id === cheapestId && (
                      <View style={{ backgroundColor: colors.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                        <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>Cheapest</T>
                      </View>
                    )}
                    {r.tag && (
                      <View style={{ backgroundColor: "#6B6B6B", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                        <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>{r.tag}</T>
                      </View>
                    )}
                  </Row>
                </View>
                <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 18 }}>{route ? `₹${priceOf(r).toFixed(2)}` : ""}</T>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16, paddingBottom: 28, gap: 12 }}>
          <Row style={{ gap: 10 }}>
            <Ionicons name="woman-outline" size={22} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.semi, fontSize: 15 }}>Women drivers only</T>
              <T style={{ color: colors.muted, fontSize: 12 }}>{womenOnly ? (disp.candidates.length ? `${disp.candidates.length} women drivers nearby` : "No women drivers nearby right now") : "Ask for a woman driver on this ride"}</T>
            </View>
            <Switch value={womenOnly} onValueChange={(v) => useTripStore.setState({ womenOnly: v })} trackColor={{ true: colors.green }} />
          </Row>
          {(() => {
            const f = favs.find((x) => servesRide(x.vehicle, selected.id));
            return f ? (
              <Row style={{ gap: 10 }}>
                <Ionicons name="heart" size={22} color={colors.red} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.semi, fontSize: 15 }}>Ask {shortName(f.name)} first</T>
                  <T style={{ color: colors.muted, fontSize: 12 }}>Your favourite {selected.name} driver</T>
                </View>
                <Switch value={favDriver === f.id} onValueChange={(v) => useTripStore.setState({ favDriver: v ? f.id : null })} trackColor={{ true: colors.green }} />
              </Row>
            ) : null;
          })()}
          <Row onPress={() => router.push("/(root)/pay-with")} style={{ gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#CDEFB2", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={PAY_ICON[payment]} size={24} color="#1B5E20" />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 18 }}>{bizActive ? `Business · ${payment}` : payment}</T>
              {split.length > 0 && <T style={{ color: colors.blue, fontSize: 12, fontFamily: font.semi }}>Split with {split.length} · about ₹{(priceOf(selected) / (split.length + 1)).toFixed(0)} each</T>}
              {voucher && <T style={{ color: colors.green, fontSize: 12 }}>Voucher {voucher} applied · 10% off</T>}
            </View>
            <Ionicons name="chevron-forward" size={20} />
          </Row>
          {womenOnly && disp.candidates.length === 0 && (
            <Button title="Show all drivers instead" variant="outline" onPress={() => useTripStore.setState({ womenOnly: false })} />
          )}
          <Button title={womenOnly && disp.candidates.length === 0 ? "No women drivers nearby" : `Choose ${selected.name}`} disabled={womenOnly && disp.candidates.length === 0} onPress={book} />
        </View>
      </View>
    </View>
  );
};

export default ChooseRide;
