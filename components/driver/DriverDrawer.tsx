import { Modal, Pressable, View } from "react-native";

import Ionicons from "@/components/Icon";
import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

export type DrawerItem = { icon: string; label: string; onPress: () => void; danger?: boolean };

/** Side menu that slides over the driver's home screen. */
const DriverDrawer = ({ visible, name, vehicle, items, onClose }: { visible: boolean; name: string; vehicle: string; items: DrawerItem[]; onClose: () => void }) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, flexDirection: "row" }}>
      <View style={{ width: "76%", maxWidth: 340, backgroundColor: colors.bg, paddingTop: 56, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
            <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 22 }}>{name[0]}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 17 }}>{name}</T>
            <T numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{vehicle}</T>
          </View>
        </View>
        {items.map((it) => (
          <Pressable
            key={it.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              it.onPress();
            }}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 16, height: 52, opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name={it.icon as any} size={22} color={it.danger ? colors.red : colors.text} />
            <T style={{ fontFamily: font.semi, fontSize: 16, color: it.danger ? colors.red : colors.text }}>{it.label}</T>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} />
    </View>
  </Modal>
);

export default DriverDrawer;
