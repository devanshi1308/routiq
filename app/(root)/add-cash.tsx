import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useNoticeStore } from "@/store";
import { useWalletStore } from "@/store/extras";

const AMOUNTS = [100, 200, 500, 1000];
const VIA = [
  { id: "UPI", i: "qr-code-outline" },
  { id: "Card", i: "card-outline" },
];

// Add money to Routiq Cash (simulated payment).
const AddCash = () => {
  const { balance, addCash } = useWalletStore();
  const [amt, setAmt] = useState("500");
  const [via, setVia] = useState("UPI");
  const [done, setDone] = useState(false);
  const n = parseInt(amt || "0", 10);
  const ok = n >= 10 && n <= 20000;

  const pay = () => {
    addCash(n, via);
    useNoticeStore.getState().push({ kind: "ride", title: `₹${n} added to Routiq Cash`, body: `Paid with ${via}. New balance ₹${(balance + n).toFixed(2)}.` });
    setDone(true);
  };

  if (done)
    return (
      <Page title="Cash added" art={require("../../assets/illustrations/qr-bus.webp")}>
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Ionicons name="checkmark-circle" size={80} color={colors.green} />
          <T style={{ fontFamily: font.bold, fontSize: 24, marginTop: 12 }}>₹{n} added</T>
          <T style={{ color: colors.muted, marginTop: 4 }}>Balance ₹{balance.toFixed(2)}</T>
        </View>
        <Button title="Done" onPress={() => router.back()} style={{ marginTop: 30 }} />
      </Page>
    );

  return (
    <Page title="Add cash">
      <T style={{ color: colors.muted, marginTop: 6 }}>Current balance ₹{balance.toFixed(2)}</T>
      <Field value={amt} onChangeText={(v) => setAmt(v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="Amount (₹)" maxLength={5} style={{ marginTop: 18, fontSize: 28, height: 70, fontFamily: font.bold }} />
      <Row style={{ gap: 10, marginTop: 12 }}>
        {AMOUNTS.map((a) => (
          <T key={a} onPress={() => setAmt(String(a))} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: n === a ? colors.ink : colors.card, color: n === a ? colors.onInk : colors.text, fontFamily: font.semi, overflow: "hidden" }}>
            ₹{a}
          </T>
        ))}
      </Row>
      <T style={{ fontFamily: font.bold, fontSize: 20, marginTop: 26, marginBottom: 6 }}>Pay with</T>
      {VIA.map((v) => (
        <Row key={v.id} onPress={() => setVia(v.id)} style={{ gap: 14, paddingVertical: 14 }}>
          <Ionicons name={v.i as any} size={24} />
          <T style={{ flex: 1, fontFamily: font.semi, fontSize: 18 }}>{v.id}</T>
          <Ionicons name={via === v.id ? "radio-button-on" : "radio-button-off"} size={24} />
        </Row>
      ))}
      {!ok && <T style={{ color: colors.red }}>Enter an amount between ₹10 and ₹20,000.</T>}
      <Button title={ok ? `Add ₹${n}` : "Add cash"} onPress={pay} disabled={!ok} style={{ marginTop: 18 }} />
    </Page>
  );
};

export default AddCash;
