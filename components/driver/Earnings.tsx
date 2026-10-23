import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

const Tile = ({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${value}. Open earnings`} onPress={onPress} style={({ pressed }) => ({ flex: 1, backgroundColor: colors.bg, borderRadius: 18, padding: 14, opacity: pressed ? 0.7 : 1 })}>
    <T style={{ color: colors.muted, fontSize: 12 }}>{label}</T>
    <T style={{ fontFamily: font.extra, fontSize: 22, marginTop: 4 }}>{value}</T>
  </Pressable>
);

/** Trips and earnings for this session. */
const Earnings = ({ trips, total }: { trips: number; total: number }) => {
  const open = () => router.push("/(root)/driver-earnings" as any);
  return (
  <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
    <Tile label="Trips" value={String(trips)} onPress={open} />
    <Tile label="Earned" value={`₹${total.toFixed(0)}`} onPress={open} />
  </View>
  );
};

export default Earnings;
