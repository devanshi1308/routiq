import { gridDistance, latLngToCell } from "@/lib/h3";

import { H3_RES } from "@/lib/dispatch";
import { Place } from "@/lib/mock";

// Uber Pool: Uber's data showed most trips have a "look-a-like" trip that starts near, ends near and happens
// around the same time. We simulate other riders and match them using H3 cells for start and end.
type OtherTrip = { from: Place; to: Place; minutesFromNow: number };

const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

const jitter = (p: Place, r: () => number, spread: number): Place => ({
  ...p,
  latitude: p.latitude + (r() - 0.5) * spread,
  longitude: p.longitude + (r() - 0.5) * spread,
});

export const lookAlikeTrips = (pickup: Place, dest: Place, count = 6) => {
  const r = rng(Math.round((pickup.latitude + dest.latitude) * 1e4));
  // other riders' trips: some are near the same corridor, some are random
  const others: OtherTrip[] = Array.from({ length: 24 }, (_, i) =>
    i % 3 === 0
      ? { from: jitter(pickup, r, 0.012), to: jitter(dest, r, 0.012), minutesFromNow: Math.floor(r() * 12) }
      : { from: jitter(pickup, r, 0.08), to: jitter(dest, r, 0.08), minutesFromNow: Math.floor(r() * 30) },
  );
  const a = latLngToCell(pickup.latitude, pickup.longitude, H3_RES);
  const b = latLngToCell(dest.latitude, dest.longitude, H3_RES);
  return others
    .filter((t) => {
      const fa = latLngToCell(t.from.latitude, t.from.longitude, H3_RES);
      const fb = latLngToCell(t.to.latitude, t.to.longitude, H3_RES);
      return gridDistance(a, fa) <= 2 && gridDistance(b, fb) <= 2 && t.minutesFromNow <= 8;
    })
    .slice(0, count);
};
