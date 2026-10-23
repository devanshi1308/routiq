// Routiq offline: the app files are cached on first load. Map libraries and every map tile you look at are cached
// too, so places you have already seen on the map still show without internet.
const CACHE = "routiq-v4";
const MAP_HOSTS = ["unpkg.com", "tile.openstreetmap.org", "a.tile.openstreetmap.org", "b.tile.openstreetmap.org", "c.tile.openstreetmap.org"];
const LEAFLET = ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      try {
        const files = await (await fetch("/precache.json")).json();
        await c.addAll(files);
      } catch {}
      await Promise.all(LEAFLET.map((u) => fetch(u, { mode: "no-cors" }).then((r) => c.put(u, r)).catch(() => {})));
    }).then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !MAP_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h))) return; // routing and search go to the network
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => (same ? caches.match("/index.html") : new Response("", { status: 504 })))),
  );
});
