import { useState } from "react";
import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Field, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useNoticeStore, useTripStore } from "@/store";
import { PROMO_CODES } from "@/store/extras";

const OFFERS = [
  { code: "ROUTIQ10", t: "10% off select rides", d: "Up to ₹100 off · Mumbai · Use by Dec 29, 2026" },
  { code: "WELCOME", t: "Welcome offer", d: "10% off your first ride · Use by Nov 30, 2026" },
  { code: "SAVE10", t: "Save on Auto and Go AC", d: "10% off · Use by Dec 18, 2026" },
];

// Offer codes: type one or pick an offer. The applied code gives 10% off the next ride.
const Promo = () => {
  const { voucher, setVoucher } = useTripStore();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) return setMsg({ ok: false, text: "Type an offer code first." });
    if (!PROMO_CODES[c]) return setMsg({ ok: false, text: "That code is not valid or has expired." });
    setVoucher(c);
    setCode("");
    setMsg({ ok: true, text: `${c} applied: ${PROMO_CODES[c]}.` });
    useNoticeStore.getState().push({ kind: "ride", title: `Offer ${c} added`, body: PROMO_CODES[c] });
  };

  return (
    <Page title="Offer codes">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16 }}>Add a code and we apply it to your next ride. Offers that save more are picked for you.</T>
      <Row style={{ gap: 10, marginTop: 20 }}>
        <Field value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="Enter offer code" autoCapitalize="characters" autoCorrect={false} style={{ flex: 1 }} onSubmitEditing={() => apply(code)} />
        <Button title="Apply" onPress={() => apply(code)} style={{ width: 96, height: 54 }} />
      </Row>
      {msg && <T style={{ color: msg.ok ? colors.green : colors.red, marginTop: 10, fontFamily: font.semi }}>{msg.text}</T>}

      {voucher && (
        <Row style={{ gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 20 }}>
          <Ionicons name="checkmark-circle" size={24} color={colors.green} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{voucher} is on your account</T>
            <T style={{ color: colors.muted }}>{PROMO_CODES[voucher] ?? "10% off your next ride"}</T>
            <T style={{ color: colors.green, fontFamily: font.semi, fontSize: 13, marginTop: 2 }}>Example: a ₹200 ride becomes ₹180</T>
          </View>
          <T onPress={() => setVoucher(null)} style={{ color: colors.red, fontFamily: font.bold }}>Remove</T>
        </Row>
      )}

      <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 28, marginBottom: 6 }}>Available offers</T>
      {OFFERS.map((o) => (
        <Row key={o.code} style={{ gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FDE5E0", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="pricetag-outline" size={20} color={colors.promo} />
          </View>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{o.t}</T>
            <T style={{ color: colors.muted, fontSize: 14 }}>{o.d}</T>
            <T style={{ fontFamily: font.semi, fontSize: 13, marginTop: 2 }}>Code {o.code}</T>
          </View>
          <T onPress={() => apply(o.code)} style={{ fontFamily: font.bold, color: colors.blue }}>{voucher === o.code ? "Applied" : "Apply"}</T>
        </Row>
      ))}
    </Page>
  );
};

export default Promo;
