import { Switch, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useSafetyStore } from "@/store/extras";

const POINTS = [
  ["woman-outline", "Women drivers only", "When this is on, only women drivers are asked to take your ride."],
  ["time-outline", "Waits can be longer", "Fewer women drivers are online, so matching can take a little more time."],
  ["shield-checkmark-outline", "Verified drivers", "Every driver, including women drivers, is identity and document verified."],
  ["eye-off-outline", "Private by default", "Drivers never see why you chose this. They only see a normal ride request."],
];

// Women Rider Preferences: choose once here, switch it per ride on the ride screen.
const WomenRider = () => {
  const { womenPref, setFlag } = useSafetyStore();
  return (
    <Page title="Women Rider Preferences" art={require("../../assets/illustrations/car-pair.webp")}>
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Ask for a woman driver whenever you ride. You can still turn it off for a single ride.</T>
      <Row style={{ marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.card, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.bold, fontSize: 18 }}>Prefer women drivers</T>
          <T style={{ color: womenPref ? colors.green : colors.muted }}>{womenPref ? "On for every ride" : "Off"}</T>
        </View>
        <Switch value={womenPref} onValueChange={(v) => setFlag("womenPref", v)} trackColor={{ true: colors.green }} />
      </Row>
      {POINTS.map(([i, h, b]) => (
        <Row key={h} style={{ gap: 14, marginTop: 20, alignItems: "flex-start" }}>
          <Ionicons name={i as any} size={26} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{h}</T>
            <T style={{ color: colors.muted, fontSize: 15, lineHeight: 21 }}>{b}</T>
          </View>
        </Row>
      ))}
    </Page>
  );
};

export default WomenRider;
