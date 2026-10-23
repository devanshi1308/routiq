// Tiny WebSocket server that streams simulated driver positions once a second.
// Run with:  npm run realtime      (listens on port 8787)
const http = require("http");
const { WebSocketServer } = require("ws");

const CENTER = { lat: 19.1334, lon: 72.8497 }; // Jogeshwari East, Mumbai
const KINDS = ["auto", "car", "bike"];
const rand = (a, b) => a + Math.random() * (b - a);

const fleet = Array.from({ length: 90 }, (_, i) => ({
  id: i + 1,
  kind: KINDS[i % 3],
  lat: CENTER.lat + rand(-0.03, 0.03),
  lon: CENTER.lon + rand(-0.03, 0.03),
  heading: rand(0, Math.PI * 2),
}));

// ---- shared trips: the rider's app posts a snapshot, anyone with the link sees it live ----
const trips = new Map(); // id -> { ...snapshot, updatedAt }
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { "Content-Type": type, ...CORS });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
};

const rides = new Map(); // id -> { device, rev, state }: the live ride both phones read and write
// Entries are removed an hour after their last update so memory does not grow without limit
// (a hosted version would keep them in Redis with the same expiry). Bodies over 1 MB are refused.
const TTL = 60 * 60 * 1000;
const MAX_BODY = 1024 * 1024;
setInterval(() => {
  const old = Date.now() - TTL;
  for (const [k, r] of rides) if ((r.at || 0) < old) rides.delete(k);
  for (const [k, t] of trips) if ((t.updatedAt || 0) < old) trips.delete(k);
}, 60 * 1000).unref();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return send(res, 204, "");
  let m;
  if (req.method === "POST" && (m = url.pathname.match(/^\/trip\/([\w-]+)$/))) {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on("end", () => {
      try {
        trips.set(m[1], { ...JSON.parse(body), updatedAt: Date.now() });
        send(res, 200, { ok: true });
      } catch {
        send(res, 400, { error: "bad json" });
      }
    });
    return;
  }
  if (req.method === "POST" && (m = url.pathname.match(/^\/ride\/([\w-]+)$/))) {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on("end", () => {
      try {
        const doc = JSON.parse(body);
        const old = rides.get(m[1]);
        if (!old || doc.rev >= old.rev) rides.set(m[1], { ...doc, at: Date.now() });
        send(res, 200, { ok: true });
      } catch {
        send(res, 400, { error: "bad json" });
      }
    });
    return;
  }
  if ((m = url.pathname.match(/^\/ride\/([\w-]+)$/))) {
    const r = rides.get(m[1]);
    return r ? send(res, 200, r) : send(res, 404, { error: "not found" });
  }
  if (url.pathname === "/rides/open") {
    const open = [...rides.entries()].filter(([, r]) => r.state && r.state.status === "searching" && Date.now() - r.at < 10 * 60 * 1000).map(([id, r]) => ({ id, ...r }));
    return send(res, 200, open);
  }
  if ((m = url.pathname.match(/^\/api\/trip\/([\w-]+)$/))) {
    const t = trips.get(m[1]);
    return t ? send(res, 200, t) : send(res, 404, { error: "not found" });
  }
  if (url.pathname === "/theme.css") {
    try {
      const css = require("fs").readFileSync(require("path").join(__dirname, "..", "public", "theme.css"));
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-cache", ...CORS });
      return res.end(css);
    } catch {
      return send(res, 404, "", "text/plain");
    }
  }
  if ((m = url.pathname.match(/^\/v\/(auto|bike|sedan|sedan2|taxi|premier|van|sleek|scooter)\.png$/))) {
    try {
      const buf = require("fs").readFileSync(require("path").join(__dirname, "..", "assets", "vehicles", `${m[1]}.png`));
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "max-age=86400", ...CORS });
      return res.end(buf);
    } catch {
      return send(res, 404, "", "text/plain");
    }
  }
  if ((m = url.pathname.match(/^\/logo-(black|white)\.png$/))) {
    try {
      const buf = require("fs").readFileSync(require("path").join(__dirname, "..", "assets", "logo", `mark-${m[1]}.png`));
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "max-age=86400", ...CORS });
      return res.end(buf);
    } catch {
      return send(res, 404, "", "text/plain");
    }
  }
  if ((m = url.pathname.match(/^\/t\/([\w-]+)$/))) return send(res, 200, require("./tracker-page")(m[1]), "text/html; charset=utf-8");
  send(res, 200, "Routiq realtime server", "text/plain");
});

const wss = new WebSocketServer({ server });
server.listen(8787, "0.0.0.0");
const snapshot = () => JSON.stringify({ type: "vehicles", ts: Date.now(), data: fleet.map(({ id, kind, lat, lon }) => ({ id, kind, lat, lon })) });

setInterval(() => {
  for (const v of fleet) {
    v.heading += rand(-0.4, 0.4); // wander along a slowly changing heading
    v.lat += Math.cos(v.heading) * 0.0003;
    v.lon += Math.sin(v.heading) * 0.0003;
  }
  const msg = snapshot();
  wss.clients.forEach((c) => c.readyState === 1 && c.send(msg));
}, 1000);

wss.on("connection", (ws) => ws.send(snapshot()));
console.log("Routiq server on port 8787: live vehicles (ws) and shared trip pages (/t/<id>)");
