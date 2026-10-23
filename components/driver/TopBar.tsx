import { Pressable, Switch, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

type Props = { isDriver: boolean; online: boolean; onOnline: (v: boolean) => void; onLeave: () => void; onProfile?: () => void };

/** Top row: sign out (driver) or back to the rider view, plus the online switch. */
const TopBar = ({ isDriver, online, onOnline, onLeave, onProfile }: Props) => (
  <Row style={{ justifyContent: "space-between" }}>
    <Row onPress={onLeave} style={{ gap: 8, backgroundColor: colors.bg, paddingHorizontal: 14, height: 40, borderRadius: 20 }}>
      <Ionicons name={isDriver ? "log-out-outline" : "arrow-back"} size={20} />
      <T style={{ fontFamily: font.semi }}>{isDriver ? "Sign out" : "Rider view"}</T>
    </Row>
    {isDriver && (
      <Row style={{ gap: 8, backgroundColor: colors.bg, paddingLeft: 14, paddingRight: 8, height: 40, borderRadius: 20 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: online ? colors.green : colors.muted }} />
        <T style={{ fontFamily: font.semi, fontSize: 13 }}>{online ? "Online" : "Offline"}</T>
        <Switch value={online} onValueChange={onOnline} trackColor={{ true: colors.green }} />
        {onProfile && (
          <Pressable accessibilityRole="button" accessibilityLabel="My account" onPress={onProfile} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person" size={16} color={colors.onInk} />
          </Pressable>
        )}
      </Row>
    )}
  </Row>
);

export default TopBar;
