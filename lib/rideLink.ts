import Constants from "expo-constants";
import { Platform } from "react-native";

import { trackLink } from "@/lib/tripShare";
import { useAuthStore, useTripStore } from "@/store";

// A link that carries the ride details inside it, so anyone can open it on the hosted app with no tracking server running.
// (The live-map link in tripShare.ts needs the server; this one always works, and shows the details as of when it was shared.)
export type RideCard = {
  rider: string;
  driver?: { name: string; vehicle: string; plate: string };
  pickup: string;
  drop?: string;
  fare: number;
  ride: string;
  km?: number;
  minutes?: number;
  at: number;
  /** live tracking page for this ride, shown on the details page */
  live?: string;
};

const enc = (s: string) => encodeURIComponent(s);

/** Where the hosted app lives. Set EXPO_PUBLIC_WEB_URL (for example your Netlify address); on the web it is the current site. */
export const webBase = () => {
  if (process.env.EXPO_PUBLIC_WEB_URL) return process.env.EXPO_PUBLIC_WEB_URL.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.origin;
  const h = (Constants.expoConfig as any)?.hostUri as string | undefined;
  return `http://${h ? h.split(":")[0] : "localhost"}:8081`;
};

export const currentRideCard = (): RideCard => {
  const t = useTripStore.getState();
  const route = t.routes[t.routeIndex];
  return {
    rider: useAuthStore.getState().name.split(" ")[0],
    driver: t.driver ? { name: t.driver.name, vehicle: t.driver.vehicle, plate: t.driver.plate } : undefined,
    pickup: t.pickup.name,
    drop: t.destination?.name,
    fare: t.fare,
    ride: t.rideType?.name ?? "Ride",
    km: route?.km,
    minutes: route?.minutes,
    at: Date.now(),
    live: t.requestId ? trackLink(t.requestId) : undefined,
  };
};

export const rideLink = (c: RideCard) => `${webBase()}/ride?d=${enc(JSON.stringify(c))}`;

export const parseRideCard = (d?: string): RideCard | null => {
  try {
    const c = JSON.parse(d ?? "");
    return c && typeof c.pickup === "string" ? c : null;
  } catch {
    return null;
  }
};
