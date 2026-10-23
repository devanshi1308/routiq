import Ionicons from "@/components/Icon";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { COUNTRIES, Country } from "@/lib/countries";

// Full-screen list of countries with their calling codes and a search box.
const CountryPicker = ({ visible, selected, onSelect, onClose }: { visible: boolean; selected: Country; onSelect: (c: Country) => void; onClose: () => void }) => {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(t) || c.dial.includes(t)) : COUNTRIES;
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Row style={{ paddingHorizontal: 20, paddingVertical: 12, justifyContent: "space-between" }}>
          <T style={{ fontFamily: font.extra, fontSize: 24 }}>Select country</T>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} />
          </Pressable>
        </Row>
        <Row style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10 }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search country or code" style={{ flex: 1, color: colors.text, fontSize: 16, fontFamily: font.medium, ...noOutline } as any} />
        </Row>
        <FlatList
          data={list}
          keyExtractor={(c) => c.code}
          keyboardShouldPersistTaps="handled"
          style={{ marginTop: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                setQ("");
                onClose();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14 }}
            >
              <T style={{ fontSize: 26 }}>{item.flag}</T>
              <T style={{ flex: 1, fontFamily: font.semi, fontSize: 17 }}>{item.name}</T>
              <T style={{ color: colors.muted, fontFamily: font.semi, fontSize: 16 }}>{item.dial}</T>
              <Ionicons name={selected.code === item.code ? "radio-button-on" : "radio-button-off"} size={22} />
            </Pressable>
          )}
          ListEmptyComponent={<View style={{ padding: 30 }}><T style={{ color: colors.muted, textAlign: "center" }}>No country found</T></View>}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default CountryPicker;
