import * as Location from "expo-location";
import { create } from "zustand";

// The driver's own position from the phone (GPS on a phone, the browser's location on web).
export type LocState = "idle" | "asking" | "ready" | "denied" | "unavailable";

export const useDriverLoc = create<{ pos: { latitude: number; longitude: number } | null; place: string; state: LocState }>(() => ({ pos: null, place: "", state: "idle" }));

let sub: { remove: () => void } | null = null;

export const startDriverLocation = async () => {
  if (sub) return;
  useDriverLoc.setState({ state: "asking" });
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return useDriverLoc.setState({ state: "denied" });
    let named = false;
    sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 4000 }, async (p) => {
      useDriverLoc.setState({ pos: { latitude: p.coords.latitude, longitude: p.coords.longitude }, state: "ready" });
      if (!named) {
        named = true;
        try {
          const [a] = await Location.reverseGeocodeAsync(p.coords);
          useDriverLoc.setState({ place: [a?.district || a?.street, a?.city].filter(Boolean).join(", ") });
        } catch {}
      }
    });
  } catch {
    useDriverLoc.setState({ state: "unavailable" });
  }
};

export const stopDriverLocation = () => {
  sub?.remove();
  sub = null;
};
