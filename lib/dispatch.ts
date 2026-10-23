import { gridDisk, gridDistance, cellToBoundary, latLngToCell } from "@/lib/h3";

import { isLand } from "@/lib/land";
import { haversineKm, Place, RideType } from "@/lib/mock";

// Uber's H3 hexagonal grid. Resolution 8 cells are ~0.46 km per edge, a good "walking distance" bucket.
export const H3_RES = 8;

export type FleetKind = "auto" | "car" | "bike";
export type FleetVehicle = {
  id: number;
  kind: FleetKind;
  latitude: number;
  longitude: number;
  cell: string;
  name: string;
  rating: number;
  /** share of ride requests the driver accepts */
  acceptance: number;
  trips: number;
  vehicle: string;
  plate: string;
  phone: string;
  gender: "woman" | "man";
};

const WOMEN_NAMES = ["Sunita Patil", "Meena Kamble", "Rekha Shinde", "Pooja Jadhav", "Asha More", "Kavita Rane", "Nisha Gupta", "Farida Shaikh"];
const NAMES = ["Ramesh Yadav", "Sunil Patil", "Imran Shaikh", "Vijay Pawar", "Anil Kamble", "Salim Khan", "Deepak More", "Rohit Gupta", "Manoj Singh", "Prakash Jadhav", "Farhan Ansari", "Ganesh Shinde"];
const MODEL: Record<FleetKind, string> = { auto: "Bajaj RE Auto", car: "Maruti WagonR CNG", bike: "Honda Shine Bike" };

const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

/** Simulated fleet around a point. A real app would stream driver locations from the backend. */
export const simulateFleet = (center: Place, count = 48): FleetVehicle[] => {
  const rand = rng(Math.round(center.latitude * 1e4) + Math.round(center.longitude * 1e4));
  return Array.from({ length: count }, (_, i) => {
    const kind: FleetKind = i % 3 === 0 ? "car" : i % 3 === 1 ? "auto" : "bike";
    // draw a position until it is on land (never in the sea or a lake)
    let latitude = center.latitude + (rand() - 0.5) * 0.05;
    let longitude = center.longitude + (rand() - 0.5) * 0.05;
    for (let tries = 0; tries < 12 && !isLand(latitude, longitude); tries++) {
      latitude = center.latitude + (rand() - 0.5) * 0.05;
      longitude = center.longitude + (rand() - 0.5) * 0.05;
    }
    return {
      id: i + 1,
      kind,
      latitude,
      longitude,
      cell: latLngToCell(latitude, longitude, H3_RES),
      gender: i % 5 === 2 ? ("woman" as const) : ("man" as const), // one driver in five, spread across autos, bikes and cars
      name: (i % 5 === 2 ? WOMEN_NAMES : NAMES)[Math.floor(rand() * (i % 5 === 2 ? WOMEN_NAMES : NAMES).length)],
      rating: +(4.5 + rand() * 0.5).toFixed(2),
      acceptance: 70 + Math.floor(rand() * 30),
      trips: 300 + Math.floor(rand() * 4000),
      vehicle: MODEL[kind],
      plate: `MH ${String(1 + Math.floor(rand() * 47)).padStart(2, "0")} ${String.fromCharCode(65 + Math.floor(rand() * 26))}${String.fromCharCode(65 + Math.floor(rand() * 26))} ${1000 + Math.floor(rand() * 8999)}`,
      phone: "+91 98•••• " + (1000 + Math.floor(rand() * 8999)),
    };
  });
};

export const MIN_RATING = 4.6;
export const MIN_ACCEPTANCE = 80;

export const kindFor = (t: RideType): FleetKind => (t.id === "bike" ? "bike" : t.id.startsWith("auto") ? "auto" : "car");

export type Dispatch = {
  originCell: string;
  k: number;
  cells: [number, number][][];
  /** vehicles of this kind inside the searched hexagons, before trimming to the top candidates */
  supply: number;
  candidates: (FleetVehicle & { km: number; ring: number; etaMin: number; /** which ride option this driver was found for (set when services are added) */ rideId?: string })[];
};

/**
 * Find vehicles of the right kind by expanding H3 rings (gridDisk) around the rider's cell
 * until enough candidates are found, then rank by distance.
 */
export const findNearby = (fleet: FleetVehicle[], pickup: Place, type: RideType, want = 9, maxK = 6): Dispatch => {
  const originCell = latLngToCell(pickup.latitude, pickup.longitude, H3_RES);
  const kind = kindFor(type);
  let k = 1;
  let disk = gridDisk(originCell, k);
  let found = fleet.filter((v) => v.kind === kind && v.rating >= MIN_RATING && v.acceptance >= MIN_ACCEPTANCE && disk.includes(v.cell));
  while (found.length < want && k < maxK) {
    k += 1;
    disk = gridDisk(originCell, k);
    found = fleet.filter((v) => v.kind === kind && v.rating >= MIN_RATING && v.acceptance >= MIN_ACCEPTANCE && disk.includes(v.cell));
  }
  const candidates = found
    .map((v) => {
      const km = haversineKm(pickup, { ...pickup, latitude: v.latitude, longitude: v.longitude }) / 1.35;
      return { ...v, km, ring: gridDistance(originCell, v.cell), etaMin: Math.max(2, Math.round(km * 3 + 1)) };
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, want);
  // supply for pricing: vehicles of this kind in the rider's own hexagon and its 6 neighbours
  const ring1 = new Set(gridDisk(originCell, 1));
  const supply = fleet.filter((v) => v.kind === kind && ring1.has(v.cell)).length;
  return { originCell, k, supply, cells: disk.map((c) => cellToBoundary(c) as [number, number][]), candidates };
};

export const BATCH_SIZE = 3;

/** Split ranked candidates into waves. Wave 1 is the closest drivers; later waves widen outward. */
export const toBatches = <T,>(items: T[], size = BATCH_SIZE): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** Which kind of ride a driver's vehicle can take, from the vehicle's name (Bajaj RE Auto -> auto, Honda Shine Bike -> bike, else car). */
export const vehicleKindOf = (vehicle: string): FleetKind => (/bike|scooter|activa|shine|splendor|pulsar/i.test(vehicle) ? "bike" : /auto|rickshaw|\bRE\b/i.test(vehicle) ? "auto" : "car");
