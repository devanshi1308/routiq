import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useConfirm } from "@/components/Confirm";
import Ionicons from "@/components/Icon";
import LiveMap from "@/components/LiveMap";
import { useOffline } from "@/components/OfflineBanner";
import SlideToAct from "@/components/SlideToAct";
import Card from "@/components/driver/Card";
import DriverDrawer, { DrawerItem } from "@/components/driver/DriverDrawer";
import DriverHero from "@/components/driver/DriverHero";
import NavCard from "@/components/driver/NavCard";
import PinPanel from "@/components/driver/PinPanel";
import RequestSheet from "@/components/driver/RequestSheet";
import StatusCard from "@/components/driver/StatusCard";
import { Button, Row, T } from "@/components/ui";
import { DEMO } from "@/constants/config";
import { colors, font } from "@/constants/theme";
import { toBatches } from "@/lib/dispatch";
import { MAX_REAL_KM, startDriverLocation, stopDriverLocation, useDriverLoc } from "@/lib/driverLoc";
import { avgSpeed, fmtClock, nextTurn } from "@/lib/driverNav";
import { CLASS_LABEL, classOf, servesRide } from "@/lib/fleet";
import { openGoogleMaps } from "@/lib/maps";
import { haversineKm } from "@/lib/mock";
import { useAuthStore, useHistoryStore, useNoticeStore, useTripStore } from "@/store";
import { useDriverStore } from "@/store/extras";

// Driver home: the map fills the screen, a small bar sits on top (menu, online switch, notifications) and the card at
// the bottom changes with the trip: today's status, a request to accept, going to pickup, the trip, then the earning.
const Driver = () => {
  const trip = useTripStore();
  const { status, dispatch, batchNo, destination, pickup, fare, tip, rideType, routes, routeIndex, progress, etaSec, driver, driverPos } = trip;
  const { role, name, vehicle, plate, approval, signOut } = useAuthStore();
  const unreadNotices = useNoticeStore((n) => n.items.length > 0);
  const walletPaid = useTripStore((t) => t.walletPaid);
  const rides = useHistoryStore((s) => s.rides);
  const online = useDriverStore((d) => d.online);
  const setOnline = useDriverStore((d) => d.setOnline);
  const rateRider = useDriverStore((d) => d.rateRider);
  const [collected, setCollected] = useState(false);
  const [stars, setStars] = useState(5);
  const [waited, setWaited] = useState(0);
  const [menu, setMenu] = useState(false);
  const { height: H } = useWindowDimensions();

  const isDriver = role === "driver";
  // a driver who has not finished the sign-up steps (or is waiting for review) cannot reach the home screen yet
  const wave = useMemo(() => toBatches(dispatch?.candidates ?? [])[batchNo], [dispatch, batchNo]);
  const route = routes[routeIndex];
  const turn = useMemo(() => nextTurn(route, progress), [route, progress]);
  const speed = avgSpeed(route);
  const cancelled = rides.filter((r) => r.status === "Cancelled").length;
  const completed = rides.length - cancelled;
  const earnings = rides.filter((r) => r.status !== "Cancelled").reduce((t, r) => t + r.fare * 0.9, 0); // driver keeps 90%

  const [ask, dialog] = useConfirm();
  const loc = useDriverLoc();
  // follow the phone's GPS only while this driver is online, and stop when they go offline or leave
  useEffect(() => {
    if (isDriver && online && approval === "approved") startDriverLocation();
    else stopDriverLocation();
    return () => stopDriverLocation();
  }, [isDriver, online, approval]);
  const offline = useOffline();

  // time spent waiting for the rider at the pickup (the first 5 minutes are free)
  useEffect(() => {
    if (status !== "driver_arrived") return setWaited(0);
    const t = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(t);
  }, [status]);
  useEffect(() => {
    if (status !== "completed") {
      setCollected(false);
      setStars(5);
    }
  }, [status]);

  const away = loc.pos && haversineKm({ ...pickup, ...loc.pos }, pickup) <= MAX_REAL_KM ? (() => { const km = +(haversineKm({ ...pickup, ...loc.pos }, pickup) * 1.3).toFixed(1); return { km, min: Math.max(1, Math.ceil((km / 25) * 60)) }; })() : { km: wave?.[0]?.km ?? 0, min: wave?.[0]?.etaMin ?? 0 };
  const showStage = online || !isDriver;

  // which requests this driver can take: by vehicle, and women-rider requests only for women drivers
  const myClass = classOf(vehicle);
  const options = rideType ? [{ type: rideType, price: fare }, ...trip.extras] : [];
  const mine = options.find((o) => servesRide(vehicle, o.type.id));
  const myGender = useDriverStore((d) => d.gender);
  const womenOk = !trip.womenOnly || !isDriver || myGender === "woman";
  const fits = !isDriver || !rideType || (!!mine && womenOk);
  const sprite = myClass === "Bike" ? "bike" : myClass === "Auto" ? "auto" : "car";

  const startTrip = (pin: string) => {
    if (!trip.startTrip(pin)) return false;
    if (destination) openGoogleMaps(destination, pickup);
    return true;
  };
  // the driver backs out after accepting: the request goes to the next drivers
  const driverCancel = () => {
    useNoticeStore.getState().push({ kind: "driver", title: "Your driver cancelled", body: "We are finding you another driver." });
    useTripStore.setState({ status: "searching", driver: null, etaSec: 0, driverPos: null, batchNo: batchNo + 1 });
  };
  const logout = () =>
    ask({ title: "Log out?", message: status === "idle" || status === "completed" ? "You will stop receiving ride requests." : "You have a trip in progress. Finish it first.", confirm: "Log out", destructive: true, onConfirm: () => { signOut(); router.replace("/(auth)/welcome"); } });

  const go = (to: string) => () => router.push(to as any);
  const items: DrawerItem[] = [
    { icon: "home-outline", label: "Home", onPress: () => {} },
    { icon: "person-outline", label: "My Profile", onPress: go("/(root)/driver-account") },
    { icon: "stats-chart-outline", label: "Dashboard", onPress: go("/(root)/driver-earnings") },
    { icon: "wallet-outline", label: "Wallet", onPress: go("/(root)/wallet") },
    { icon: "car-outline", label: "My Rides", onPress: go("/(root)/driver-earnings") },
    { icon: "people-outline", label: "Referral", onPress: go("/(root)/referral") },
    { icon: "settings-outline", label: "Manage", onPress: go("/(root)/driver-account") },
    { icon: "notifications-outline", label: "Notification", onPress: go("/(root)/notifications") },
    { icon: "help-buoy-outline", label: "Support", onPress: go("/(root)/help") },
    { icon: "pulse-outline", label: "App Status", onPress: go("/(root)/driver-status") },
    { icon: "log-out-outline", label: "Logout", onPress: logout, danger: true },
  ];

  if (isDriver && approval !== "approved") return <Redirect href={"/(auth)/driver-onboarding" as any} />;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(status === "idle" ? "/(root)/(tabs)/home" : "/(root)/trip");
  };

  // ---------- the map behind everything ----------
  const here = loc.pos ? { ...pickup, ...loc.pos, name: "You" } : pickup;
  const trackingTrip = !!destination && status !== "idle" && status !== "searching" && status !== "completed";
  const map = trackingTrip && destination ? (
    <LiveMap pickup={pickup} destination={destination} routes={routes} routeIndex={routeIndex} height={H} driverPos={status === "driver_assigned" ? driverPos : null} progress={status === "in_progress" ? progress : null} vehicleKind={sprite} tripMode />
  ) : (
    <LiveMap pickup={here} height={H} vehicles={[{ latitude: here.latitude, longitude: here.longitude, kind: sprite }]} vehicleKind={sprite} />
  );

  const reqCard = wave && destination && route ? { product: (isDriver ? mine?.type.name : undefined) ?? rideType?.name ?? "Routiq", fare: isDriver && mine ? (mine.type.id === rideType?.id ? fare : mine.price + trip.boost) : fare, viewers: wave.length, awayMin: away.min, awayKm: away.km, pickup: pickup.name, tripMin: route.minutes, tripKm: route.km, dest: destination.name } : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={StyleSheet.absoluteFill}>{map}</View>
      {dialog}
      <DriverDrawer visible={menu} name={name} vehicle={[vehicle, plate].filter(Boolean).join(" · ")} items={items} onClose={() => setMenu(false)} />

      <SafeAreaView pointerEvents="box-none" style={{ flex: 1, justifyContent: "space-between" }}>
        {isDriver && status === "idle" ? (
          <DriverHero
            name={name}
            online={online}
            unread={unreadNotices}
            onOnline={setOnline}
            onMenu={() => setMenu(true)}
            onBell={go("/(root)/notifications")}
            onSearch={(q) => router.push({ pathname: "/(root)/driver-earnings", params: { q } } as any)}
            onEarnings={go("/(root)/driver-earnings")}
            onRides={go("/(root)/driver-earnings")}
          />
        ) : (
        <Row style={{ justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 6 }}>
          {isDriver ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={() => setMenu(true)} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Ionicons name="menu" size={24} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={leave} style={{ height: 46, borderRadius: 23, paddingHorizontal: 16, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="arrow-back" size={20} />
              <T style={{ fontFamily: font.semi }}>Rider view</T>
            </Pressable>
          )}
          {isDriver && (
            <Row style={{ gap: 8, backgroundColor: online ? colors.green : colors.bg, borderRadius: 23, paddingLeft: 16, paddingRight: 6, height: 46 }}>
              <T style={{ fontFamily: font.extra, fontSize: 15, color: online ? "#fff" : colors.text }}>{online ? "Online" : "Offline"}</T>
              <Switch value={online} onValueChange={setOnline} trackColor={{ true: "#0b6b3a" }} thumbColor="#fff" />
            </Row>
          )}
          {isDriver ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={go("/(root)/notifications")} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="notifications-outline" size={22} />
            </Pressable>
          ) : (
            <View style={{ width: 46 }} />
          )}
        </Row>

        )}

        <View pointerEvents="box-none">
          {/* SOS */}
          {isDriver && (
            <Pressable accessibilityRole="button" accessibilityLabel="SOS emergency" onPress={go("/(root)/safety")} style={{ alignSelf: "flex-start", marginLeft: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.red }}>
              <Ionicons name="alert-circle" size={18} color={colors.red} />
              <T style={{ fontFamily: font.extra, color: colors.red }}>SOS</T>
            </Pressable>
          )}

          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 14, paddingBottom: 18, maxHeight: H * 0.62 }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!online && isDriver && (
                <Card style={{ marginTop: 0 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 18 }}>You're offline</T>
                  <T style={{ color: colors.muted, marginTop: 4 }}>Go online to see ride requests near you.</T>
                  <Button title="Go online" onPress={() => setOnline(true)} style={{ marginTop: 14 }} />
                </Card>
              )}

              {isDriver && online && (loc.state === "denied" || loc.state === "unavailable") && (
                <Card style={{ marginTop: 0, marginBottom: 10, borderWidth: 1.5, borderColor: colors.red }}>
                  <Row style={{ gap: 10 }}>
                    <Ionicons name="location-outline" size={24} color={colors.red} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold }}>{loc.state === "denied" ? "Location is off" : "Can't get your location"}</T>
                      <T style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Turn it on so riders can see you coming and you get nearby requests.</T>
                    </View>
                  </Row>
                  <Button title={loc.state === "denied" && Platform.OS !== "web" ? "Open settings" : "Try again"} variant="grey" onPress={() => (loc.state === "denied" && Platform.OS !== "web" ? Linking.openSettings() : (stopDriverLocation(), startDriverLocation()))} style={{ marginTop: 10, height: 44, backgroundColor: colors.card }} />
                </Card>
              )}

              {showStage && status === "idle" && (
                <>
                  <T style={{ color: offline ? colors.red : colors.muted, fontFamily: font.semi, marginBottom: 10, textAlign: "center" }}>{offline ? "No internet. You can not get requests." : "Looking for ride requests…"}</T>
                  <Pressable accessibilityRole="button" accessibilityLabel="Open earnings" onPress={go("/(root)/driver-earnings")}>
                    <StatusCard completed={completed} cancelled={cancelled} earnings={earnings} />
                  </Pressable>
                </>
              )}

              {showStage && status === "searching" && !fits && !womenOk && (
                <Card style={{ marginTop: 0 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 17 }}>A women-rider request is nearby</T>
                  <T style={{ color: colors.muted, marginTop: 4 }}>This rider asked for a woman driver, so it goes to women drivers. You can set your profile in My Profile.</T>
                </Card>
              )}
              {showStage && status === "searching" && !fits && womenOk && (
                <Card style={{ marginTop: 0 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 17 }}>A {rideType?.name} request is nearby</T>
                  <T style={{ color: colors.muted, marginTop: 4 }}>Your vehicle ({myClass.toLowerCase()}) takes {CLASS_LABEL[myClass]} requests, so this one goes to other drivers.</T>
                </Card>
              )}
              {showStage && status === "searching" && fits && (reqCard ? (
                <RequestSheet key={`${trip.requestId}-${batchNo}`} req={reqCard} onAccept={trip.acceptRide} onReject={trip.declineBatch} />
              ) : (
                <Card style={{ marginTop: 0 }}>
                  <T style={{ color: colors.muted }}>All nearby drivers declined. The rider can cancel and try again.</T>
                </Card>
              ))}

              {showStage && status === "driver_assigned" && destination && (
                <>
                  <Card style={{ marginTop: 0 }}>
                    <T style={{ fontFamily: font.extra, fontSize: 28 }}>{etaSec > 0 ? `Arriving in ${fmtClock(etaSec)}` : "You're at the pickup"}</T>
                    <Row style={{ gap: 10, marginTop: 10 }}>
                      <Ionicons name="location" size={18} color={colors.green} />
                      <T numberOfLines={1} style={{ flex: 1, fontFamily: font.semi }}>{pickup.name}</T>
                    </Row>
                    <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
                      <T style={{ color: colors.muted }}>Cash · {rideType?.name}</T>
                      <T style={{ fontFamily: font.bold }}>Distance {(haversineKm({ ...pickup, ...(driverPos ?? pickup) }, pickup) * 1.3).toFixed(1)} km</T>
                    </Row>
                    <Row style={{ gap: 10, marginTop: 14 }}>
                      <Button title="Message" variant="grey" onPress={go("/(root)/chat")} style={{ flex: 1, height: 48 }} />
                      <Button title="Map" variant="grey" onPress={() => openGoogleMaps(pickup, driverPos ? { ...pickup, latitude: driverPos.latitude, longitude: driverPos.longitude } : undefined)} style={{ flex: 1, height: 48 }} />
                    </Row>
                    <Button title="I've arrived" onPress={trip.markArrived} style={{ marginTop: 10 }} />
                  </Card>
                  <View style={{ marginTop: 12 }}>
                    <SlideToAct label="Slide to cancel" tone="red" onComplete={() => ask({ title: "Cancel this ride?", message: "The rider will be matched with another driver. Cancelling often can lower your rating.", confirm: "Cancel ride", destructive: true, onConfirm: driverCancel })} />
                  </View>
                  <NavCard destination={pickup.name} instruction="Head to the pickup point" distance={etaSec > 0 ? fmtClock(etaSec) : ""} speed={speed} />
                </>
              )}

              {showStage && status === "driver_arrived" && (
                <>
                  <Card style={{ marginTop: 0 }}>
                    <Row style={{ justifyContent: "space-between" }}>
                      <T style={{ fontFamily: font.bold }}>Waiting for the rider</T>
                      <T style={{ fontFamily: font.extra, color: waited > 300 ? colors.red : colors.text }}>{fmtClock(waited)}</T>
                    </Row>
                    <T style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{waited > 300 ? "Free waiting time is over. You can cancel if the rider does not come." : `The first 5 minutes are free (${fmtClock(Math.max(0, 300 - waited))} left).`}</T>
                  </Card>
                  <PinPanel onSubmit={startTrip} />
                  <View style={{ marginTop: 12 }}>
                    <SlideToAct label="Slide to cancel" tone="red" onComplete={() => ask({ title: "Cancel this ride?", message: "The rider will be matched with another driver.", confirm: "Cancel ride", destructive: true, onConfirm: driverCancel })} />
                  </View>
                </>
              )}

              {showStage && status === "in_progress" && destination && (
                <>
                  <NavCard destination={destination.name} instruction={turn.text} distance={turn.dist} speed={speed} />
                  <Card>
                    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
                      <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.green, borderRadius: 3 }} />
                    </View>
                    <Row style={{ gap: 10, marginTop: 14 }}>
                      <Button title="Map" variant="grey" onPress={() => openGoogleMaps(destination, pickup)} style={{ flex: 1, height: 48 }} />
                      <Button title="End trip" disabled={progress < 1} onPress={trip.endTrip} style={{ flex: 1, height: 48 }} />
                    </Row>
                    {progress < 1 && <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>End trip unlocks when you reach the destination.</T>}
                  </Card>
                </>
              )}

              {status === "completed" && (() => {
                const total = +((fare + tip) / (trip.split.length + 1)).toFixed(2); // what the rider pays
                const due = trip.payment === "Cash" ? Math.max(0, +(total - walletPaid).toFixed(2)) : 0;
                const needsCash = isDriver && due > 0 && !collected;
                return (
                  <Card style={{ marginTop: 0 }}>
                    <T style={{ color: colors.muted, fontSize: 12, letterSpacing: 0.5 }}>YOU EARNED</T>
                    <T style={{ fontFamily: font.extra, fontSize: 38 }}>₹{((fare + tip) * 0.9).toFixed(2)}</T>
                    <T style={{ color: colors.muted, marginTop: 2 }}>Trip complete{tip ? `, including a ₹${tip} tip` : ""}, after Routiq's 10% fee. Great job!</T>
                    {isDriver && (
                      <>
                        <View style={{ marginTop: 14, backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
                          <T style={{ fontFamily: font.bold }}>{due > 0 ? (collected ? `₹${due.toFixed(2)} cash collected` : `Collect ₹${due.toFixed(2)} in cash`) : "Paid in the app"}</T>
                          <T style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{due > 0 ? (collected ? "Thanks. You can rate the rider and finish." : "Take the cash from the rider before you finish.") : `Nothing to collect. ${trip.payment} was used.`}</T>
                          {needsCash && <Button title="Cash collected" variant="grey" onPress={() => setCollected(true)} style={{ marginTop: 10, height: 46, backgroundColor: colors.bg }} />}
                        </View>
                        <T style={{ fontFamily: font.bold, marginTop: 14 }}>Rate your rider</T>
                        <Row style={{ gap: 6, marginTop: 6 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`} onPress={() => setStars(n)} hitSlop={6}>
                              <Ionicons name={n <= stars ? "star" : "star-outline"} size={32} />
                            </Pressable>
                          ))}
                        </Row>
                        <Button title="Done" disabled={needsCash} onPress={() => { rateRider(stars); trip.reset(); }} style={{ marginTop: 14 }} />
                      </>
                    )}
                  </Card>
                );
              })()}

              {DEMO && (
                <Card style={{ marginTop: 12 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold }}>Auto-play (demo)</T>
                      <T style={{ color: colors.muted, fontSize: 12 }}>Does the driver's steps on timers. Off = you control each step.</T>
                    </View>
                    <Switch value={trip.autopilot} onValueChange={trip.setAutopilot} trackColor={{ true: colors.green }} />
                  </Row>
                </Card>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Driver;
