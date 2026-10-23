import { create } from "zustand";

import { track } from "@/lib/analytics";
import { haversineKm, Place } from "@/lib/mock";

// Backend-only log: flags are recorded for review but never block or notify the rider.
// Account-integrity checks in the spirit of Uber's "algorithms and AI" post: flag one account in use on two
// devices at once, and GPS positions that imply impossible travel. Flags restrict booking, and only a
// human review can clear them (the post says permanent decisions follow human review).
export type Flag = { id: string; kind: "concurrent_session" | "gps_jump" | "cancellation_abuse"; detail: string; time: string };
type Status = "ok" | "restricted" | "in_review";

const MAX_SPEED_KMH = 250;
// Cancellation-abuse score: number of cancellations in the last 10 minutes. 3 or more pauses booking.
const CANCEL_WINDOW_MS = 10 * 60 * 1000;
const CANCEL_LIMIT = 3;

/** number of cancellations inside the window */
export const cancelScore = (times: number[], now = Date.now()) => times.filter((t) => now - t < CANCEL_WINDOW_MS).length;

type State = {
  status: Status;
  flags: Flag[];
  sessions: string[];
  lastLoc: { place: Place; ts: number } | null;
  note: string;
  cancels: number[];
  recordCancel: () => void;
  startSession: (device: string) => void;
  reportLocation: (p: Place, at?: number) => void;
  requestReview: () => void;
  reset: () => void;
};

const flag = (kind: Flag["kind"], detail: string): Flag => ({
  id: `${kind}-${Date.now()}`,
  kind,
  detail,
  time: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
});

export const useIntegrity = create<State>((set, get) => ({
  status: "ok",
  flags: [],
  sessions: ["This iPhone"],
  lastLoc: null,
  note: "",
  cancels: [],
  recordCancel: () => {
    const now = Date.now();
    const cancels = [...get().cancels.filter((t) => now - t < CANCEL_WINDOW_MS), now];
    set({ cancels });
    if (cancelScore(cancels, now) >= CANCEL_LIMIT && get().status === "ok") {
      track("integrity_flag", { kind: "cancellation_abuse" });
      set((s) => ({ flags: [flag("cancellation_abuse", `${cancels.length} cancellations in the last 10 minutes`), ...s.flags] }));
    }
  },
  startSession: (device) => {
    const sessions = [...get().sessions.filter((d) => d !== device), device];
    set({ sessions });
    if (sessions.length > 1) {
      track("integrity_flag", { kind: "concurrent_session" });
      set((s) => ({ flags: [flag("concurrent_session", `Signed in on ${sessions.join(" and ")} at the same time`), ...s.flags] }));
    }
  },
  reportLocation: (place, at = Date.now()) => {
    const prev = get().lastLoc;
    set({ lastLoc: { place, ts: at } });
    if (!prev) return;
    const hours = Math.max((at - prev.ts) / 3.6e6, 1 / 3600);
    const km = haversineKm(prev.place, place) / 1.35;
    const speed = km / hours;
    if (speed > MAX_SPEED_KMH) {
      track("integrity_flag", { kind: "gps_jump" });
      set((s) => ({ flags: [flag("gps_jump", `Moved ${km.toFixed(0)} km in ${(hours * 3600).toFixed(0)} s (${Math.round(speed)} km/h)`), ...s.flags] }));
    }
  },
  requestReview: () => {
    if (get().status !== "restricted") return;
    set({ status: "in_review", note: "A member of the safety team is reviewing your account." });
    setTimeout(() => set({ status: "ok", sessions: ["This iPhone"], note: "Reviewed by a person: no violation found. Booking is back on." }), 4000);
  },
  reset: () => set({ status: "ok", cancels: [], flags: [], sessions: ["This iPhone"], lastLoc: null, note: "" }),
}));
