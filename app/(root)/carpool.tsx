import { router } from "expo-router";
import { Share, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useTripStore } from "@/store";

const STEPS = [
  ["navigate-outline", "Tell us where you're going", "We look for riders starting near you and ending near your drop-off."],
  ["people-outline", "Ride together", "Up to 3 people share one car. You see their first names and how much extra time it adds."],
  ["cash-outline", "Pay less", "The fare is split, so you pay about 35% less than a solo ride."],
  ["shield-checkmark-outline", "Safe by design", "Drivers are verified, co-riders only see your first name, and you can share your trip as usual."],
];

// Carpool together: share a ride with people going your way.
const Carpool = () => {
  const find = () => {
    useTripStore.getState().setPreferred("pool");
    router.push("/(root)/where-to");
  };
  return (
    <Page title="Carpool together">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Share a ride with people going the same way. It costs less and takes fewer cars off the road.</T>
      <Button title="Find a carpool" onPress={find} style={{ marginTop: 18 }} />
      {STEPS.map(([i, h, b]) => (
        <Row key={h} style={{ gap: 14, marginTop: 22, alignItems: "flex-start" }}>
          <Ionicons name={i as any} size={28} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{h}</T>
            <T style={{ color: colors.muted, fontSize: 15, lineHeight: 21 }}>{b}</T>
          </View>
        </Row>
      ))}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 26 }}>
        <T style={{ fontFamily: font.bold, fontSize: 17 }}>Ride with friends</T>
        <T style={{ color: colors.muted, marginTop: 4 }}>Invite someone to book the same carpool so you ride together.</T>
        <Button title="Invite a friend" variant="grey" onPress={() => Share.share({ message: "Ride with me on Routiq Carpool. Pick Carpool, enter where you're going, and we share the fare." }).catch(() => {})} style={{ marginTop: 12 }} />
      </View>
    </Page>
  );
};

export default Carpool;
