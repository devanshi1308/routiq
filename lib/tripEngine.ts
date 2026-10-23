import { track, useAnalytics } from "@/lib/analytics";
import { toBatches } from "@/lib/dispatch";
import { useDriverLoc } from "@/lib/driverLoc";
import { haversineKm } from "@/lib/mock";
import { useSafetyStore, useWalletStore } from "@/store/extras";
import { useAuthStore, useBusinessStore, useChatStore, useHistoryStore, useNoticeStore, useTripStore } from "@/store";

// Runs the trip in the background, independent of which screen is open. That way a driver logged in on their own
// screen and a rider on theirs see the same trip: ETA countdown, vehicle movement, notices, auto-play and history.
const SPEEDUP = 10; // the demo runs the driver's approach 10x faster than real time

let started = false;
let etaTimer: ReturnType<typeof setInterval> | undefined;
let progTimer: ReturnType<typeof setInterval> | undefined;
let autoTimer: ReturnType<typeof setTimeout> | undefined;
let autoKey = "";
let waveKey = "";
let etaKey = ""; // the trip whose approach countdown has already started
let doneKey = "";
let noDriverTimer: ReturnType<typeof setTimeout> | undefined;

const dateLabel = () => {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })} • ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`;
};

const react = () => {
  const s = useTripStore.getState();

  // 1) tell the current batch of nearby drivers about the request (once per batch)
  if (s.status === "searching") {
    const batches = toBatches(s.dispatch?.candidates ?? []);
    const key = `${s.requestId}:${s.batchNo}`;
    const wave = batches[s.batchNo];
    if (!batches.length && !noDriverTimer) {
      noDriverTimer = setTimeout(() => {
        noDriverTimer = undefined;
        if (useTripStore.getState().status === "searching") {
          useTripStore.getState().assignDriver();
          useTripStore.setState({ status: "driver_assigned" });
        }
      }, 3000);
    }
    if (wave && key !== waveKey) {
      waveKey = key;
      track("dispatch_batch", { request_id: s.requestId, batch: s.batchNo + 1, drivers: wave.length });
    }
  } else if (s.status === "idle") {
    waveKey = "";
    etaKey = "";
  }

  // 2) driver approaching: count the ETA down and move the driver's vehicle toward the pickup
  if (s.status === "driver_assigned" && s.driver && !s.remote && !etaTimer && etaKey !== s.requestId) {
    etaKey = s.requestId;
    const cand = s.dispatch?.candidates.find((c) => c.id === s.driver!.id);
    const real = useAuthStore.getState().role === "driver" ? useDriverLoc.getState().pos : null; // the driver's own phone position
    const from = real ?? cand ?? { latitude: s.pickup.latitude + 0.01, longitude: s.pickup.longitude + 0.01 };
    const total = real ? Math.max(60, Math.round(((haversineKm({ ...s.pickup, ...real }, s.pickup) * 1.3) / 25) * 3600)) : (cand?.etaMin ?? 3) * 60;
    let elapsed = 0;
    etaTimer = setInterval(() => {
      elapsed += 1;
      const remaining = Math.max(0, total - elapsed * SPEEDUP);
      const f = 1 - remaining / total;
      const p = useTripStore.getState().pickup;
      useTripStore.setState({
        etaSec: remaining,
        driverPos: { latitude: from.latitude + (p.latitude - from.latitude) * f, longitude: from.longitude + (p.longitude - from.longitude) * f },
      });
      if (remaining === 0 && etaTimer) {
        clearInterval(etaTimer);
        etaTimer = undefined;
      }
    }, 1000);
    useTripStore.setState({ etaSec: total, driverPos: { latitude: from.latitude, longitude: from.longitude } });
    useChatStore.getState().send("driver", `Hi, I'm ${s.driver.name.split(" ")[0]}. I'm on my way in a ${s.driver.vehicle} (${s.driver.plate}).`);
  }
  if (s.status !== "driver_assigned" && etaTimer) {
    clearInterval(etaTimer);
    etaTimer = undefined;
  }

  // 3) trip in progress: the vehicle moves along the route
  if (s.status === "in_progress" && !s.remote && !progTimer) {
    progTimer = setInterval(() => useTripStore.setState((st) => ({ progress: Math.min(1, st.progress + 0.04) })), 300);
  }
  if (s.status !== "in_progress" && progTimer) {
    clearInterval(progTimer);
    progTimer = undefined;
  }

  // 4) trip completed: record it once, with a receipt for business rides
  if (s.status === "completed" && s.destination && s.rideType && doneKey !== s.requestId) {
    doneKey = s.requestId;
    const everyone = s.split.length + 1; // the rider plus the friends the fare is split with
    const total = +((s.fare + s.tip) / everyone).toFixed(2); // what this rider pays
    if (s.split.length) useNoticeStore.getState().push({ kind: "ride", title: `Fare split ${everyone} ways`, body: `Each person pays ₹${total.toFixed(2)}. Send a payment request to ${s.split.map((p) => p.name).join(", ")} from the ride screen.` });
    const biz = useBusinessStore.getState();
    const business = !!(biz.active && biz.business);
    track("ride_completed", { request_id: s.requestId, fare: total, source: useAnalytics.getState().source });
    useNoticeStore.getState().push({ kind: "ride", title: "Trip completed", body: `You reached ${s.destination.name}. Total ₹${total.toFixed(2)}${s.tip ? ` including a ₹${s.tip} tip` : ""}.` });
    if (business && biz.business) {
      useNoticeStore.getState().push({ kind: "business", title: "Business receipt sent", body: `Receipt for ₹${total.toFixed(2)} to ${s.destination.name} was emailed to ${biz.business.email}.` });
    }
    // night trip: remind the rider to tell their trusted contacts they arrived
    const hr = new Date().getHours();
    const contacts = useSafetyStore.getState();
    if (contacts.safeArrival && contacts.share.length && (hr >= 21 || hr < 6)) {
      useNoticeStore.getState().push({ kind: "ride", title: "Tell them you got there safe 🏠", body: `Send ${contacts.share.map((c) => c.name).join(", ")} a quick "reached safely" message from the ride screen.` });
    }
    // Routiq Cash pays first when it is switched on in Pay with
    const wallet = useWalletStore.getState();
    if (s.useUberCash && wallet.balance > 0) {
      const used = Math.min(wallet.balance, total);
      wallet.spend(used, `Ride to ${s.destination.name}`);
      useNoticeStore.getState().push({ kind: "ride", title: `₹${used.toFixed(2)} paid from Routiq Cash`, body: `Balance ₹${(wallet.balance - used).toFixed(2)}.` });
    }
    useHistoryStore.getState().add({
      id: `r${Date.now()}`,
      place: s.destination.name,
      dest: s.destination,
      date: dateLabel(),
      fare: total,
      status: "Completed",
      rideType: s.rideType.name,
      emoji: s.rideType.emoji,
      business,
    });
  }

  // 5) auto-play (off by default): does the driver's steps on timers so the demo can run hands-free
  const phase = s.autopilot ? `${s.status}:${s.batchNo}:${s.etaSec <= 0}:${s.progress >= 1}` : "";
  if (phase !== autoKey) {
    autoKey = phase;
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = undefined;
    if (s.autopilot) {
      const batches = toBatches(s.dispatch?.candidates ?? []);
      const st = useTripStore.getState();
      if (s.status === "searching" && batches[s.batchNo]) autoTimer = setTimeout(() => (s.batchNo === Math.min(1, batches.length - 1) ? st.acceptRide() : st.declineBatch()), 2500);
      else if (s.status === "driver_assigned" && s.etaSec <= 0) autoTimer = setTimeout(() => useTripStore.getState().markArrived(), 1000);
      else if (s.status === "driver_arrived") autoTimer = setTimeout(() => useTripStore.getState().startTrip(useTripStore.getState().pin), 3500);
      else if (s.status === "in_progress" && s.progress >= 1) autoTimer = setTimeout(() => useTripStore.getState().endTrip(), 1000);
    }
  }
};

export const startTripEngine = () => {
  if (started) return;
  started = true;
  useTripStore.subscribe(react);
};
