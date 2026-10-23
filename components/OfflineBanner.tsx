import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font } from "@/constants/theme";

/** Hook: true when the phone has no working internet. */
export const useOffline = () => {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => setOff(s.isConnected === false || s.isInternetReachable === false));
    return () => sub();
  }, []);
  return off;
};

/** A thin red strip across the top whenever the internet drops. The app keeps working offline where it can. */
const OfflineBanner = () => {
  const off = useOffline();
  const inset = useSafeAreaInsets();
  if (!off) return null;
  return (
    <View accessibilityLiveRegion="polite" pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: colors.red, paddingTop: Platform.OS === "web" ? 6 : inset.top + 4, paddingBottom: 8, paddingHorizontal: 16 }}>
      <Text style={{ color: "#fff", fontFamily: font.bold, fontSize: 13, textAlign: "center" }}>No internet. Maps, live tracking and sharing are paused.</Text>
    </View>
  );
};

export default OfflineBanner;
