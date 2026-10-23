import { create } from "zustand";

import { Dispatch, toBatches } from "@/lib/dispatch";
import { CURRENT_LOCATION, DRIVERS, PaymentMethod, Place, RideType, RouteOption } from "@/lib/mock";

export type TripStatus =
  | "idle"
  | "searching"
  | "driver_assigned"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

type Driver = (typeof DRIVERS)[number];

export type Role = "rider" | "driver";
type Profile = { name: string; email: string; vehicle?: string; plate?: string };

type AuthStore = {
  signedIn: boolean;
  role: Role;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  plate: string;
  /** mock user database keyed by "role:phone-or-email", so returning users skip sign-up */
  registry: Record<string, Profile>;
  isRegistered: (id: string, role: Role) => boolean;
  signIn: (id: string, role: Role) => void;
  register: (id: string, role: Role, name: string, email: string, vehicle?: string, plate?: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  signedIn: false,
  role: "rider",
  name: "Devanshi K",
  email: "devanshikambli2006@gmail.com",
  phone: "",
  vehicle: "",
  plate: "",
  registry: {
    "rider:9876543210": { name: "Devanshi K", email: "devanshikambli2006@gmail.com" },
    "rider:devanshikambli2006@gmail.com": { name: "Devanshi K", email: "devanshikambli2006@gmail.com" },
    "driver:9988776655": { name: "Ramesh Yadav", email: "ramesh@example.com", vehicle: "Bajaj RE Auto", plate: "MH 02 QR 4471" },
  },
  isRegistered: (id, role) => !!get().registry[`${role}:${id}`],
  signIn: (id, role) => {
    const u = get().registry[`${role}:${id}`];
    set({ signedIn: true, role, phone: id, name: u?.name ?? "Devanshi K", email: u?.email ?? "", vehicle: u?.vehicle ?? "", plate: u?.plate ?? "" });
  },
  register: (id, role, name, email, vehicle = "", plate = "") =>
    set((st) => ({ registry: { ...st.registry, [`${role}:${id}`]: { name, email, vehicle, plate } }, signedIn: true, role, phone: id, name, email, vehicle, plate })),
  signOut: () => set({ signedIn: false }),
}));

type TripStore = {
  pickup: Place;
  destination: Place | null;
  rideType: RideType | null;
  /** ride type chosen from a Home tile (e.g. Bike), opened first on the ride screen */
  preferred: string | null;
  setPreferred: (id: string | null) => void;
  routes: RouteOption[];
  routeIndex: number;
  setRoutes: (r: RouteOption[]) => void;
  setRouteIndex: (i: number) => void;
  payment: PaymentMethod;
  useUberCash: boolean;
  voucher: string | null;
  setUseUberCash: (v: boolean) => void;
  setVoucher: (v: string | null) => void;
  status: TripStatus;
  driver: Driver | null;
  dispatch: Dispatch | null;
  setDispatch: (d: Dispatch | null) => void;
  pin: string;
  requestId: string;
  /** when true, the demo advances every step by itself; when false, only the driver screen moves the trip */
  /** rider asked for women drivers only */
  womenOnly: boolean;
  /** a favourite driver to ask first */
  favDriver: string | null;
  /** people the fare is split with (their share = fare / (n + 1)) */
  split: { name: string; phone: string }[];
  /** extra ride options added while searching: drivers of all of them are asked at the same time */
  extras: { type: RideType; price: number }[];
  /** true on the rider's phone while a driver on another phone is driving the trip (this phone only mirrors it) */
  remote: boolean;
  autopilot: boolean;
  setAutopilot: (v: boolean) => void;
  batchNo: number;
  progress: number;
  acceptRide: () => void;
  declineBatch: () => void;
  markArrived: () => void;
  startTrip: (pin: string) => boolean;
  endTrip: () => void;
  /** extra amount the rider added to attract a driver faster */
  boost: number;
  /** optional tip for the driver, paid with the fare */
  tip: number;
  /** live position of the matched driver while they travel to the pickup */
  driverPos: { latitude: number; longitude: number } | null;
  /** seconds until the driver reaches the pickup */
  etaSec: number;
  setEtaSec: (n: number) => void;
  fare: number;
  setPickup: (p: Place) => void;
  setDestination: (p: Place | null) => void;
  selectRide: (r: RideType) => void;
  setPayment: (m: PaymentMethod) => void;
  setStatus: (s: TripStatus) => void;
  assignDriver: (c?: Dispatch["candidates"][number]) => void;
  setFare: (f: number) => void;
  reset: () => void;
};

export const useTripStore = create<TripStore>((set, get) => ({
  pickup: CURRENT_LOCATION,
  destination: null,
  rideType: null,
  preferred: null,
  setPreferred: (preferred) => set({ preferred }),
  routes: [],
  routeIndex: 0,
  setRoutes: (routes) => set({ routes, routeIndex: 0 }),
  setRouteIndex: (routeIndex) => set({ routeIndex }),
  payment: "Cash",
  useUberCash: true,
  voucher: null,
  setUseUberCash: (useUberCash) => set({ useUberCash }),
  setVoucher: (voucher) => set({ voucher }),
  status: "idle",
  driver: null,
  dispatch: null,
  setDispatch: (dispatch) => set({ dispatch }),
  pin: "5969",
  requestId: "",
  remote: false,
  extras: [],
  womenOnly: false,
  favDriver: null,
  split: [],
  autopilot: false,
  setAutopilot: (autopilot) => set({ autopilot }),
  batchNo: 0,
  progress: 0,
  // Driver-side actions. The rider screen only reacts to the status these set.
  acceptRide: () => {
    const { dispatch, batchNo, status } = get();
    const wave = toBatches(dispatch?.candidates ?? [])[batchNo];
    if (status !== "searching" || !wave) return;
    const me = useAuthStore.getState();
    if (me.role === "driver" && me.signedIn) {
      // a signed-in driver accepts as themselves
      set({ driver: { id: 0, name: me.name, rating: 4.9, acceptance: 95, trips: 120, vehicle: me.vehicle || "Auto", plate: me.plate || "MH 00 XX 0000", phone: "+91 99•••• 0000" } });
    } else get().assignDriver(wave[0]);
    // whichever added service the accepting driver belongs to becomes the ride; the other searches stop
    const st = get();
    const all = [st.rideType, ...st.extras.map((e) => e.type)].filter(Boolean) as RideType[];
    const chosen = me.role === "driver" && me.signedIn ? all.find((t) => servesRide(me.vehicle || "Auto", t.id)) : all.find((t) => t.id === wave[0].rideId);
    if (chosen && chosen.id !== st.rideType?.id) set({ rideType: chosen, fare: (st.extras.find((e) => e.type.id === chosen.id)?.price ?? st.fare) + st.boost });
    set({ extras: [] });
    const d = get().driver;
    if (d) useNoticeStore.getState().push({ kind: "driver", title: `${d.name} accepted your ride`, body: `${d.vehicle} ${d.plate} is on the way. Share PIN with the driver at pickup.` });
    set({ status: "driver_assigned" });
  },
  declineBatch: () => {
    const { batchNo, status } = get();
    if (status !== "searching") return;
    useNoticeStore.getState().push({ kind: "ride", title: `Batch ${batchNo + 1} got no response`, body: "Widening the search to the next batch of drivers." });
    set({ batchNo: batchNo + 1 });
  },
  markArrived: () => {
    if (get().status !== "driver_assigned") return;
    useChatStore.getState().send("driver", "I've arrived at the pickup point.");
    set({ status: "driver_arrived", etaSec: 0 });
  },
  startTrip: (pin) => {
    if (get().status !== "driver_arrived" || pin !== get().pin) return false;
    set({ status: "in_progress", progress: 0 });
    return true;
  },
  endTrip: () => {
    if (get().status === "in_progress") set({ status: "completed", progress: 1 });
  },
  boost: 0,
  tip: 0,
  driverPos: null,
  etaSec: 0,
  setEtaSec: (etaSec) => set({ etaSec }),
  fare: 0,
  setPickup: (pickup) => set({ pickup }),
  setDestination: (destination) => set({ destination }),
  selectRide: (rideType) => set({ rideType }),
  setPayment: (payment) => set({ payment }),
  setStatus: (status) => set({ status }),
  setFare: (fare) => set({ fare }),
  assignDriver: (chosen) => {
    const c = chosen ?? get().dispatch?.candidates[0];
    set({
      driver: c
        ? { id: c.id, name: c.name, rating: c.rating, acceptance: c.acceptance, trips: c.trips, vehicle: c.vehicle, plate: c.plate, phone: c.phone }
        : DRIVERS[Math.floor(Math.random() * 2)],
    });
  },
  reset: () => set({ destination: null, rideType: null, preferred: null, routes: [], routeIndex: 0, status: "idle", driver: null, dispatch: null, batchNo: 0, progress: 0, boost: 0, tip: 0, driverPos: null, etaSec: 0, fare: 0, remote: false, extras: [], womenOnly: false, favDriver: null, split: [] }),
}));

import { servesRide } from "@/lib/fleet";
import { PAST_RIDES, PastRide } from "@/lib/mock";

type HistoryStore = { rides: PastRide[]; add: (r: PastRide) => void };

export const useHistoryStore = create<HistoryStore>((set) => ({
  rides: PAST_RIDES,
  add: (r) => set((s) => ({ rides: [r, ...s.rides] })),
}));

export type Notice = { id: string; title: string; body: string; time: string; kind: "ride" | "driver" | "business" };

type NoticeStore = { items: Notice[]; push: (n: Omit<Notice, "id" | "time">) => void };

export const useNoticeStore = create<NoticeStore>((set) => ({
  items: [],
  push: (n) =>
    set((s) => ({
      items: [
        { ...n, id: `${Date.now()}-${s.items.length}`, time: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) },
        ...s.items,
      ],
    })),
}));

export type ChatMsg = { id: string; from: "rider" | "driver"; text: string; time: string };

type ChatStore = {
  messages: ChatMsg[];
  unread: number;
  send: (from: ChatMsg["from"], text: string) => void;
  markRead: () => void;
  clear: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  unread: 0,
  send: (from, text) =>
    set((s) => ({
      messages: [...s.messages, { id: `${Date.now()}-${s.messages.length}`, from, text, time: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) }],
      unread: from === "driver" ? s.unread + 1 : s.unread,
    })),
  markRead: () => set({ unread: 0 }),
  clear: () => set({ messages: [], unread: 0 }),
}));

// Business profile: rides can be charged to a company, with a receipt emailed to a work address.
type BusinessStore = {
  business: { company: string; email: string } | null;
  /** when true, new rides are booked under the business profile */
  active: boolean;
  create: (company: string, email: string) => void;
  setActive: (v: boolean) => void;
};

export const useBusinessStore = create<BusinessStore>((set) => ({
  business: null,
  active: false,
  create: (company, email) => set({ business: { company, email }, active: true }),
  setActive: (active) => set({ active }),
}));

// Saved places (Home and Work) shown as chips on the "Plan your ride" screen.
type SavedStore = {
  home: Place | null;
  work: Place | null;
  save: (kind: "home" | "work", place: Place) => void;
};

export const useSavedStore = create<SavedStore>((set) => ({
  home: null,
  work: null,
  save: (kind, place) => set({ [kind]: place } as any),
}));
