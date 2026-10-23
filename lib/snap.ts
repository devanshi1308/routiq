// Snaps a point to the nearest road using the free OSRM service, so vehicles sit on roads and not on buildings.
// If the service can't be reached the original point is kept.
const cache = new Map<string, { latitude: number; longitude: number }>();

export const snapToRoad = async (p: { latitude: number; longitude: number }) => {
  const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const r = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${p.longitude},${p.latitude}?number=1`);
    const j = await r.json();
    const [lon, lat] = j.waypoints?.[0]?.location ?? [];
    const out = lat != null ? { latitude: lat, longitude: lon } : p;
    cache.set(key, out);
    return out;
  } catch {
    return p;
  }
};
