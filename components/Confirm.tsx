import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

type Ask = { title: string; message?: string; confirm: string; destructive?: boolean; onConfirm: () => void };

/**
 * Confirmation sheet for actions that are hard to undo (error prevention). Alert.alert does nothing on the web,
 * so this is a small modal that works the same everywhere.
 * const [ask, dialog] = useConfirm();  ...  ask({ title, confirm, onConfirm })  ...  {dialog}
 */
export const useConfirm = () => {
  const [a, setA] = useState<Ask | null>(null);
  const close = () => setA(null);
  const dialog = (
    <Modal transparent visible={!!a} animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 28 }}>
        <Pressable style={{ backgroundColor: colors.bg, borderRadius: 22, padding: 22 }}>
          <T style={{ fontFamily: font.extra, fontSize: 22 }}>{a?.title}</T>
          {!!a?.message && <T style={{ color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 }}>{a.message}</T>}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <Pressable accessibilityRole="button" onPress={close} style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
              <T style={{ fontFamily: font.bold, fontSize: 16 }}>Cancel</T>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const go = a?.onConfirm;
                close();
                go?.();
              }}
              style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: a?.destructive ? colors.red : colors.ink, alignItems: "center", justifyContent: "center" }}
            >
              <T style={{ fontFamily: font.bold, fontSize: 16, color: a?.destructive ? "#fff" : colors.onInk }}>{a?.confirm}</T>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
  return [setA, dialog] as const;
};
