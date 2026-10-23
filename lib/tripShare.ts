import Constants from "expo-constants";
import { Platform } from "react-native";
import { create } from "zustand";

import { haversineKm } from "@/lib/mock";
import { useAuthStore, useTripStore } from "@/store";

// Live trip sharing. While a share is on, the app posts a snapshot of the trip every 2 seconds to the Routiq server
// (scripts/realtime-server.js). Anyone with the link opens /t/<trip id> and sees the map, route, ETA and driver.
const host = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.hostname;
  const h = (Constants.expoConfig as any)?.hostUri as string | undefined;
  return h ? h.split(":")[0] : "localhost";
};

/** Where the tracking server lives. Set EXPO_PUBLIC_TRACK_URL to a public address so people off your Wi-Fi can open links. */
export const trackBase = () => process.env.EXPO_PUBLIC_TRACK_URL || `http://${host()}:8787`;
export const trackLink = (id: string) => `${trackBase()}/t/${id}`;

export const useShareStore = create<{ sharingId: string | null; start: (id: string) => void; stop: () => void }>((set) => ({
  sharingId: null,
  start: (sharingId) => set({ sharingId }),
  stop: () => set({ sharingId: null }),
}));

// the longest ETA seen for this ride, so the page can show how far through the pickup the driver is
let etaMax = { id: "", sec: 0 };

export const snapshot = () => {
  const t = useTripStore.getState();
  const route = t.routes[t.routeIndex];
  if (etaMax.id !== t.requestId) etaMax = { id: t.requestId, sec: 0 };
  etaMax.sec = Math.max(etaMax.sec, t.etaSec);
  // distance still to go on the current leg: driver to pickup, then pickup to drop-off
  const kmLeft = t.status === "driver_assigned" && t.driverPos ? haversineKm({ ...t.pickup, ...t.driverPos }, t.pickup) * 1.3 : t.status === "in_progress" && route ? route.km * (1 - t.progress) : 0;
  return {
    status: t.status,
    look: t.rideType?.emoji ?? "sedan", // which picture to show: auto, bike, sedan, taxi, premier, van
    rider: useAuthStore.getState().name.split(" ")[0],
    driver: t.driver ? { name: t.driver.name, vehicle: t.driver.vehicle, plate: t.driver.plate, rating: 4.85 } : null,
    pickup: { name: t.pickup.name, latitude: t.pickup.latitude, longitude: t.pickup.longitude },
    destination: t.destination ? { name: t.destination.name, latitude: t.destination.latitude, longitude: t.destination.longitude } : null,
    coords: route?.coords ?? [],
    routeName: route?.name ?? "",
    km: route?.km ?? 0,
    minutes: route?.minutes ?? 0,
    progress: t.progress,
    etaSec: t.etaSec,
    etaTotal: etaMax.sec,
    kmLeft: +kmLeft.toFixed(1),
    driverPos: t.driverPos,
  };
};

export const pushSnapshot = async (id: string) => {
  try {
    await fetch(`${trackBase()}/trip/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot()) });
    return true;
  } catch {
    return false; // server not running: the link will not load until it is
  }
};

let started = false;
export const startTripSharing = () => {
  if (started) return;
  started = true;
  setInterval(() => {
    const id = useShareStore.getState().sharingId;
    if (!id) return;
    const s = useTripStore.getState().status;
    pushSnapshot(id);
    if (s === "completed" || s === "cancelled" || s === "idle") setTimeout(() => useShareStore.getState().stop(), 5000); // stop after the final update
  }, 2000);
};
