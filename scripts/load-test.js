// Load test for scripts/realtime-server.js: N simulated rides, each sends its state and reads the other side's every second.
//   node scripts/load-test.js 500 15      (500 rides for 15 seconds)
const http = require("http");
const N = +process.argv[2] || 100;
const SECONDS = +process.argv[3] || 10;
const agent = new http.Agent({ keepAlive: true, maxSockets: 2000 });
const state = JSON.stringify({ status: "driver_assigned", routes: [{ coords: Array.from({ length: 120 }, (_, i) => [19.13 + i * 1e-4, 72.85 + i * 1e-4]) }], dispatch: { candidates: Array.from({ length: 9 }, (_, i) => ({ id: i, name: "Driver", latitude: 19.1, longitude: 72.8 })) }, etaSec: 120, progress: 0.4, chat: [] });
const lat = [];
let errors = 0, done = 0;

const call = (method, path, body) =>
  new Promise((res) => {
    const t = process.hrtime.bigint();
    const r = http.request({ host: "127.0.0.1", port: 8787, method, path, agent, headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {} }, (resp) => {
      resp.resume();
      resp.on("end", () => {
        lat.push(Number(process.hrtime.bigint() - t) / 1e6);
        if (resp.statusCode >= 500) errors++;
        done++;
        res();
      });
    });
    r.on("error", () => { errors++; res(); });
    if (body) r.write(body);
    r.end();
  });

const end = Date.now() + SECONDS * 1000;
const rider = async (i) => {
  while (Date.now() < end) {
    const start = Date.now();
    await Promise.all([call("POST", `/ride/load-${i}`, JSON.stringify({ device: "a" + i, rev: Date.now(), state: JSON.parse(state) })), call("GET", `/ride/load-${i}`)]);
    await new Promise((r) => setTimeout(r, Math.max(0, 1000 - (Date.now() - start))));
  }
};
(async () => {
  const t0 = Date.now();
  await Promise.all(Array.from({ length: N }, (_, i) => new Promise((r) => setTimeout(r, Math.random() * 1000)).then(() => rider(i))));
  lat.sort((a, b) => a - b);
  const q = (p) => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))].toFixed(1);
  console.log(`${N} rides: ${(done / ((Date.now() - t0) / 1000)).toFixed(0)} req/s, p50 ${q(0.5)} ms, p95 ${q(0.95)} ms, p99 ${q(0.99)} ms, errors ${errors}/${done}`);
  process.exit(0);
})();
