import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Page, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

const TIPS = [
  ["Check before you get in", "Match the number plate, car model and driver photo in the app with the vehicle that arrives."],
  ["Share the PIN only at pickup", "Give the 4-digit PIN to your driver once you are in the vehicle. Never share it earlier or over chat."],
  ["Sit where you feel safe", "When riding alone at night, sit in the back seat and wear your seatbelt."],
  ["Share your trip", "Send your live trip to friends or family. They see the route and your ETA."],
  ["Keep the app open", "Follow the route on the map. If the driver goes a different way, use RideCheck or message us."],
  ["Stay reachable", "Keep your phone charged and your emergency contacts up to date."],
  ["Need help now?", "Use the emergency button in the ride screen or call 112 (India emergency number)."],
];

const ABOUT = [
  ["Verified drivers", "Every driver is checked before they can accept a ride: identity, licence, vehicle documents and a police verification."],
  ["PIN verification", "A trip only starts when the driver enters your PIN, so you ride with the right person."],
  ["Live trip sharing", "Share a link with people you trust. They follow the vehicle until you arrive."],
  ["RideCheck", "We notice long stops, detours and possible crashes, and check in with you."],
  ["Emergency contacts", "Add people we can reach when you press the emergency button."],
  ["Audio recording", "Record a ride's audio on your phone. Clips stay on your device and are yours to delete."],
  ["Ratings and feedback", "Riders and drivers rate each other. Repeated low ratings or reports lead to removal."],
  ["24x7 support", "Report a problem from Help at any time and our team responds."],
];

const SafetyInfo = () => {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const tips = kind !== "routiq";
  return (
    <Page title={tips ? "Safety tips" : "Safety at Routiq"}>
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16 }}>{tips ? "Small habits that keep every ride safer." : "How Routiq stands for your safety, from request to drop-off."}</T>
      {(tips ? TIPS : ABOUT).map(([h, b], i) => (
        <View key={h} style={{ flexDirection: "row", gap: 14, marginTop: 20 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
            <T style={{ color: colors.onInk, fontFamily: font.bold }}>{i + 1}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 18 }}>{h}</T>
            <T style={{ color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 2 }}>{b}</T>
          </View>
        </View>
      ))}
    </Page>
  );
};

export default SafetyInfo;
