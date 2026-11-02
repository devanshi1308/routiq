import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Field, H1, Header, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { INBOX } from "@/lib/mock";
import { useNoticeStore, useTripStore } from "@/store";
import { PROMO_CODES } from "@/store/extras";

const FILTERS = ["All", "Offers", "Support", "Updates", "Pricing"];

const Inbox = () => {
  const [f, setF] = useState("All");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const voucher = useTripStore((s) => s.voucher);
  const apply = () => {
    const c = code.trim().toUpperCase();
    if (!PROMO_CODES[c]) return setMsg("That code is not valid or has expired.");
    useTripStore.getState().setVoucher(c);
    setCode("");
    setMsg(`${c} applied: ${PROMO_CODES[c]}.`);
  };
  const notices = useNoticeStore((n) => n.items);
  const items = (f === "Support" || f === "Pricing" ? [] : INBOX).filter((i) => f === "All" || (f === "Offers" && i.icon === "pricetag") || (f === "Updates" && i.icon !== "pricetag"));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <H1>Inbox</H1>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 18 }} contentContainerStyle={{ gap: 10 }}>
          {FILTERS.map((x) => (
            <Pressable key={x} onPress={() => setF(x)} style={{ paddingHorizontal: 22, height: 44, borderRadius: 22, backgroundColor: f === x ? colors.ink : colors.card, alignItems: "center", justifyContent: "center" }}>
              <T style={{ fontFamily: font.semi, fontSize: 17, color: f === x ? colors.onInk : colors.text }}>{x}</T>
            </Pressable>
          ))}
        </ScrollView>
        <Row style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, paddingLeft: 18, gap: 10, marginBottom: 6 }}>
          <Ionicons name="pricetag-outline" size={22} />
          <Field value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="Add offer code" autoCapitalize="characters" autoCorrect={false} onSubmitEditing={apply} style={{ flex: 1, height: 44, backgroundColor: "transparent", paddingHorizontal: 0 }} />
          <T onPress={apply} style={{ fontFamily: font.bold, color: colors.blue, padding: 6 }}>Apply</T>
        </Row>
        {!!msg && <T style={{ color: msg.includes("applied") ? colors.green : colors.red, marginBottom: 8, fontFamily: font.semi }}>{msg}</T>}
        {!!voucher && !msg && <T style={{ color: colors.green, marginBottom: 8, fontFamily: font.semi }}>{voucher} is on your account.</T>}
        <T onPress={() => router.push("/(root)/promo" as any)} style={{ color: colors.blue, fontFamily: font.semi, marginBottom: 10 }}>See all offers</T>
        {(f === "All" || f === "Updates") && notices.map((n) => (
          <Row key={n.id} style={{ alignItems: "flex-start", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: n.kind === "driver" ? "#E8F0FE" : colors.card, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={n.kind === "driver" ? "car-outline" : "navigate-outline"} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 17 }}>{n.title}</T>
              <T style={{ fontFamily: font.medium, fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 }}>{n.body}</T>
            </View>
            <T style={{ color: colors.muted, fontSize: 12 }}>{n.time}</T>
          </Row>
        ))}
        {((f === "Support" || f === "Pricing") || (f === "Offers" && items.length === 0)) && <T style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>{f === "Support" ? "No messages from support." : f === "Pricing" ? "No price updates." : "No offers right now."}</T>}
        {items.map((i) => (
          <Row key={i.id} style={{ alignItems: "flex-start", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: i.icon === "pricetag" ? "#FDE5E0" : colors.card, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={`${i.icon}-outline` as any} size={20} color={i.icon === "pricetag" ? colors.promo : colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>{i.title}</T>
              <T style={{ fontFamily: font.medium, fontSize: 16, color: colors.muted, marginTop: 4, lineHeight: 22 }}>{i.body}</T>
              <Pressable onPress={() => router.push((i.icon === "pricetag" ? "/(root)/promo" : "/(root)/(tabs)/home") as any)} style={{ backgroundColor: colors.card, alignSelf: "flex-start", paddingHorizontal: 18, height: 42, borderRadius: 21, justifyContent: "center", marginTop: 12 }}>
                <T style={{ fontFamily: font.bold, fontSize: 16 }}>{i.cta}</T>
              </Pressable>
            </View>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue, marginTop: 8 }} />
          </Row>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Inbox;
