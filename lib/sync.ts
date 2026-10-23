import { trackBase } from "@/lib/tripShare";
import { useAuthStore, useChatStore, useTripStore } from "@/store";

// Keeps the rider's phone and the driver's phone showing the same ride. Every second each phone sends what changed
// and reads what the other phone sent. The newest change wins (rev = time of the change).
const DEVICE = Math.random().toString(36).slice(2, 10);
let lastSynced = "";
let lastRev = 0;

const serialize = () => {
  const t = useTripStore.getState();
  return JSON.stringify({
    status: t.status, destination: t.destination, pickup: t.pickup, rideType: t.rideType, routes: t.routes, routeIndex: t.routeIndex,
    fare: t.fare, boost: t.boost, tip: t.tip, requestId: t.requestId, pin: t.pin, dispatch: t.dispatch, batchNo: t.batchNo, extras: t.extras, womenOnly: t.womenOnly, favDriver: t.favDriver, split: t.split,
    driver: t.driver, etaSec: Math.round(t.etaSec), progress: +t.progress.toFixed(3), driverPos: t.driverPos, payment: t.payment,
    riderName: useAuthStore.getState().name, chat: useChatStore.getState().messages,
  });
};

const apply = (json: string, rev: number) => {
  const { chat, riderName: _n, ...state } = JSON.parse(json);
  const role = useAuthStore.getState().role;
  // the rider's phone only mirrors a trip a driver is driving; the driver's phone runs the timers
  useTripStore.setState({ ...state, remote: role === "rider" && state.status !== "searching" });
  const have = useChatStore.getState().messages;
  const ids = new Set(have.map((m) => m.id));
  const extra = (chat as typeof have).filter((m) => !ids.has(m.id));
  if (extra.length) useChatStore.setState({ messages: [...have, ...extra], unread: useChatStore.getState().unread + extra.length });
  lastSynced = serialize();
  lastRev = rev;
};

const get = async (path: string) => {
  try {
    const r = await fetch(`${trackBase()}${path}`);
    return r.ok ? await r.json() : null;
  } catch {
    return null; // server not running: both phones keep working on their own
  }
};

const tick = async () => {
  const { signedIn, role } = useAuthStore.getState();
  if (!signedIn) return;
  const t = useTripStore.getState();

  // 1) read what the other phone sent
  if (t.requestId && t.status !== "idle") {
    const doc = await get(`/ride/${t.requestId}`);
    if (doc && doc.device !== DEVICE && doc.rev > lastRev) apply(JSON.stringify(doc.state), doc.rev);
  } else if (role === "driver" && t.status === "idle") {
    const open = await get("/rides/open");
    const doc = open?.find((d: any) => d.device !== DEVICE);
    if (doc) apply(JSON.stringify(doc.state), doc.rev);
  }

  // 2) a rider who cancelled or a finished trip clears the driver's screen after a moment
  const now = useTripStore.getState();
  if (role === "driver" && now.status === "cancelled") setTimeout(() => useTripStore.getState().reset(), 3000);

  // 3) send what changed here
  if (now.requestId && now.status !== "idle") {
    const cur = serialize();
    if (cur !== lastSynced) {
      lastSynced = cur;
      lastRev = Date.now();
      try {
        await fetch(`${trackBase()}/ride/${now.requestId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device: DEVICE, rev: lastRev, state: JSON.parse(cur) }) });
      } catch {}
    }
  }
};

let started = false;
export const startSync = () => {
  if (started) return;
  started = true;
  let busy = false;
  setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await tick();
    } finally {
      busy = false;
    }
  }, 1000);
};
