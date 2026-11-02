import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useConfirm } from "@/components/Confirm";
import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useNoticeStore } from "@/store";
import { useWalletStore } from "@/store/extras";

const PRICE = 99;
const PERKS = [
  ["cash-outline", "Routiq Cash on every ride", "Earn up to 5% back as Routiq Cash on Auto, Go AC and Bike."],
  ["pricetag-outline", "Member-only offers", "Extra discounts and early access to promo codes."],
  ["close-circle-outline", "Free cancellation", "Cancel after a driver accepts without a fee, twice a month."],
  ["headset-outline", "Priority support", "Your help requests go to the front of the line."],
];
const METHODS = [
  { id: "cash", label: "Routiq Cash", icon: "wallet-outline" },
  { id: "upi", label: "UPI", icon: "qr-code-outline" },
  { id: "card", label: "Card", icon: "card-outline" },
] as const;

// Routiq One membership. Joining sits behind a paywall: pick how to pay, then pay. The payment is simulated for now,
// so no real money moves; a payment provider can replace the "pay" step later.
const RoutiqOne = () => {
  const { member, setMember, balance, spend, renews } = useWalletStore();
  const [step, setStep] = useState<"plan" | "pay" | "busy">("plan");
  const [via, setVia] = useState<"cash" | "upi" | "card">("upi");
  const [ask, dialog] = useConfirm();
  const short = via === "cash" && balance < PRICE;

  const pay = () => {
    setStep("busy");
    setTimeout(() => {
      if (via === "cash") spend(PRICE, "Routiq One, first month");
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      setMember(true, next.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }));
      useNoticeStore.getState().push({ kind: "ride", title: "Welcome to Routiq One", body: `₹${PRICE} paid with ${via === "cash" ? "Routiq Cash" : via.toUpperCase()}. Your membership is active.` });
      setStep("plan");
    }, 1600);
  };

  return (
    <Page title="Routiq One">
      {dialog}
      <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 22, marginTop: 18 }}>
        <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 22 }}>{member ? "You're a member" : "Save more on every ride"}</T>
        <T style={{ color: colors.onInk, marginTop: 6, fontSize: 16 }}>{member ? `Renews on ${renews || "next month"}.` : `₹${PRICE} for the first month, then ₹149 a month. Cancel any time.`}</T>
      </View>
      {PERKS.map(([i, h, b]) => (
        <Row key={h} style={{ gap: 14, marginTop: 20, alignItems: "flex-start" }}>
          <Ionicons name={i as any} size={28} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 18 }}>{h}</T>
            <T style={{ color: colors.muted, fontSize: 16, lineHeight: 22 }}>{b}</T>
          </View>
        </Row>
      ))}

      {member ? (
        <>
          <Button title="Cancel membership" variant="outline" onPress={() => ask({ title: "Leave Routiq One?", message: "You will lose the member perks at the end of this period.", confirm: "Leave", destructive: true, onConfirm: () => setMember(false) })} style={{ marginTop: 28 }} />
          <Button title="Back to activity" variant="grey" onPress={() => router.back()} style={{ marginTop: 10 }} />
        </>
      ) : step === "plan" ? (
        <>
          <Button title={`Join for ₹${PRICE}`} onPress={() => setStep("pay")} style={{ marginTop: 28 }} />
          <Button title="Not now" variant="grey" onPress={() => router.back()} style={{ marginTop: 10 }} />
        </>
      ) : (
        <View style={{ marginTop: 26 }}>
          <T style={{ fontFamily: font.bold, fontSize: 22 }}>Pay ₹{PRICE} to join</T>
          <T style={{ color: colors.muted, marginTop: 4 }}>Membership starts as soon as the payment goes through.</T>
          {METHODS.map((m) => (
            <Row key={m.id} onPress={() => step === "pay" && setVia(m.id)} style={{ gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name={m.icon as any} size={24} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.semi, fontSize: 17 }}>{m.label}</T>
                {m.id === "cash" && <T style={{ color: balance < PRICE ? colors.red : colors.muted, fontSize: 13 }}>Balance ₹{balance.toFixed(2)}{balance < PRICE ? " · not enough" : ""}</T>}
              </View>
              <Ionicons name={via === m.id ? "radio-button-on" : "radio-button-off"} size={24} />
            </Row>
          ))}
          {short && <T onPress={() => router.push("/(root)/add-cash" as any)} style={{ color: colors.blue, fontFamily: font.semi, marginTop: 10 }}>Add cash to your wallet</T>}
          <Button title={step === "busy" ? "Processing…" : `Pay ₹${PRICE}`} disabled={short || step === "busy"} onPress={pay} style={{ marginTop: 18 }} />
          {step === "busy" && <ActivityIndicator style={{ marginTop: 12 }} />}
          <Button title="Back" variant="grey" disabled={step === "busy"} onPress={() => setStep("plan")} style={{ marginTop: 10 }} />
          <T style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 10 }}>Test payment: no real money is charged yet.</T>
        </View>
      )}
    </Page>
  );
};

export default RoutiqOne;
