import { Platform } from "react-native";
import { create } from "zustand";

// Rider-app event pipeline, modelled on Uber's description of how data shapes the rider app:
//  - every event carries the same metadata (app version, platform, screen, session, time)
//  - events are queued on the client and sent in small batches every few seconds
//  - events whose schema is not registered are dropped (metadata-gated ingestion)
//  - impressions (what was shown) are logged next to taps, so shortcut conversion can be measured
//  - trip events carry a request_id that joins them to server-side logs
export const SCHEMAS: Record<string, string[]> = {
  screen_view: ["screen"],
  impression: ["surface", "items"],
  shortcut_shown: ["place_id"],
  shortcut_clicked: ["place_id"],
  route_selected: ["request_id", "route", "km", "minutes"],
  payment_selected: ["method"],
  ride_booked: ["request_id", "ride_type", "fare", "surge", "source"],
  dispatch_batch: ["request_id", "batch", "drivers"],
  ride_completed: ["request_id", "fare", "source"],
  ride_cancelled: ["request_id"],
  integrity_flag: ["kind"],
};

export type AppEvent = {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  meta: { app_version: string; platform: string; session: string; screen: string; ts: number };
};
export type SentBatch = { no: number; sentAt: number; events: AppEvent[] };

type State = {
  queue: AppEvent[];
  batches: SentBatch[];
  dropped: number;
  screen: string;
  source: "shortcut" | "search";
  session: string;
  setScreen: (s: string) => void;
  setSource: (s: "shortcut" | "search") => void;
};

export const useAnalytics = create<State>((set) => ({
  queue: [],
  batches: [],
  dropped: 0,
  screen: "home",
  source: "search",
  session: Math.random().toString(36).slice(2, 8),
  setScreen: (screen) => set({ screen }),
  setSource: (source) => set({ source }),
}));

let n = 0;
export const track = (name: string, payload: Record<string, unknown> = {}) => {
  const st = useAnalytics.getState();
  const required = SCHEMAS[name];
  if (!required || required.some((k) => !(k in payload))) {
    useAnalytics.setState({ dropped: st.dropped + 1 });
    return;
  }
  const ev: AppEvent = {
    id: `${st.session}-${++n}`,
    name,
    payload,
    meta: { app_version: "1.0.0", platform: Platform.OS, session: st.session, screen: st.screen, ts: Date.now() },
  };
  useAnalytics.setState((s) => ({ queue: [...s.queue, ev] }));
};

// Flush the queue as one batch every 5 s (the "send to backend processor" step).
let started = false;
export const startFlushing = () => {
  if (started) return;
  started = true;
  setInterval(() => {
    const { queue, batches } = useAnalytics.getState();
    if (!queue.length) return;
    useAnalytics.setState({ queue: [], batches: [{ no: batches.length + 1, sentAt: Date.now(), events: queue }, ...batches].slice(0, 30) });
  }, 5000);
};

/** Shortcut funnel: shown -> clicked -> booked -> completed. */
export const funnel = (batches: SentBatch[], queue: AppEvent[]) => {
  const all = [...queue, ...batches.flatMap((b) => b.events)];
  const c = (name: string, source?: string) => all.filter((e) => e.name === name && (!source || e.payload.source === source)).length;
  return {
    shown: c("shortcut_shown"),
    clicked: c("shortcut_clicked"),
    booked: c("ride_booked", "shortcut"),
    completed: c("ride_completed", "shortcut"),
    totalBooked: c("ride_booked"),
    impressions: c("impression"),
  };
};
