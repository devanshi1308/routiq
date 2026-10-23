import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, View } from "react-native";

import { useConfirm } from "@/components/Confirm";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { Place, RIDE_TYPES } from "@/lib/mock";
import { useSavedStore, useTripStore } from "@/store";
import { CommutePlace, useCommuteStore, useFavStore } from "@/store/extras";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
export const dayText = (d: number[]) => (d.length === 7 ? "Every day" : [1, 2, 3, 4, 5].every((x) => d.includes(x)) && d.length === 5 ? "Weekdays" : d.map((x) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][x]).join(", "));
const toPlace = (p: Place): CommutePlace => ({ name: p.name, address: p.address, latitude: p.latitude, longitude: p.longitude });
const pad = (n: number) => String(n).padStart(2, "0");

// Daily commute: a repeating ride, with the same favourite driver if you like.
const Commute = () => {
  const { plans, add, remove, toggle } = useCommuteStore();
  const { home, work } = useSavedStore();
  const favs = useFavStore((s) => s.items);
  const pickup = useTripStore((s) => s.pickup);
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState(9);
  const [min, setMin] = useState(0);
  const [rideId, setRideId] = useState("auto");
  const [fav, setFav] = useState(false);
  const [back, setBack] = useState(false);
  const [ask, dialog] = useConfirm();
  const ready = !!home && !!work;

  const save = () => {
    if (!home || !work) return;
    const [from, to] = back ? [work, home] : [home, work];
    add({ label: back ? "Work to Home" : "Home to Work", from: toPlace(from), to: toPlace(to), days, time: `${pad(hour)}:${pad(min)}`, rideId, favourite: fav && favs.length > 0, on: true });
  };
  const bookNow = (p: (typeof plans)[number]) => {
    const t = useTripStore.getState();
    t.setPreferred(p.rideId);
    t.setPickup({ id: "commute-from", ...p.from });
    t.setDestination({ id: "commute-to", ...p.to });
    useTripStore.setState({ favDriver: p.favourite ? favs.find((f) => f.rideId === p.rideId)?.id ?? favs[0]?.id ?? null : null });
    router.push("/(root)/choose-ride");
  };

  return (
    <Page title="Daily commute" art={require("../../assets/illustrations/commute-map.webp")}>
      {dialog}
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Set up a ride you take every day. At the time you chose, Home shows a one-tap "Book" card.</T>

      {plans.map((p) => (
        <View key={p.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 14 }}>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 18 }}>{p.label} · {p.time}</T>
              <T style={{ color: colors.muted, fontSize: 13 }}>{dayText(p.days)} · {RIDE_TYPES.find((r) => r.id === p.rideId)?.name}{p.favourite ? " · favourite driver first" : ""}</T>
            </View>
            <Switch value={p.on} onValueChange={() => toggle(p.id)} trackColor={{ true: colors.green }} />
          </Row>
          <Row style={{ gap: 10, marginTop: 12 }}>
            <Button title="Book now" onPress={() => bookNow(p)} style={{ flex: 1.4, height: 44 }} />
            <Button title="Delete" variant="grey" onPress={() => ask({ title: "Delete this commute?", confirm: "Delete", destructive: true, onConfirm: () => remove(p.id) })} style={{ flex: 1, height: 44 }} />
          </Row>
        </View>
      ))}

      <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 28 }}>New daily commute</T>
      {!ready ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 10 }}>
          <T style={{ color: colors.muted }}>Save your Home and Work places first. Open Plan your ride and tap Add Home and Add Work.</T>
          <Button title="Set Home and Work" onPress={() => router.push("/(root)/where-to")} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <>
          <Row style={{ gap: 8, marginTop: 12 }}>
            {[false, true].map((b) => (
              <T key={String(b)} onPress={() => setBack(b)} style={{ flex: 1, textAlign: "center", paddingVertical: 12, borderRadius: 12, overflow: "hidden", fontFamily: font.semi, backgroundColor: back === b ? colors.ink : colors.card, color: back === b ? colors.onInk : colors.text }}>{b ? "Work to Home" : "Home to Work"}</T>
            ))}
          </Row>
          <T style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>{back ? work!.name : home!.name} to {back ? home!.name : work!.name}</T>

          <Row style={{ gap: 6, marginTop: 14 }}>
            {DAYS.map((d, i) => (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]} onPress={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())} style={{ flex: 1, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: days.includes(i) ? colors.ink : colors.card }}>
                <T style={{ fontFamily: font.bold, color: days.includes(i) ? colors.onInk : colors.text }}>{d}</T>
              </Pressable>
            ))}
          </Row>

          <Row style={{ gap: 14, marginTop: 14, justifyContent: "center" }}>
            {[[hour, setHour, 24, "hour"], [min, setMin, 60, "minute"]].map(([v, set, mod, lab]: any, i) => (
              <Row key={lab} style={{ gap: 10 }}>
                <Pressable accessibilityLabel={`Earlier ${lab}`} onPress={() => set((v - (i ? 15 : 1) + mod) % mod)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}><T style={{ fontSize: 22 }}>−</T></Pressable>
                <T style={{ fontFamily: font.extra, fontSize: 30, minWidth: 44, textAlign: "center" }}>{pad(v)}</T>
                <Pressable accessibilityLabel={`Later ${lab}`} onPress={() => set((v + (i ? 15 : 1)) % mod)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}><T style={{ fontSize: 22 }}>+</T></Pressable>
                {i === 0 && <T style={{ fontFamily: font.extra, fontSize: 30 }}>:</T>}
              </Row>
            ))}
          </Row>

          <Row style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {RIDE_TYPES.filter((r) => ["auto", "go-ac", "bike", "taxi"].includes(r.id)).map((r) => (
              <T key={r.id} onPress={() => setRideId(r.id)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, overflow: "hidden", fontFamily: font.semi, backgroundColor: rideId === r.id ? colors.ink : colors.card, color: rideId === r.id ? colors.onInk : colors.text }}>{r.name}</T>
            ))}
          </Row>

          <Row style={{ gap: 10, marginTop: 14, opacity: favs.length ? 1 : 0.5 }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.semi }}>Ask a favourite driver first</T>
              <T style={{ color: colors.muted, fontSize: 12 }}>{favs.length ? "Your favourite driver gets the request before others." : "Add a favourite driver after a ride to use this."}</T>
            </View>
            <Switch value={fav && favs.length > 0} disabled={!favs.length} onValueChange={setFav} trackColor={{ true: colors.green }} />
          </Row>
          <Button title="Save commute" disabled={days.length === 0} onPress={save} style={{ marginTop: 16 }} />
        </>
      )}
      <T style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Pickup and drop are your saved Home and Work. Current location: {pickup.name}.</T>
    </Page>
  );
};

export default Commute;
