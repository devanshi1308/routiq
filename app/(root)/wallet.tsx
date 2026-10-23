import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, H1, H2, Header, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useWalletStore } from "@/store/extras";

const Wallet = () => {
  const { balance, txns } = useWalletStore();
  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <Header />
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <H1>Wallet</H1>
      <View style={{ marginTop: 20, borderRadius: 24, padding: 24, backgroundColor: "#F0F0F0", height: 220, justifyContent: "space-between" }}>
        <View>
          <T style={{ fontFamily: font.semi, fontSize: 20 }}>Routiq Cash</T>
          <T style={{ fontFamily: font.bold, fontSize: 44, marginTop: 12 }}>₹{balance.toFixed(2)}</T>
        </View>
        <Row style={{ gap: 10 }}>
          <Button title="+  Add cash" onPress={() => router.push("/(root)/add-cash" as any)} style={{ width: 140, borderRadius: 30 }} />
          <Button title="Gift card" variant="outline" onPress={() => router.push("/(root)/promo" as any)} style={{ width: 120, borderRadius: 30 }} />
        </Row>
      </View>
      <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20 }}>
        <T style={{ fontFamily: font.extra, fontSize: 28 }}>Send a gift</T>
        <T style={{ fontFamily: font.semi, fontSize: 18, marginTop: 10, lineHeight: 26 }}>You can now buy an instant Gift Card, for use on Routiq or Routiq Eats</T>
        <Button title="Send gift card" variant="grey" onPress={() => router.push("/(root)/promo" as any)} style={{ width: 190, marginTop: 14, borderRadius: 30 }} />
      </View>
      <H2 style={{ marginTop: 28, fontSize: 26 }}>Payment methods</H2>
      {[
        { l: "UPI Scan and Pay", i: "qr-code" },
        { l: "Cash", i: "cash-outline" },
      ].map((m) => (
        <Row key={m.l} onPress={() => router.push("/(root)/pay-with" as any)} style={{ gap: 16, paddingVertical: 20 }}>
          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: m.l === "Cash" ? "#CDEFB2" : "#000", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={m.i as any} size={24} color={m.l === "Cash" ? "#1B5E20" : "#fff"} />
          </View>
          <T style={{ flex: 1, fontFamily: font.bold, fontSize: 20 }}>{m.l}</T>
        </Row>
      ))}
      <Button title="+  Add payment method" variant="grey" onPress={() => router.push("/(root)/add-cash" as any)} style={{ width: 280, borderRadius: 30 }} />
      {txns.length > 0 && <H2 style={{ marginTop: 28, fontSize: 26 }}>Cash history</H2>}
      {txns.map((t) => (
        <Row key={t.id} style={{ paddingVertical: 12, justifyContent: "space-between" }}>
          <View>
            <T style={{ fontFamily: font.semi, fontSize: 17 }}>{t.text}</T>
            <T style={{ color: colors.muted }}>{t.at}</T>
          </View>
          <T style={{ fontFamily: font.bold, color: t.amount < 0 ? colors.red : colors.green }}>{t.amount < 0 ? `-₹${Math.abs(t.amount)}` : `+₹${t.amount}`}</T>
        </Row>
      ))}
    </ScrollView>
  </SafeAreaView>
  );
};

export default Wallet;
