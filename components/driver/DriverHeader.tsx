import { Pressable, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

type Props = { title: string; name?: string; vehicle?: string; plate?: string; rating?: number; onPress?: () => void };

/** Big title plus a small driver card: initial, name, vehicle and plate. */
const DriverHeader = ({ title, name, vehicle, plate, onPress }: Props) => (
  <View style={{ marginTop: 18 }}>
    <T style={{ fontFamily: font.extra, fontSize: 32, lineHeight: 38 }}>{title}</T>
    {!!name && (
      <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityLabel="Open my account" onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
          <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 18 }}>{name[0]}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: font.bold, fontSize: 16 }}>{name}</T>
          <T style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>{[vehicle, plate].filter(Boolean).join(" · ")}</T>
        </View>

        {onPress && <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
      </Pressable>
    )}
  </View>
);

export default DriverHeader;
