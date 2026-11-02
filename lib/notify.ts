import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

import { maskPlate, shortName } from "@/lib/privacy";
import { useNoticeStore, useTripStore } from "@/store";
import { useCommuteStore, useNotifyStore, useScheduledStore } from "@/store/extras";

// Friendly, a little cheeky phone notifications about rides. All are local: they are scheduled on the phone,
// so they work with no server. Rules: at most one nudge every two days, never during quiet hours (10pm to 8am),
// and each kind can be switched off in Account, Notifications.
const NUDGES: [string, string][] = [
  ["auto bhaiya is bored 🛺", "he's been parked for ages. be kind, book a ride?"],
  ["traffic nahi, tension nahi", "we can't fix the traffic, but we can fix your seat. 🚕"],
  ["rain check? ☔", "paani bhar gaya? your ride stays dry, you stay fashionable."],
  ["monday blues?", "let someone else drive them away. book a ride 🚖"],
  ["split the fare, not the friendship 🤝", "going out with friends? split the ride in one tap."],
  ["your favourite driver is online 💛", "ask for them first next time. they'd like that."],
  ["late ho rahe ho?", "tell us where. we'll tell the auto. ⏱️"],
  ["pssst. 🛵", "a bike gets you there before your chai gets cold."],
  ["chai ya cab? ☕", "why not both. we'll bring the ride, you bring the chai."],
  ["friday feeling 🎉", "going out? split the fare with friends in one tap."],
  ["office jaana hai? 💼", "set up your daily commute once. we'll remind you every morning."],
  ["late night ho gayi? 🌙", "ride home safe and tell your people you reached. we'll help."],
  ["weekend plans? 🛺", "autos are cheaper than that parking ticket. just saying."],
  ["your people are waiting 💛", "share your ride live so they know exactly when you'll arrive."],
  ["bheed se bacho 🚦", "carpool with people going your way. pay about 35% less."],
  ["quick one 👀", "an offer is waiting in your inbox. check the price before you ride."],
];
const COMMUTE: [string, string][] = [
  ["your {time} commute is calling 📞", "{label}. one tap and a driver is on the way."],
  ["main character hours ✨", "{label} at {time}. your ride is one tap away."],
  ["chalo, time ho gaya 🚦", "{label}. we saved you the trouble of thinking."],
];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

const supported = Platform.OS !== "web";

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export const askNotifyPermission = async () => {
  if (!supported) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
};

export const sendNow = async (title: string, body: string) => {
  if (!supported || !(await Notifications.getPermissionsAsync()).granted) return false;
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  return true;
};

/** A funny one on demand, for the "send me a test" button. */
export const sendTest = async () => {
  const [t, b] = pick(NUDGES);
  return sendNow(t, b);
};

/** A reminder 10 minutes before a ride booked for later. */
export const scheduleRideReminder = async (id: string, when: number, where: string) => {
  if (!supported || !(await askNotifyPermission())) return;
  const at = new Date(Math.max(Date.now() + 5000, when - 10 * 60000));
  await Notifications.scheduleNotificationAsync({
    identifier: `ride-${id}`,
    content: { title: "your ride is almost due 🚕", body: `Pickup at ${new Date(when).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase()}. Open Routiq and tap Start to find a driver to ${where}.` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
};
export const cancelRideReminder = (id: string) => (supported ? Notifications.cancelScheduledNotificationAsync(`ride-${id}`).catch(() => {}) : undefined);

/** Cancels everything scheduled and schedules it again from the current settings. */
export const rescheduleAll = async () => {
  if (!supported || !(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of useScheduledStore.getState().rides) await scheduleRideReminder(r.id, r.when, r.dest.name); // keep reminders for rides booked for later
  const { commute, nudges } = useNotifyStore.getState();

  if (commute) {
    for (const p of useCommuteStore.getState().plans.filter((x) => x.on)) {
      const [h, m] = p.time.split(":").map(Number);
      const [title, body] = pick(COMMUTE);
      for (const d of p.days) {
        await Notifications.scheduleNotificationAsync({
          content: { title: fill(title, { time: p.time, label: p.label }), body: fill(body, { time: p.time, label: p.label }) },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: d + 1, hour: h, minute: m },
        });
      }
    }
  }
  if (nudges) {
    // how often: low = every other day evening, normal = every evening, high = morning and evening for a week
    const { freq } = useNotifyStore.getState();
    const days = freq === "low" ? [1, 3, 5] : [1, 2, 3, 4, 5, 6, 7];
    const hours: [number, number][] = freq === "high" ? [[9, 30], [18, 30]] : [[18, 30]];
    const bank = [...NUDGES].sort(() => Math.random() - 0.5); // a different line each time, none repeated in a row
    let n = 0;
    for (const d of days) {
      for (const [h, m] of hours) {
        const at = new Date();
        at.setDate(at.getDate() + d);
        at.setHours(h, m, 0, 0);
        const [title, body] = bank[n++ % bank.length];
        await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at } });
      }
    }
  }
};

// ---- Ride card: one notification that is replaced as the ride moves (requested, arriving, on the way, arrived) ----
const RIDE_ID = "routiq-ride";
const icon = (emoji: string) => (emoji === "bike" ? "🏍️" : emoji === "auto" ? "🛺" : "🚕");
/** ━━━●┈┈┈┈ : ten steps, the dot is where the ride is */
const bar = (f: number) => {
  const i = Math.min(9, Math.floor(Math.max(0, Math.min(1, f)) * 10));
  return "━".repeat(i) + "●" + "┈".repeat(9 - i);
};
let lastCard = "";

const rideCard = () => {
  const t = useTripStore.getState();
  if (!useNotifyStore.getState().rides || !t.rideType) return;
  const v = icon(t.rideType.emoji);
  let title = "";
  let body = "";
  let frac = 0;
  let end = "📍";
  if (t.status === "searching") {
    title = `Ride requested · ${t.rideType.name}`;
    body = "Asking drivers near you…";
    frac = 0.04;
  } else if (t.status === "driver_assigned" && t.driver) {
    const mins = Math.max(1, Math.ceil(t.etaSec / 60));
    title = `${shortName(t.driver.name)} is arriving in ${mins} min`;
    body = `On time | ${t.driver.vehicle} · ${maskPlate(t.driver.plate)} | PIN ${t.pin}`;
    frac = 0.04 + 0.4 * (1 - Math.min(1, t.etaSec / Math.max(60, mins * 60 + 60)));
  } else if (t.status === "driver_arrived" && t.driver) {
    title = `${shortName(t.driver.name)} has arrived 🎉`;
    body = `Share your PIN ${t.pin} to start the trip`;
    frac = 0.45;
  } else if (t.status === "in_progress" && t.destination) {
    const left = Math.max(1, Math.ceil((t.routes[t.routeIndex]?.minutes ?? 10) * (1 - t.progress)));
    title = `Dropoff in ${left} min`;
    body = `On time | Heading to ${t.destination.name}`;
    frac = 0.5 + 0.5 * t.progress;
    end = "🏠";
  } else if (t.status === "completed") {
    title = "You've arrived 🏠";
    body = `₹${(t.fare + t.tip).toFixed(0)} | Tap to rate your driver`;
    frac = 1;
    end = "🏠";
  } else {
    if (lastCard) Notifications.dismissNotificationAsync(RIDE_ID).catch(() => {});
    lastCard = "";
    return;
  }
  const text = `${body}\n${v} ${bar(frac)} ${end}`;
  if (`${title}${text}` === lastCard) return;
  lastCard = `${title}${text}`;
  Notifications.scheduleNotificationAsync({ identifier: RIDE_ID, content: { title, body: text }, trigger: null }).catch(() => {});
};

let started = false;
export const startNotifications = () => {
  if (started || !supported) return;
  started = true;
  rescheduleAll();
  // plans or settings changed: schedule again
  useCommuteStore.subscribe(() => rescheduleAll());
  useNotifyStore.subscribe(() => rescheduleAll());
  // the ride card follows the trip
  useTripStore.subscribe(rideCard);
  // other notices (safe arrival, split fare, wallet) reach the phone when the app is in the background
  let seen = useNoticeStore.getState().items.length;
  useNoticeStore.subscribe((s) => {
    if (s.items.length > seen && useNotifyStore.getState().rides && AppState.currentState !== "active" && /safe|split|Routiq Cash|RideCheck/i.test(s.items[0].title)) {
      const n = s.items[0];
      sendNow(n.title, n.body);
    }
    seen = s.items.length;
  });
};
