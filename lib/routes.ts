import { cacheHit, cacheMiss, LruCache, TokenBucket } from "@/lib/cache";
import { fallbackRoutes, Place, PRICE_FACTOR, RouteOption, trafficFor } from "@/lib/mock";

// Free OSRM demo server (OpenStreetMap data). No API key. Returns real road routes plus alternatives.
const OSRM = "https://router.project-osrm.org/route/v1/driving";

const stepText = (st: any) => {
  const m = st.maneuver ?? {};
  const dir = m.modifier ? String(m.modifier).replace("slight ", "slight ").replace("sharp ", "sharp ") : "";
  const onto = st.name ? ` onto ${st.name}` : "";
  switch (m.type) {
    case "depart":
      return `Head ${dir || "out"}${st.name ? ` on ${st.name}` : ""}`;
    case "arrive":
      return "Arrive at your destination";
    case "turn":
      return `Turn ${dir}${onto}`;
    case "roundabout":
    case "rotary":
      return `Enter the roundabout${m.exit ? `, take exit ${m.exit}` : ""}${onto}`;
    case "merge":
      return `Merge ${dir}${onto}`.trim();
    case "fork":
      return `Keep ${dir || "straight"}${onto}`;
    case "end of road":
      return `At the end of the road turn ${dir}${onto}`;
    default:
      return st.name ? `Continue on ${st.name}` : "Continue straight";
  }
};

const cache = new LruCache<RouteOption[]>(20, 5 * 60 * 1000);
const limiter = new TokenBucket(4, 0.5); // 4 quick requests, then one every 2 s

const keyOf = (a: Place, b: Place) => [a.latitude, a.longitude, b.latitude, b.longitude].map((n) => n.toFixed(4)).join(",");

export const fetchRoutes = async (a: Place, b: Place): Promise<RouteOption[]> => {
  const key = keyOf(a, b);
  const cached = cache.get(key);
  if (cached) {
    cacheHit();
    return cached;
  }
  cacheMiss();
  if (!limiter.take()) return cache.get(key, true) ?? fallbackRoutes(a, b);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const url = `${OSRM}/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?alternatives=3&overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    if (json.code !== "Ok" || !json.routes?.length) return fallbackRoutes(a, b);

    const raw = (json.routes as any[])
      .map((r) => ({
        km: +(r.distance / 1000).toFixed(1),
        minutes: Math.max(1, Math.round(r.duration / 60)),
        coords: (r.geometry.coordinates as [number, number][]).map(([lon, lat]) => [lat, lon] as [number, number]),
        steps: ((r.legs?.[0]?.steps ?? []) as any[]).map((st) => ({ text: stepText(st), meters: Math.round(st.distance) })),
      }))
      .sort((x, y) => x.km - y.km); // shortest distance first = default

    const fastest = raw.reduce((best, r, i) => (r.minutes < raw[best].minutes ? i : best), 0);
    const result = raw.map((r, i) => {
      const traffic = trafficFor(r.km, r.minutes);
      return {
        id: `route-${i}`,
        name: i === 0 ? "Shortest" : i === fastest ? "Fastest" : `Alternative ${i}`,
        via: i === 0 ? "least distance" : i === fastest ? "quickest on today's roads" : "other roads",
        ...r,
        traffic,
        priceFactor: PRICE_FACTOR[traffic],
      };
    });
    cache.set(key, result);
    return result;
  } catch {
    return fallbackRoutes(a, b);
  } finally {
    clearTimeout(timer);
  }
};
