import { H3_RES } from "@/lib/dispatch";
import { gridDisk, latLngToCell } from "@/lib/h3";
import { haversineKm, PastRide, Place, PLACES } from "@/lib/mock";

export type PopularPlace = { place: Place; visits: number; km: number; mine: number };

/**
 * "Popular near you": the most-visited places around the rider.
 *  1. Index every place into an H3 hexagon and search rings around the rider's own hexagon, widening the ring
 *     until enough places are found (same idea as the nearby-driver search).
 *  2. Score = trips per month (people like you) boosted by the rider's own past trips there, divided by a distance
 *     penalty, so a very popular place a bit further away can still beat a quiet place next door.
 * First-time riders have no history, so they get the area's most-visited places; as they ride, their own trips
 * push the places they use up the list.
 */
export const popularNear = (origin: Place, rides: PastRide[] = [], limit = 6, exclude: Place[] = []): PopularPlace[] => {
  const mine = new Map<string, number>();
  rides.forEach((r) => r.dest && r.status === "Completed" && mine.set(r.dest.id, (mine.get(r.dest.id) ?? 0) + 1));

  const originCell = latLngToCell(origin.latitude, origin.longitude, H3_RES);
  const cellOf = new Map(PLACES.map((p) => [p.id, latLngToCell(p.latitude, p.longitude, H3_RES)]));
  const skip = new Set(exclude.map((e) => e.id));

  let pool: Place[] = [];
  for (let k = 4; k <= 40; k += 4) {
    const disk = new Set(gridDisk(originCell, k));
    pool = PLACES.filter((p) => !skip.has(p.id) && disk.has(cellOf.get(p.id)!));
    if (pool.length >= limit) break;
  }

  return pool
    .map((place) => {
      const km = haversineKm(origin, place) / 1.35;
      const m = mine.get(place.id) ?? 0;
      const visits = (place.visits ?? 0) + m * 8000;
      return { place, visits, km, mine: m, score: visits / (1 + (km / 2.5) ** 2) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ place, visits, km, mine: m }) => ({ place, visits, km, mine: m }));
};

export const fmtVisits = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K trips` : `${n} trips`);
