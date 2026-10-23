import { router } from "expo-router";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useNoticeStore } from "@/store";
import { useWalletStore } from "@/store/extras";

const PERKS = [
  ["cash-outline", "Routiq Cash on every ride", "Earn up to 5% back as Routiq Cash on Auto, Go AC and Bike."],
  ["pricetag-outline", "Member-only offers", "Extra discounts and early access to promo codes."],
  ["close-circle-outline", "Free cancellation", "Cancel after a driver accepts without a fee, twice a month."],
  ["headset-outline", "Priority support", "Your help requests go to the front of the line."],
];

// Routiq One membership (simulated).
const RoutiqOne = () => {
  const { member, setMember } = useWalletStore();
  const toggle = () => {
    setMember(!member);
    if (!member) useNoticeStore.getState().push({ kind: "ride", title: "Welcome to Routiq One", body: "Your membership is active. Cash back is added after each ride." });
  };
  return (
    <Page title="Routiq One">
      <View style={{ backgroundColor: colors.ink, borderRadius: 20, padding: 22, marginTop: 18 }}>
        <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 22 }}>{member ? "You're a member" : "Save more on every ride"}</T>
        <T style={{ color: colors.onInk, marginTop: 6, fontSize: 16 }}>{member ? "Thanks for being part of Routiq One." : "₹99 for the first month, then ₹149 a month. Cancel any time."}</T>
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
      <Button title={member ? "Leave Routiq One" : "Join for ₹99"} variant={member ? "outline" : "black"} onPress={toggle} style={{ marginTop: 28 }} />
      <Button title="Back to activity" variant="grey" onPress={() => router.back()} style={{ marginTop: 10 }} />
    </Page>
  );
};

export default RoutiqOne;
