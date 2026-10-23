import * as Location from "expo-location";

import { useIntegrity } from "@/lib/integrity";
import { CURRENT_LOCATION, Place } from "@/lib/mock";
import { useTripStore } from "@/store";

// Detects the phone's real position (GPS on a phone, the browser's location on web) and uses it as the pickup.
// If permission is denied or the position can't be read, the default pickup stays.
export type LocationState = "idle" | "locating" | "ready" | "denied" | "unavailable";

const nameFrom = (a?: Location.LocationGeocodedAddress): { name: string; address: string } => {
  if (!a) return { name: "Current location", address: "" };
  const street = a.street || a.name || "";
  const area = a.district || a.subregion || a.city || "";
  const name = [street, area].filter(Boolean).join(", ") || "Current location";
  const address = [a.district, a.city, a.region].filter(Boolean).join(", ");
  return { name, address };
};

export const locate = async (): Promise<LocationState> => {
  const trip = useTripStore.getState();
  if (trip.status !== "idle") return "ready"; // never move the pickup during a ride
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return "denied";
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let info = { name: "Current location", address: "" };
    try {
      const [a] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      info = nameFrom(a);
    } catch {
      // reverse geocoding isn't available everywhere (for example in some browsers); keep the generic name
    }
    const place: Place = { id: "current", name: info.name, address: info.address, latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    useIntegrity.setState({ lastLoc: null }); // a new real position is not a "GPS jump"
    useTripStore.getState().setPickup(place);
    return "ready";
  } catch {
    return "unavailable";
  }
};

export { CURRENT_LOCATION };
