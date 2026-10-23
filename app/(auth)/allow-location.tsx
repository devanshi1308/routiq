import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Button, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { locate } from "@/lib/location";
import { setFlag } from "@/lib/persist";

// Shown once after the first sign-in, before the phone's own location prompt.
const AllowLocation = () => {
  const go = async (allow: boolean) => {
    await setFlag("askedLocation");
    if (allow) locate(); // triggers the system permission prompt; Home also asks if needed
    router.replace("/(root)/(tabs)/home");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Svg width={240} height={240} viewBox="0 0 240 240">
          <Circle cx={120} cy={120} r={112} fill="#F7F7F7" />
          <Circle cx={120} cy={120} r={80} fill="#EAF1FE" />
          <Circle cx={120} cy={120} r={46} fill="#D4E3FD" />
          <Rect x={40} y={118} width={160} height={6} rx={3} fill="#fff" />
          <Rect x={117} y={40} width={6} height={160} rx={3} fill="#fff" />
          <Path d="M120 70 C100 70 88 85 88 102 C88 124 120 156 120 156 C120 156 152 124 152 102 C152 85 140 70 120 70 Z" fill="#000" />
          <Circle cx={120} cy={102} r={13} fill="#fff" />
        </Svg>
        <T style={{ fontFamily: font.extra, fontSize: 28, textAlign: "center", marginTop: 28 }}>Allow your location</T>
        <T style={{ color: colors.muted, fontSize: 16, textAlign: "center", marginTop: 12, lineHeight: 24 }}>
          We use your location to find rides near you, set your pickup point and suggest popular places around you.
        </T>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 10 }}>
        <Button title="Ok, sure" onPress={() => go(true)} />
        <Button title="Not now" variant="grey" onPress={() => go(false)} />
      </View>
    </SafeAreaView>
  );
};

export default AllowLocation;
