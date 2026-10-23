import Constants from "expo-constants";
import { Platform } from "react-native";
import { create } from "zustand";

// Live vehicle positions over a WebSocket (scripts/realtime-server.js). If the server isn't running the app
// keeps using its simulated fleet and reconnects in the background.
export type LiveVehicle = { id: number; kind: "auto" | "car" | "bike"; lat: number; lon: number };

type State = { connected: boolean; vehicles: LiveVehicle[]; messages: number; lastTs: number };
export const useRealtime = create<State>(() => ({ connected: false, vehicles: [], messages: 0, lastTs: 0 }));

const host = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.hostname;
  const h = (Constants.expoConfig as any)?.hostUri as string | undefined;
  return h ? h.split(":")[0] : "localhost";
};

let started = false;
export const startRealtime = () => {
  if (started) return;
  started = true;
  const connect = () => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(`ws://${host()}:8787`);
    } catch {
      setTimeout(connect, 5000);
      return;
    }
    ws.onopen = () => useRealtime.setState({ connected: true });
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(String(e.data));
        if (m.type === "vehicles") useRealtime.setState((s) => ({ vehicles: m.data, lastTs: m.ts, messages: s.messages + 1 }));
      } catch {}
    };
    ws.onclose = () => {
      useRealtime.setState({ connected: false });
      setTimeout(connect, 5000);
    };
    ws.onerror = () => ws.close();
  };
  connect();
};
