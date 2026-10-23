import type { RouteOption } from "@/lib/mock";
import type { TripStatus } from "@/store";

// Pure helpers for the driver screen: formatting, turn-by-turn text and the progress stages. No UI in here.
export const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`);
export const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The next instruction on the route, given how far along the trip is (0 to 1). */
export const nextTurn = (route: RouteOption | undefined, progress: number) => {
  const steps = route?.steps ?? [];
  if (!steps.length) return { text: "Follow the route on the map", dist: "" };
  const total = steps.reduce((t, st) => t + st.meters, 0);
  const pos = progress * total;
  let cum = 0;
  for (let i = 0; i < steps.length; i++) {
    cum += steps[i].meters;
    if (pos <= cum) return { text: (steps[i + 1] ?? steps[i]).text, dist: fmtDist(cum - pos) };
  }
  return { text: "Arrive at your destination", dist: "" };
};

export const avgSpeed = (route?: RouteOption) => (route ? Math.round(route.km / (route.minutes / 60)) : 0);

export const STAGES = ["Request", "Pickup", "Arrived", "On trip", "Done"] as const;

export const stageIndex = (status: TripStatus): number =>
  ({ idle: -1, searching: 0, driver_assigned: 1, driver_arrived: 2, in_progress: 3, completed: 4, cancelled: -1 } as Record<string, number>)[status] ?? -1;

export const stageTitle = (status: TripStatus) =>
  status === "searching" ? "New ride request" : status === "driver_assigned" ? "Head to pickup" : status === "driver_arrived" ? "Waiting at pickup" : status === "in_progress" ? "Trip in progress" : status === "completed" ? "Trip complete" : "Ready for rides";
