import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

const pad = (n: number) => String(n).padStart(2, "0");
export const whenText = (ts: number | null) => {
  if (!ts) return "Pickup now";
  const d = new Date(ts);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const day = d.toDateString() === today.toDateString() ? "Today" : d.toDateString() === tomorrow.toDateString() ? "Tomorrow" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${day}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase()}`;
};

const QUICK: { label: string; ts: () => number | null }[] = [
  { label: "Now", ts: () => null },
  { label: "In 30 min", ts: () => Date.now() + 30 * 60000 },
  { label: "In 1 hour", ts: () => Date.now() + 60 * 60000 },
  { label: "In 2 hours", ts: () => Date.now() + 120 * 60000 },
];

/** Choose when to be picked up: now, soon, or any time in the next week. */
const SchedulePicker = ({ visible, value, onPick, onClose }: { visible: boolean; value: number | null; onPick: (ts: number | null) => void; onClose: () => void }) => {
  const [day, setDay] = useState(0); // days from today
  const [hour, setHour] = useState(9);
  const [min, setMin] = useState(0);
  const custom = () => {
    const d = new Date();
    d.setDate(d.getDate() + day);
    d.setHours(hour, min, 0, 0);
    return d.getTime();
  };
  const tooSoon = custom() < Date.now() + 10 * 60000;
  const stepper = (v: number, set: (n: number) => void, mod: number, step: number, label: string) => (
    <Row style={{ gap: 8 }}>
      <Pressable accessibilityLabel={`Earlier ${label}`} onPress={() => set((v - step + mod) % mod)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}><T style={{ fontSize: 22 }}>−</T></Pressable>
      <T style={{ fontFamily: font.extra, fontSize: 28, minWidth: 40, textAlign: "center" }}>{pad(v)}</T>
      <Pressable accessibilityLabel={`Later ${label}`} onPress={() => set((v + step) % mod)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}><T style={{ fontSize: 22 }}>+</T></Pressable>
    </Row>
  );

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 32 }}>
          <T style={{ fontFamily: font.extra, fontSize: 24 }}>When should we pick you up?</T>
          <T style={{ color: colors.muted, marginTop: 4 }}>Later rides get the Reserve offer: 20% off.</T>
          <Row style={{ gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {QUICK.map((q) => (
              <T key={q.label} onPress={() => onPick(q.ts())} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, overflow: "hidden", fontFamily: font.semi, backgroundColor: (q.label === "Now" && !value) ? colors.ink : colors.card, color: (q.label === "Now" && !value) ? colors.onInk : colors.text }}>{q.label}</T>
            ))}
          </Row>
          <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 22 }}>Pick a time</T>
          <Row style={{ gap: 8, marginTop: 10 }}>
            {[0, 1, 2, 3].map((d) => {
              const dt = new Date(Date.now() + d * 86400000);
              return (
                <T key={d} onPress={() => setDay(d)} style={{ flex: 1, textAlign: "center", paddingVertical: 10, borderRadius: 14, overflow: "hidden", fontFamily: font.semi, fontSize: 13, backgroundColor: day === d ? colors.ink : colors.card, color: day === d ? colors.onInk : colors.text }}>
                  {d === 0 ? "Today" : d === 1 ? "Tomorrow" : dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                </T>
              );
            })}
          </Row>
          <Row style={{ gap: 12, marginTop: 14, justifyContent: "center" }}>
            {stepper(hour, setHour, 24, 1, "hour")}
            <T style={{ fontFamily: font.extra, fontSize: 28 }}>:</T>
            {stepper(min, setMin, 60, 5, "minute")}
          </Row>
          {tooSoon && <T style={{ color: colors.red, marginTop: 8, textAlign: "center" }}>Pick a time at least 10 minutes from now.</T>}
          <Button title={tooSoon ? "Pick a later time" : `Schedule for ${whenText(custom())}`} disabled={tooSoon} onPress={() => onPick(custom())} style={{ marginTop: 14 }} />
          <Row style={{ justifyContent: "center", marginTop: 10, gap: 6 }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <T style={{ color: colors.muted, fontSize: 12 }}>We remind you 10 minutes before. The driver search starts when you tap Start.</T>
          </Row>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default SchedulePicker;
