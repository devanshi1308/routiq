import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme, View } from "react-native";

import OfflineBanner from "@/components/OfflineBanner";
import { applyTheme, colors } from "@/constants/theme";
import { loadTheme, useThemeStore } from "@/lib/theme";

import { startTripEngine } from "@/lib/tripEngine";
import { startNotifications } from "@/lib/notify";
import { startSync } from "@/lib/sync";
import { startTripSharing } from "@/lib/tripShare";

startTripEngine();

export default function RootLayout() {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const scheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  applyTheme(scheme);
  useEffect(() => {
    loadTheme();
    // live sharing and two-phone sync are not needed to draw the first screen: start them after it is up
    const t = setTimeout(() => {
      startTripSharing();
      startSync();
      startNotifications();
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    Jakarta: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <Stack key={scheme} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(root)" />
      </Stack>
    </>
  );
}
