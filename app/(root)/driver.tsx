import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@/components/Icon";
import { useConfirm } from "@/components/Confirm";
import { useOffline } from "@/components/OfflineBanner";
import Card from "@/components/driver/Card";
import DriverHeader from "@/components/driver/DriverHeader";
import Earnings from "@/components/driver/Earnings";
import NavCard from "@/components/driver/NavCard";
import PinPanel from "@/components/driver/PinPanel";
import RadarCard from "@/components/driver/RadarCard";
import StageStepper from "@/components/driver/StageStepper";
import TopBar from "@/components/driver/TopBar";
import TripMap from "@/components/driver/TripMap";
import { Button, Row, T } from "@/components/ui";
import { DEMO } from "@/constants/config";
import { colors, font } from "@/constants/theme";
import { useDriverStore } from "@/store/extras";
import { toBatches } from "@/lib/dispatch";
import { startDriverLocation, useDriverLoc } from "@/lib/driverLoc";
import { haversineKm } from "@/lib/mock";
import { CLASS_LABEL, classOf, servesRide } from "@/lib/fleet";
import { avgSpeed, fmtClock, nextTurn, stageIndex, stageTitle } from "@/lib/driverNav";
import { openGoogleMaps } from "@/lib/maps";
import { useAuthStore, useHistoryStore, useTripStore } from "@/store";

// Driver screen. This file only reads the stores and chooses which stage to show; each stage's look lives in
// components/driver and the route and time maths in lib/driverNav.
const Driver = () => {
  const trip = useTripStore();
  const { status, dispatch, batchNo, destination, pickup, fare, tip, rideType, routes, routeIndex, progress, etaSec, driver, driverPos } = trip;
  const { role, name, vehicle, plate, signOut } = useAuthStore();
  const rides = useHistoryStore((s) => s.rides);
  const [online, setOnline] = useState(true);

  const isDriver = role === "driver";
  const wave = useMemo(() => toBatches(dispatch?.candidates ?? [])[batchNo], [dispatch, batchNo]);
  const route = routes[routeIndex];
  const me = isDriver ? { name, vehicle, plate } : driver ?? wave?.[0];
  const turn = useMemo(() => nextTurn(route, progress), [route, progress]);
  const speed = avgSpeed(route);
  const earned = rides.reduce((t, r) => t + r.fare, 0);

  const [ask, dialog] = useConfirm();
  const leave = () => {
    if (isDriver) {
      ask({ title: "Sign out?", message: status === "idle" || status === "completed" ? "You will stop receiving ride requests." : "You have a trip in progress. Finish it before signing out.", confirm: "Sign out", destructive: true, onConfirm: () => { signOut(); router.replace("/(auth)/welcome"); } });
    } else if (router.canGoBack()) router.back();
    else router.replace(status === "idle" ? "/(root)/(tabs)/home" : "/(root)/trip");
  };
  const mapProps = destination ? { pickup, destination, routes, routeIndex, driverPos: status === "driver_assigned" ? driverPos : null, progress: status === "in_progress" ? progress : null } : null;
  const startTrip = (pin: string) => {
    if (!trip.startTrip(pin)) return false;
    if (destination) openGoogleMaps(destination, pickup); // the trip has started: directions to the drop-off
    return true;
  };

  const loc = useDriverLoc();
  useEffect(() => {
    if (isDriver) startDriverLocation();
  }, [isDriver]);
  // how far the driver really is from the pickup, from the phone's GPS (falls back to the simulated figure)
  const away = loc.pos ? (() => { const km = +(haversineKm({ ...pickup, ...loc.pos }, pickup) * 1.3).toFixed(1); return { km, min: Math.max(1, Math.ceil((km / 25) * 60)) }; })() : { km: wave?.[0]?.km ?? 0, min: wave?.[0]?.etaMin ?? 0 };
  const offline = useOffline();
  const showStage = online || !isDriver;
  // an auto driver only gets auto requests, a bike driver bike requests, a car driver car requests
  const myClass = classOf(vehicle);
  const options = rideType ? [{ type: rideType, price: fare }, ...trip.extras] : [];
  const mine = options.find((o) => servesRide(vehicle, o.type.id)); // the ride option this driver can take
  const myGender = useDriverStore((d) => d.gender);
  const womenOk = !trip.womenOnly || !isDriver || myGender === "woman"; // women-rider requests go to women drivers only
  const fits = !isDriver || !rideType || (!!mine && womenOk);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      {dialog}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <TopBar isDriver={isDriver} online={online} onOnline={setOnline} onLeave={leave} onProfile={isDriver ? () => router.push("/(root)/driver-account" as any) : undefined} />
        <DriverHeader title={online || !isDriver ? stageTitle(status) : "You're offline"} name={me?.name} vehicle={me?.vehicle} plate={me?.plate} onPress={isDriver ? () => router.push("/(root)/driver-account" as any) : undefined} />
        {isDriver && (
          <Row onPress={() => loc.state !== "ready" && startDriverLocation()} style={{ gap: 8, marginTop: 12, alignSelf: "flex-start", backgroundColor: colors.bg, paddingHorizontal: 12, height: 34, borderRadius: 17 }}>
            <Ionicons name={loc.state === "ready" ? "location" : "location-outline"} size={16} color={loc.state === "ready" ? colors.green : colors.red} />
            <T style={{ fontSize: 13, fontFamily: font.semi }}>{loc.state === "ready" ? (loc.place || "Using your current location") : loc.state === "asking" ? "Finding your location…" : "Location is off. Tap to turn on"}</T>
          </Row>
        )}
        {showStage && status !== "idle" && <StageStepper active={stageIndex(status)} />}

        {!online && isDriver && (
          <Card style={{ marginTop: 20 }}>
            <T style={{ fontFamily: font.bold, fontSize: 18 }}>You're offline</T>
            <T style={{ color: colors.muted, marginTop: 4 }}>Go online to see ride requests near you.</T>
            <Button title="Go online" onPress={() => setOnline(true)} style={{ marginTop: 14 }} />
          </Card>
        )}

        {showStage && status === "idle" && (
          <>
            <Card style={{ marginTop: 20 }}>
              <T style={{ fontFamily: font.bold, fontSize: 18 }}>Looking for ride requests…</T>
              <T style={{ color: offline ? colors.red : colors.muted, marginTop: 4 }}>{offline ? "No internet. You can not get requests until you are back online." : "New requests near you will appear here. Book a ride from the rider side to send one."}</T>
            </Card>
            <Earnings trips={rides.length} total={earned} />
            <Row style={{ gap: 12, marginTop: 12 }}>
              {([["wallet-outline", "Earnings", "/(root)/driver-earnings"], ["person-outline", "My account", "/(root)/driver-account"], ["help-buoy-outline", "Help", "/(root)/help"]] as const).map(([ic, label, to]) => (
                <Pressable key={label} accessibilityRole="button" onPress={() => router.push(to as any)} style={({ pressed }) => ({ flex: 1, minHeight: 84, borderRadius: 18, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 6, opacity: pressed ? 0.7 : 1 })}>
                  <Ionicons name={ic} size={26} />
                  <T style={{ fontFamily: font.semi, fontSize: 14 }}>{label}</T>
                </Pressable>
              ))}
            </Row>
            {isDriver && (
              <Button title="Go offline" variant="grey" onPress={() => setOnline(false)} style={{ marginTop: 14 }} />
            )}
          </>
        )}

        {showStage && status === "searching" && !fits && !womenOk && (
          <Card>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>A women-rider request is nearby</T>
            <T style={{ color: colors.muted, marginTop: 4 }}>This rider asked for a woman driver, so it goes to women drivers. You can set your profile in My account.</T>
          </Card>
        )}
        {showStage && status === "searching" && !fits && womenOk && (
          <Card>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>A {rideType?.name} request is nearby</T>
            <T style={{ color: colors.muted, marginTop: 4 }}>Your vehicle ({myClass.toLowerCase()}) takes {CLASS_LABEL[myClass]} requests, so this one goes to other drivers.</T>
          </Card>
        )}
        {showStage && status === "searching" && fits &&
          (wave && destination && route ? (
            <>
              <RadarCard
                req={{ product: (isDriver ? mine?.type.name : undefined) ?? rideType?.name ?? "Routiq", fare: isDriver && mine ? (mine.type.id === rideType?.id ? fare : mine.price + trip.boost) : fare, viewers: wave.length, awayMin: away.min, awayKm: away.km, pickup: pickup.name, tripMin: route.minutes, tripKm: route.km, dest: destination.name }}
                onAccept={trip.acceptRide}
                onDecline={trip.declineBatch}
              />
              <T style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>Batch {batchNo + 1}. Declining passes the request to the next batch of drivers.</T>
            </>
          ) : (
            <Card>
              <T style={{ color: colors.muted }}>All nearby drivers declined. The rider can cancel and try again.</T>
            </Card>
          ))}

        {showStage && status === "driver_assigned" && mapProps && (
          <>
            <TripMap {...mapProps} height={260} />
            <Card>
              <T style={{ color: colors.muted, fontSize: 12, letterSpacing: 0.5 }}>PICKUP</T>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>{pickup.name}</T>
              <T style={{ fontFamily: font.extra, fontSize: 28, marginTop: 6 }}>{etaSec > 0 ? `Arriving in ${fmtClock(etaSec)}` : "You're at the pickup"}</T>
                            <Row style={{ gap: 10, marginTop: 14 }}>
                <Button title="Google Maps" variant="grey" onPress={() => openGoogleMaps(pickup, driverPos ? { ...pickup, latitude: driverPos.latitude, longitude: driverPos.longitude } : undefined)} style={{ flex: 1, height: 48 }} />
                <Button title="Message" variant="grey" onPress={() => router.push("/(root)/chat")} style={{ flex: 1, height: 48 }} />
              </Row>
              <Button title="I've arrived" onPress={trip.markArrived} style={{ marginTop: 10 }} />
            </Card>
            <NavCard destination={pickup.name} instruction="Head to the pickup point" distance={etaSec > 0 ? fmtClock(etaSec) : ""} speed={speed} />
          </>
        )}

        {showStage && status === "driver_arrived" && mapProps && (
          <>
            <TripMap {...mapProps} height={200} />
            <PinPanel onSubmit={startTrip} />
          </>
        )}

        {showStage && status === "in_progress" && mapProps && destination && (
          <>
            <TripMap {...mapProps} height={260} />
            <NavCard destination={destination.name} instruction={turn.text} distance={turn.dist} speed={speed} />
            <Card>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
                <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.green, borderRadius: 3 }} />
              </View>
              <Row style={{ gap: 10, marginTop: 14 }}>
                <Button title="Google Maps" variant="grey" onPress={() => openGoogleMaps(destination, pickup)} style={{ flex: 1, height: 48 }} />
                <Button title="End trip" disabled={progress < 1} onPress={trip.endTrip} style={{ flex: 1, height: 48 }} />
              </Row>
              {progress < 1 && <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>End trip unlocks when you reach the destination.</T>}
            </Card>
          </>
        )}

        {status === "completed" && (
          <Card style={{ marginTop: 20 }}>
            <T style={{ color: colors.muted, fontSize: 12, letterSpacing: 0.5 }}>YOU EARNED</T>
            <T style={{ fontFamily: font.extra, fontSize: 38 }}>₹{(fare + tip).toFixed(2)}</T>
            <T style={{ color: colors.muted, marginTop: 2 }}>Trip complete{tip ? `, including a ₹${tip} tip` : ""}. Great job!</T>
          </Card>
        )}

        {isDriver && (status === "driver_assigned" || status === "driver_arrived" || status === "in_progress") && (
          <Row style={{ gap: 12, marginTop: 14 }}>
            <Button title="Safety" variant="grey" onPress={() => router.push("/(root)/safety" as any)} style={{ flex: 1, height: 50 }} />
            <Button title="Help" variant="grey" onPress={() => router.push("/(root)/help" as any)} style={{ flex: 1, height: 50 }} />
          </Row>
        )}

        {DEMO && <Card style={{ marginTop: 24 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold }}>Auto-play (demo)</T>
              <T style={{ color: colors.muted, fontSize: 12 }}>Does the driver's steps on timers. Off = you control each step.</T>
            </View>
            <Switch value={trip.autopilot} onValueChange={trip.setAutopilot} trackColor={{ true: colors.green }} />
          </Row>
        </Card>}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Driver;
