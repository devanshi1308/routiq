import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

export const FAQ: Record<string, [string, string][]> = {
  Account: [
    ["How do I change my phone number or email?", "Open Account, then your profile picture. Edit the number or email and confirm with the code we send."],
    ["How do I delete my account?", "Go to Account, then your profile, then Privacy. Deleting removes your trips, wallet balance and saved places."],
  ],
  "Ride problems": [
    ["My driver is not moving", "Message your driver from the ride screen. If there is no reply in a few minutes, cancel and we find you another driver at no charge."],
    ["I was charged more than the estimate", "Fares change if the route changes or you add stops. Open the trip in Activity to see the breakdown."],
    ["I left something in the vehicle", "Open the trip in Activity and tap Call driver to ask for your item back."],
  ],
  "Payments and wallet": [
    ["How do I add money to Routiq Cash?", "Open Wallet, tap Add cash, choose an amount and pay with UPI or card."],
    ["How do offer codes work?", "Add a code in Inbox or Wallet. The best offer is applied to your next ride automatically."],
  ],
  "Cancellation policy": [
    ["Is there a fee to cancel?", "Cancelling in the first 2 minutes after a driver accepts is free. After that a small fee may apply."],
    ["What if the driver cancels?", "You pay nothing and we start looking for another driver straight away."],
  ],
  "Safety and emergencies": [
    ["What does the PIN do?", "The driver must enter your 4-digit PIN to start the trip, so you ride with the right person."],
    ["How do I share my trip?", "Add people under Safety, then Share trip location. They get a live link during the ride."],
  ],
  "Maps and routes": [
    ["The route looks wrong", "Shortest route is the default. You can choose another route before booking; the driver follows the route you pick."],
    ["My pickup spot is wrong", "Drag the map pin or search for the spot on the confirm pickup screen."],
  ],
  Accessibility: [["Can I ride with a wheelchair or a service animal?", "Yes. Add a note for your driver after booking. Drivers must accept service animals."]],
  "Grievance redressal": [["How do I raise a complaint?", "Write to us from this page with your trip and details. We respond within 24 hours and escalate within 7 days."]],
};

// One help topic: tap a question to open its answer.
const HelpTopic = () => {
  const { t } = useLocalSearchParams<{ t?: string }>();
  const [open, setOpen] = useState<number | null>(0);
  const items = FAQ[t ?? ""] ?? FAQ["Ride problems"];
  return (
    <Page title={t ?? "Help"}>
      {items.map(([q, a], i) => (
        <View key={q} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Row onPress={() => setOpen(open === i ? null : i)} style={{ paddingVertical: 18, gap: 10 }}>
            <T style={{ flex: 1, fontFamily: font.semi, fontSize: 18 }}>{q}</T>
            <Ionicons name={open === i ? "chevron-up" : "chevron-down"} size={20} />
          </Row>
          {open === i && <T style={{ color: colors.muted, fontSize: 16, lineHeight: 24, paddingBottom: 18 }}>{a}</T>}
        </View>
      ))}
      <T style={{ marginTop: 26, fontFamily: font.bold, fontSize: 18 }}>Still need help?</T>
      <Button title="Message support" variant="grey" style={{ marginTop: 10 }} onPress={() => router.push({ pathname: "/(root)/chat", params: { with: "support" } } as any)} />
    </Page>
  );
};

export default HelpTopic;
