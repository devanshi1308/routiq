import { Switch, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useNoticeStore } from "@/store";
import { useSafetyStore } from "@/store/extras";

const WHEN = ["A long unexpected stop", "A big detour from the route", "A possible crash"];

const RideCheck = () => {
  const { rideCheck, setRideCheck } = useSafetyStore();
  return (
    <Page title="RideCheck">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>RideCheck watches your trip. If something looks wrong we check in with you, and you can get help in one tap.</T>
      <Row style={{ marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.card, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.bold, fontSize: 18 }}>RideCheck on all trips</T>
          <T style={{ color: colors.muted }}>{rideCheck ? "On" : "Off"}</T>
        </View>
        <Switch value={rideCheck} onValueChange={setRideCheck} />
      </Row>
      <T style={{ fontFamily: font.bold, fontSize: 20, marginTop: 26, marginBottom: 6 }}>We check in when we notice</T>
      {WHEN.map((w) => (
        <Row key={w} style={{ gap: 12, paddingVertical: 10 }}>
          <Ionicons name="alert-circle-outline" size={22} />
          <T style={{ fontSize: 17 }}>{w}</T>
        </Row>
      ))}
      <Button
        title="Send me a test check-in"
        variant="grey"
        style={{ marginTop: 20, opacity: rideCheck ? 1 : 0.5 }}
        disabled={!rideCheck}
        onPress={() => useNoticeStore.getState().push({ kind: "ride", title: "RideCheck", body: "Test: we noticed a long stop. Are you OK? Tap to share your trip or call for help." })}
      />
      <T style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>The test message appears in your Inbox under Updates.</T>
    </Page>
  );
};

export default RideCheck;
