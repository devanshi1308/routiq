import { aStar, buildGraph } from "@/lib/astar";
import { POPULAR_PLACES } from "@/lib/places";

export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** simulated trips per month to this place (used for the 'popular near you' ranking) */
  visits?: number;
};

export const CURRENT_LOCATION: Place = {
  id: "current",
  name: "Jogeshwari East",
  address: "Jogeshwari East, Mumbai",
  latitude: 19.1334,
  longitude: 72.8497,
};

export const PLACES: Place[] = [
  { id: "p1", name: "Sachin Fitness", address: "Natwar Nagar, Jogeshwari East", latitude: 19.1366, longitude: 72.8523, visits: 900 },
  { id: "p2", name: "Mukesh Patel School of Technology Management & Engineering", address: "Bhakti Vedant Marg, opp. Cooper Hospital, Vile Parle West", latitude: 19.1004, longitude: 72.8365, visits: 4200 },
  { id: "p3", name: "Andheri Gulmohur C.H.S. Ltd.", address: "Wing A, Andheri Gulmohur, Plot 12, Andheri West", latitude: 19.1197, longitude: 72.8346, visits: 1500 },
  { id: "p4", name: "Chhatrapati Shivaji Maharaj Airport T2", address: "Sahar Road, Andheri East", latitude: 19.0974, longitude: 72.8744, visits: 61000 },
  { id: "p5", name: "Bandra Kurla Complex", address: "G Block, Bandra East", latitude: 19.0669, longitude: 72.8685, visits: 48000 },
  { id: "p6", name: "Powai Lake", address: "Powai, Mumbai", latitude: 19.1261, longitude: 72.9055, visits: 22000 },
  { id: "p7", name: "Lokhandwala Market", address: "Andheri West, Mumbai", latitude: 19.1355, longitude: 72.8291, visits: 31000 },
  { id: "p8", name: "Hubtown Solaris", address: "N S Phadke Marg, Andheri East", latitude: 19.1163, longitude: 72.8561, visits: 9000 },
  ...POPULAR_PLACES,
];

export const RECENT_PLACES: Place[] = [];

export type RideType = {
  id: string;
  name: string;
  seats: number;
  base: number;
  perKm: number;
  perMin: number;
  etaMin: number;
  tag?: string;
  emoji: string /* VehicleKind */;
  ac?: boolean;
};

export const RIDE_TYPES: RideType[] = [
  { id: "auto", name: "Auto", seats: 3, base: 30, perKm: 14, perMin: 0.5, etaMin: 5, emoji: "auto" },
  { id: "go-ac", name: "Routiq Go AC", seats: 4, base: 55, perKm: 20, perMin: 1, etaMin: 8, emoji: "sedan", ac: true },
  { id: "bike", name: "Bike", seats: 1, base: 15, perKm: 8, perMin: 0.3, etaMin: 8, emoji: "bike" },
  { id: "auto-priority", name: "Auto Priority", seats: 3, base: 40, perKm: 18, perMin: 0.8, etaMin: 4, emoji: "auto" },
  { id: "pool", name: "Routiq Pool", seats: 2, base: 35, perKm: 12, perMin: 0.6, etaMin: 10, tag: "Shared", emoji: "sedan2" },
  { id: "taxi", name: "Routiq Taxi", seats: 4, base: 45, perKm: 18, perMin: 0.9, etaMin: 7, emoji: "taxi" },
  { id: "premier", name: "Routiq Premier", seats: 4, base: 80, perKm: 26, perMin: 1.4, etaMin: 9, emoji: "premier", ac: true },
  { id: "xl", name: "Routiq XL", seats: 6, base: 110, perKm: 32, perMin: 1.8, etaMin: 12, emoji: "van", ac: true },
];

export type PaymentMethod = "Cash" | "UPI Scan and Pay" | "Routiq Cash";
export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "UPI Scan and Pay", "Routiq Cash"];

export const haversineKm = (a: Place, b: Place) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  // 1.35 = rough road-vs-straight-line factor for city streets
  return Math.max(1, 2 * R * Math.asin(Math.sqrt(h)) * 1.35);
};

export const tripMinutes = (km: number) => Math.round(km * 3.2 + 4);

export type RouteOption = {
  id: string;
  name: string;
  via: string;
  km: number;
  minutes: number;
  traffic: "Light" | "Moderate" | "Heavy";
  /** fare multiplier: slower (more congested) routes cost a bit more */
  priceFactor: number;
  /** [lat, lon] pairs along the road */
  coords: [number, number][];
  /** turn-by-turn instructions (from the routing service), used by the driver navigation card */
  steps?: { text: string; meters: number }[];
};

export const trafficFor = (km: number, minutes: number): RouteOption["traffic"] => {
  const speed = km / (minutes / 60);
  return speed < 18 ? "Heavy" : speed < 28 ? "Moderate" : "Light";
};

export const PRICE_FACTOR = { Heavy: 1.08, Moderate: 1.04, Light: 1 } as const;

// Used only if the routing service can't be reached: A* over a small graph of known places.
export const fallbackRoutes = (a: Place, b: Place): RouteOption[] => {
  const graph = buildGraph([a, b, ...PLACES.filter((p) => p.id !== a.id && p.id !== b.id)]);
  const found = aStar(graph, a.id, b.id);
  const path = found?.path ?? [a, b];
  const km = +(found?.km ?? haversineKm(a, b)).toFixed(1);
  const minutes = tripMinutes(km);
  const traffic = trafficFor(km, minutes);
  return [
    {
      id: "route-0",
      name: "Shortest",
      via: "estimated route (offline, A* search)",
      km,
      minutes,
      traffic,
      priceFactor: PRICE_FACTOR[traffic],
      coords: path.map((p) => [p.latitude, p.longitude] as [number, number]),
    },
  ];
};

export const fareFor = (type: RideType, route: RouteOption) =>
  +((type.base + type.perKm * route.km + type.perMin * route.minutes) * route.priceFactor).toFixed(2);

export const clockTime = (plusMin: number) => {
  const d = new Date(Date.now() + plusMin * 60000);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
};

export const DRIVERS = [
  { id: 1, name: "Ramesh Yadav", rating: 4.92, acceptance: 94, trips: 3841, vehicle: "Bajaj RE Auto", plate: "MH 02 QR 4471", phone: "+91 98•••• 3321" },
  { id: 2, name: "Sunil Patil", rating: 4.85, acceptance: 91, trips: 2210, vehicle: "Maruti WagonR CNG", plate: "MH 01 CT 9082", phone: "+91 99•••• 1045" },
  { id: 3, name: "Imran Shaikh", rating: 4.78, acceptance: 88, trips: 1560, vehicle: "Honda Shine Bike", plate: "MH 47 AB 2210", phone: "+91 97•••• 7712" },
];

export type PastRide = {
  id: string;
  place: string;
  date: string;
  fare: number;
  status: "Completed" | "Cancelled";
  rideType: string;
  emoji: string /* VehicleKind */;
  drivers?: number;
  dest?: Place;
  /** booked under the business profile */
  business?: boolean;
};

export const PAST_RIDES: PastRide[] = [];

export const SERVICES = [
  { id: "auto", label: "Auto", emoji: "auto" },
  { id: "trip", label: "Trip", emoji: "sleek", badge: "25%" },
  { id: "bike", label: "Bike", emoji: "bike" },
  { id: "reserve", label: "Reserve", emoji: "calendar", badge: "20%" },
  { id: "carpool", label: "Carpool", emoji: "sedan2", badge: "35%" },
];

export const INBOX = [
  { id: "i1", title: "Insure trips at ₹3/trip", body: "Avail up to ₹10L coverage, ₹10K OPD & more", cta: "Get started", icon: "megaphone" },
  { id: "i2", title: "5% off Go Sedan and other select product types", body: "20 left • Up to ₹24 off • Mumbai\nUse by Dec 29, 2026", cta: "Book now", icon: "pricetag" },
  { id: "i3", title: "5% off select product types", body: "1 left • Up to ₹500 off • Mumbai\nUse by Dec 18, 2026", cta: "Book now", icon: "pricetag" },
  { id: "i4", title: "Optional Insurance", body: "We want to hear from you!", cta: "Click Here", icon: "shield" },
  { id: "i5", title: "50% off select product types", body: "2 left • Up to ₹100 off • Mumbai\nUse by Nov 30, 2026", cta: "Book now", icon: "pricetag" },
];

/** The rider's own recent destinations, newest first, no duplicates. Empty for a new rider. */
export const recentFrom = (rides: PastRide[], limit = 3): Place[] => {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const r of rides) {
    if (r.dest && !seen.has(r.dest.id)) {
      seen.add(r.dest.id);
      out.push(r.dest);
    }
  }
  return out.slice(0, limit);
};

/** Curated places sorted by distance from where the rider is. */
export const nearbyFrom = (origin: Place, exclude: Place[] = [], limit = 6) =>
  PLACES.filter((p) => !exclude.some((e) => e.id === p.id))
    .map((p) => ({ place: p, km: haversineKm(origin, p) / 1.35 }))
    .sort((x, y) => x.km - y.km)
    .slice(0, limit);

/** Which ride a Home / Services tile opens. Tiles without an entry open the normal ride list. */
export const SERVICE_RIDE: Record<string, string | undefined> = { auto: "auto", trip: "go-ac", bike: "bike", carpool: "pool" };
