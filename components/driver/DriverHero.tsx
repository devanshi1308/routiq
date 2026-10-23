import { useState } from "react";
import { Pressable, Switch, TextInput, View } from "react-native";

import Ionicons from "@/components/Icon";
import { Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";

type Props = {
  name: string;
  online: boolean;
  unread?: boolean;
  onOnline: (v: boolean) => void;
  onMenu: () => void;
  onBell: () => void;
  onSearch: (q: string) => void;
  onEarnings: () => void;
  onRides: () => void;
};

const Action = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex: 1, height: 64, borderRadius: 18, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, opacity: pressed ? 0.8 : 1 })}>
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon as any} size={22} color="#fff" />
    </View>
    <T style={{ fontFamily: font.bold, fontSize: 16, color: "#000" }}>{label}</T>
  </Pressable>
);

/** Dark greeting card for the driver's home: avatar, online switch, bell, search and two quick actions. */
const DriverHero = ({ name, online, unread, onOnline, onMenu, onBell, onSearch, onEarnings, onRides }: Props) => {
  const [q, setQ] = useState("");
  return (
    <View style={{ backgroundColor: "#111", borderRadius: 30, padding: 18, marginHorizontal: 12, marginTop: 6, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={onMenu} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <T style={{ color: "#000", fontFamily: font.extra, fontSize: 20 }}>{name[0]}</T>
        </Pressable>
        <Row style={{ gap: 8, backgroundColor: online ? colors.green : "#2b2b2b", borderRadius: 22, paddingLeft: 14, paddingRight: 4, height: 44 }}>
          <T style={{ color: "#fff", fontFamily: font.extra, fontSize: 14 }}>{online ? "Online" : "Offline"}</T>
          <Switch value={online} onValueChange={onOnline} trackColor={{ true: "#0b6b3a" }} thumbColor="#fff" />
        </Row>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onBell} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#2b2b2b", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unread && <View style={{ position: "absolute", top: 12, right: 13, width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF6B2C" }} />}
        </Pressable>
      </Row>

      <T style={{ color: "#fff", fontFamily: font.regular, fontSize: 28, marginTop: 18 }}>Hello,</T>
      <T style={{ color: "#fff", fontFamily: font.extra, fontSize: 32 }}>{name.split(" ")[0]}! 👋</T>

      <Row style={{ backgroundColor: "#fff", borderRadius: 18, height: 56, paddingHorizontal: 16, gap: 10, marginTop: 16 }}>
        <Ionicons name="search" size={20} color="#000" />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => onSearch(q)}
          returnKeyType="search"
          placeholder="Search your trips"
          placeholderTextColor="#6b6b6b"
          style={{ flex: 1, color: "#000", fontSize: 16, fontFamily: font.medium, ...noOutline } as any}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => onSearch(q)} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </Pressable>
      </Row>

      <Row style={{ gap: 12, marginTop: 14 }}>
        <Action icon="wallet-outline" label="Earnings" onPress={onEarnings} />
        <Action icon="car-outline" label="My rides" onPress={onRides} />
      </Row>
    </View>
  );
};

export default DriverHero;
