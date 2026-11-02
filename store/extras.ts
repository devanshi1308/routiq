import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const storage = createJSONStorage(() => AsyncStorage);

export type Contact = { id: string; name: string; phone: string };
type Kind = "emergency" | "share";

// Safety preferences: who to call in an emergency, who gets the live trip, and RideCheck.
export const useSafetyStore = create<{
  emergency: Contact[];
  share: Contact[];
  rideCheck: boolean;
  /** rider asks for women drivers */
  womenPref: boolean;
  /** offer to tell trusted contacts you arrived safely (always at night) */
  safeArrival: boolean;
  twoStep: boolean;
  passkey: boolean;
  setFlag: (k: "twoStep" | "passkey" | "womenPref" | "safeArrival", v: boolean) => void;
  add: (k: Kind, name: string, phone: string) => void;
  remove: (k: Kind, id: string) => void;
  setRideCheck: (v: boolean) => void;
}>()(
  persist(
    (set) => ({
      emergency: [],
      share: [],
      rideCheck: true,
      womenPref: false,
      safeArrival: true,
      twoStep: false,
      passkey: false,
      setFlag: (k, v) => set({ [k]: v } as any),
      add: (k, name, phone) => set((s) => ({ [k]: [...s[k], { id: String(Date.now()), name, phone }] }) as any),
      remove: (k, id) => set((s) => ({ [k]: s[k].filter((c) => c.id !== id) }) as any),
      setRideCheck: (rideCheck) => set({ rideCheck }),
    }),
    { name: "routiq:safety", storage },
  ),
);

export type Txn = { id: string; text: string; amount: number; at: string };

// Routiq Cash balance and its history.
export const useWalletStore = create<{ balance: number; txns: Txn[]; member: boolean; setMember: (v: boolean) => void; spend: (amount: number, text: string) => void; addCash: (amount: number, via: string) => void }>()(
  persist(
    (set) => ({
      balance: 0,
      txns: [],
      member: false,
      setMember: (member) => set({ member }),
      spend: (amount, text) =>
        set((s) => ({
          balance: +(s.balance - amount).toFixed(2),
          txns: [{ id: String(Date.now()), text, amount: -amount, at: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) }, ...s.txns],
        })),
      addCash: (amount, via) =>
        set((s) => ({
          balance: s.balance + amount,
          txns: [{ id: String(Date.now()), text: `Added via ${via}`, amount, at: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) }, ...s.txns],
        })),
    }),
    { name: "routiq:wallet", storage },
  ),
);

export type Clip = { id: string; uri: string; at: string; sec: number };

// Saved audio recordings.
export const useRecordingStore = create<{ clips: Clip[]; add: (c: Omit<Clip, "id">) => void; remove: (id: string) => void }>()(
  persist(
    (set) => ({
      clips: [],
      add: (c) => set((s) => ({ clips: [{ ...c, id: String(Date.now()) }, ...s.clips] })),
      remove: (id) => set((s) => ({ clips: s.clips.filter((c) => c.id !== id) })),
    }),
    { name: "routiq:recordings", storage },
  ),
);

// Offer codes the rider has added.
export const PROMO_CODES: Record<string, string> = {
  ROUTIQ10: "10% off your next ride",
  WELCOME: "10% off your first ride",
  SAVE10: "10% off select rides",
  FIRSTRIDE: "10% off your first ride",
};

export type Fav = { id: string; name: string; vehicle: string; plate: string; rating: number; rideId: string };

// Drivers the rider liked and wants to be asked first next time.
export const useFavStore = create<{ items: Fav[]; add: (f: Fav) => void; remove: (id: string) => void }>()(
  persist(
    (set) => ({
      items: [],
      add: (f) => set((s) => (s.items.some((x) => x.id === f.id) ? s : { items: [f, ...s.items] })),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: "routiq:favourites", storage },
  ),
);

export type CommutePlace = { name: string; address: string; latitude: number; longitude: number };
export type CommutePlan = { id: string; label: string; from: CommutePlace; to: CommutePlace; days: number[]; time: string; rideId: string; favourite: boolean; on: boolean };

// Repeating rides: for example home to office every weekday at 9:00.
export const useCommuteStore = create<{ plans: CommutePlan[]; add: (p: Omit<CommutePlan, "id">) => void; remove: (id: string) => void; toggle: (id: string) => void }>()(
  persist(
    (set) => ({
      plans: [],
      add: (p) => set((s) => ({ plans: [...s.plans, { ...p, id: String(Date.now()) }] })),
      remove: (id) => set((s) => ({ plans: s.plans.filter((x) => x.id !== id) })),
      toggle: (id) => set((s) => ({ plans: s.plans.map((x) => (x.id === id ? { ...x, on: !x.on } : x)) })),
    }),
    { name: "routiq:commute", storage },
  ),
);

export type DocKey = "licence" | "rc" | "insurance" | "police";
export type DriverDetails = { city: string; make: string; colour: string; year: string; licenceNo: string; insuranceNo: string; policeNo: string };
const NO_DETAILS: DriverDetails = { city: "", make: "", colour: "", year: "", licenceNo: "", insuranceNo: "", policeNo: "" };

// Driver profile extras: onboarding details, payout, which documents are uploaded, online switch and rider ratings given.
export const useDriverStore = create<{
  gender: "woman" | "man" | "na";
  setGender: (g: "woman" | "man" | "na") => void;
  upi: string;
  docs: Record<DocKey, boolean>;
  details: DriverDetails;
  online: boolean;
  /** stars this driver gave riders after trips */
  riderRatings: number[];
  setUpi: (v: string) => void;
  toggleDoc: (k: DocKey) => void;
  setDetails: (d: Partial<DriverDetails>) => void;
  setOnline: (v: boolean) => void;
  rateRider: (n: number) => void;
  /** a new driver starts with nothing uploaded */
  startOnboarding: () => void;
}>()(
  persist(
    (set) => ({
      gender: "na",
      setGender: (gender) => set({ gender }),
      upi: "",
      docs: { licence: true, rc: true, insurance: false, police: true },
      details: NO_DETAILS,
      online: true,
      riderRatings: [],
      setUpi: (upi) => set({ upi }),
      toggleDoc: (k) => set((s) => ({ docs: { ...s.docs, [k]: !s.docs[k] } })),
      setDetails: (d) => set((s) => ({ details: { ...s.details, ...d } })),
      setOnline: (online) => set({ online }),
      rateRider: (n) => set((s) => ({ riderRatings: [...s.riderRatings, n] })),
      startOnboarding: () => set({ docs: { licence: false, rc: false, insurance: false, police: false }, details: NO_DETAILS, upi: "", gender: "na", online: false }),
    }),
    { name: "routiq:driver", storage },
  ),
);

// Which phone notifications the rider allows.
export const useNotifyStore = create<{ rides: boolean; commute: boolean; nudges: boolean; set: (k: "rides" | "commute" | "nudges", v: boolean) => void }>()(
  persist(
    (set) => ({
      rides: true,
      commute: true,
      nudges: true,
      set: (k, v) => set({ [k]: v } as any),
    }),
    { name: "routiq:notify", storage },
  ),
);
