import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useAnalytics } from "@/lib/analytics";
import { cacheHit, cacheMiss, LruCache, TokenBucket } from "@/lib/cache";
import { haversineKm, nearbyFrom, Place, PLACES, recentFrom } from "@/lib/mock";
import { fmtVisits, popularNear } from "@/lib/popular";
import { useHistoryStore, useSavedStore, useTripStore } from "@/store";

// Free OpenStreetMap search (Nominatim), biased to the rider's area.
const searchCache = new LruCache<Place[]>(30, 10 * 60 * 1000);
const searchLimiter = new TokenBucket(2, 1); // Nominatim asks for at most 1 request per second

const searchOnline = async (q: string, near: Place): Promise<Place[]> => {
  const key = q.toLowerCase();
  const hit = searchCache.get(key);
  if (hit) {
    cacheHit();
    return hit;
  }
  cacheMiss();
  if (!searchLimiter.take()) return searchCache.get(key, true) ?? [];
  const d = 0.25;
  const box = `${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&viewbox=${box}&q=${encodeURIComponent(q)}`, {
      headers: Platform.OS === "web" ? undefined : { "User-Agent": "Routiq/1.0 (student project)" },
    });
    const json = (await res.json()) as any[];
    const out = json.map((r) => {
      const [name, ...rest] = String(r.display_name).split(", ");
      return { id: `osm-${r.place_id}`, name, address: rest.slice(0, 3).join(", "), latitude: +r.lat, longitude: +r.lon };
    });
    searchCache.set(key, out);
    return out;
  } catch {
    return [];
  }
};

const WhereTo = () => {
  const { pickup, setDestination } = useTripStore();
  const rides = useHistoryStore((s) => s.rides);
  const { home, work, save } = useSavedStore();
  const [q, setQ] = useState("");
  const [online, setOnline] = useState<Place[]>([]);
  const [saving, setSaving] = useState<"home" | "work" | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [when, setWhen] = useState(0);
  const [who, setWho] = useState(0);
  const WHEN = ["Pickup now", "Pickup in 30 min", "Pickup in 1 hour"];
  const WHO = ["For me", "For someone else"];

  const recents = recentFrom(rides, 3);
  const popular = popularNear(pickup, rides, 6, recents);
  const nearby = nearbyFrom(pickup, [...recents, ...popular.map((x) => x.place)]);
  const local = PLACES.filter((p) => `${p.name} ${p.address}`.toLowerCase().includes(q.toLowerCase()));
  const kmTo = (p: Place) => haversineKm(pickup, p) / 1.35;

  useEffect(() => {
    if (q.trim().length < 3) return setOnline([]);
    const t = setTimeout(() => searchOnline(q.trim(), pickup).then(setOnline), 700);
    return () => clearTimeout(t);
  }, [q, pickup]);

  const go = (p: Place) => {
    useAnalytics.getState().setSource("search");
    setDestination(p);
    router.push("/(root)/choose-ride");
  };

  // Picking a place either saves it as Home/Work (when "Add Home/Work" was tapped) or starts the booking.
  const pick = (p: Place) => {
    if (saving) {
      save(saving, p);
      setSaving(null);
      setQ("");
      return;
    }
    go(p);
  };

  // Left column like the real app: a small icon with the distance underneath, then name and address.
  const row = (p: Place, icon: any, showKm = true, sub?: string) => (
    <Pressable key={p.id} onPress={() => pick(p)} style={{ flexDirection: "row", gap: 14, paddingHorizontal: 20, paddingVertical: 12, alignItems: "flex-start" }}>
      <View style={{ width: 46, alignItems: "center", paddingTop: 2 }}>
        <Ionicons name={icon} size={20} />
        {showKm && <T style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{kmTo(p).toFixed(1)} km</T>}
      </View>
      <View style={{ flex: 1 }}>
        <T numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 16 }}>{p.name}</T>
        <T numberOfLines={1} style={{ color: colors.muted }}>{sub ?? p.address}</T>
      </View>
    </Pressable>
  );

  const heading = (t: string) => <T style={{ fontFamily: font.semi, fontSize: 12, color: colors.muted, letterSpacing: 0.5, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 2 }}>{t}</T>;

  const pill = (icon: any, label: string, onPress?: () => void, active = false) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: active ? colors.ink : colors.card }}>
      <Ionicons name={icon} size={15} color={active ? colors.onInk : colors.text} />
      <T style={{ fontFamily: font.semi, fontSize: 14, color: active ? colors.onInk : colors.text }}>{label}</T>
    </Pressable>
  );

  const chip = (kind: "home" | "work") => {
    const place = kind === "home" ? home : work;
    const icon = kind === "home" ? "home-outline" : "briefcase-outline";
    const base = kind === "home" ? "Home" : "Work";
    return pill(icon, place ? base : `Add ${base}`, () => (place ? go(place) : setSaving(saving === kind ? null : kind)), saving === kind);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, justifyContent: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ position: "absolute", left: 16 }}>
          <Ionicons name="arrow-back" size={26} />
        </Pressable>
        <T style={{ fontFamily: font.bold, fontSize: 18 }}>Plan your ride</T>
      </Row>

      <Row style={{ gap: 10, paddingHorizontal: 20, marginTop: 10 }}>
        <Row onPress={() => setWhen((when + 1) % WHEN.length)} style={{ gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 20, height: 38, paddingHorizontal: 14 }}>
          <Ionicons name="time-outline" size={16} />
          <T style={{ fontFamily: font.semi, fontSize: 14 }}>{WHEN[when]}</T>
          <Ionicons name="chevron-down" size={14} />
        </Row>
        <Row onPress={() => setWho((who + 1) % WHO.length)} style={{ gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 20, height: 38, paddingHorizontal: 14 }}>
          <Ionicons name="person-outline" size={16} />
          <T style={{ fontFamily: font.semi, fontSize: 14 }}>{WHO[who]}</T>
          <Ionicons name="chevron-down" size={14} />
        </Row>
      </Row>

      <Row style={{ marginHorizontal: 20, marginTop: 14, gap: 10, alignItems: "stretch" }}>
        <View style={{ flex: 1, flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
          <View style={{ alignItems: "center", paddingTop: 14 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink }} />
            <View style={{ width: 2, flex: 1, backgroundColor: colors.ink, marginVertical: 3 }} />
            <View style={{ width: 9, height: 9, backgroundColor: colors.ink, marginBottom: 14 }} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 42, justifyContent: "center" }}>
              <T numberOfLines={1} style={{ fontFamily: font.medium, fontSize: 16 }}>{pickup.name}</T>
            </View>
            <View style={{ height: 44, backgroundColor: colors.bg, borderRadius: 8, borderWidth: 1.5, borderColor: colors.text, paddingHorizontal: 10, justifyContent: "center" }}>
              <TextInput autoFocus value={q} onChangeText={setQ} placeholder={saving ? `Search a place to save as ${saving === "home" ? "Home" : "Work"}` : "Where to?"} style={{ color: colors.text, fontSize: 16, fontFamily: font.medium, ...noOutline } as any} />
            </View>
          </View>
        </View>

      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, height: 46, marginTop: 14 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, alignItems: "center" }} keyboardShouldPersistTaps="handled">
        {chip("home")}
        {chip("work")}
        {pill("star-outline", "Saved places", () => setShowSaved((v) => !v), showSaved)}
      </ScrollView>
      {saving && <T style={{ color: colors.muted, fontSize: 13, paddingHorizontal: 20, marginTop: 8 }}>Pick a place below to save it as {saving === "home" ? "Home" : "Work"}.</T>}

      <ScrollView keyboardShouldPersistTaps="handled" style={{ marginTop: 6 }}>
        {showSaved && (
          <>
            {heading("SAVED PLACES")}
            {!home && !work && <T style={{ color: colors.muted, paddingHorizontal: 20, paddingVertical: 8 }}>Nothing saved yet. Tap Add Home or Add Work.</T>}
            {home && row(home, "home-outline", true, `Home · ${home.address}`)}
            {work && row(work, "briefcase-outline", true, `Work · ${work.address}`)}
          </>
        )}
        {q.trim() === "" ? (
          <>
            {recents.length > 0 && heading("RECENT")}
            {recents.map((p) => row(p, "time-outline"))}
            {heading("POPULAR NEAR YOU")}
            {popular.map((x) => row(x.place, "trending-up", true, `${x.place.address} · ${fmtVisits(x.visits)}`))}
            {heading("NEARBY")}
            {nearby.map(({ place }) => row(place, "location-outline"))}
          </>
        ) : (
          <>
            {local.length > 0 && heading("SAVED & POPULAR")}
            {local.map((p) => row(p, "location-outline"))}
            {online.length > 0 && heading("MORE RESULTS")}
            {online.map((p) => row(p, "search"))}
            {local.length + online.length === 0 && <T style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>No places found. Check the spelling, or try a nearby landmark or area name.</T>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WhereTo;
