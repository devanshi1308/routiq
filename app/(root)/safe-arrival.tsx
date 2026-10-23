import { Switch, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useSafetyStore } from "@/store/extras";

// Safe arrival: after a trip, one tap tells your trusted contacts you got there.
const SafeArrival = () => {
  const { safeArrival, setFlag, share } = useSafetyStore();
  return (
    <Page title="Safe arrival">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>When your trip ends, Routiq offers to message the people you trust: "Asha reached home safely." At night (9pm to 6am) it reminds you straight away.</T>
      <Row style={{ marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.card, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.bold, fontSize: 18 }}>Offer a safe-arrival message</T>
          <T style={{ color: safeArrival ? colors.green : colors.muted }}>{safeArrival ? "On" : "Off"}</T>
        </View>
        <Switch value={safeArrival} onValueChange={(v) => setFlag("safeArrival", v)} trackColor={{ true: colors.green }} />
      </Row>
      <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 16 }}>
        <T style={{ color: colors.muted, fontSize: 12 }}>PREVIEW</T>
        <T style={{ fontSize: 16, marginTop: 4 }}>Asha reached home safely 🏠 Sent from Routiq.</T>
      </View>
      <Row style={{ gap: 12, marginTop: 20, alignItems: "flex-start" }}>
        <Ionicons name="people-outline" size={24} />
        <T style={{ flex: 1, color: colors.muted, lineHeight: 21 }}>{share.length ? `Goes to: ${share.map((c) => c.name).join(", ")}. You tap Send in WhatsApp or Messages, so nothing goes out without you.` : "Add people under Share trip location in Safety first."}</T>
      </Row>
    </Page>
  );
};

export default SafeArrival;
