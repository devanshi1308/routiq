import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Switch, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, H1, Header, Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useSafetyStore, useWalletStore } from "@/store/extras";
import { track } from "@/lib/analytics";
import { PaymentMethod } from "@/lib/mock";
import { useBusinessStore, useHistoryStore, useTripStore } from "@/store";

const METHODS: { m: PaymentMethod; icon: any; dark?: boolean }[] = [
  { m: "Cash", icon: "cash-outline" },
  { m: "UPI Scan and Pay", icon: "qr-code-outline", dark: true },
];

// "Pay with" screen: Personal / Business profile, Uber balances, methods, vouchers.
const PayWith = () => {
  const balance = useWalletStore((w) => w.balance);
  const split = useTripStore((t) => t.split);
  const trusted = useSafetyStore((x) => x.share);
  const [splitOn, setSplitOn] = useState(split.length > 0);
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const { payment, setPayment, useUberCash, setUseUberCash, voucher, setVoucher } = useTripStore();
  const [profile, setProfile] = useState<"Personal" | "Business">("Personal");
  const { business, active: businessActive, create: createBusiness, setActive: setBusinessActive } = useBusinessStore();
  const rides = useHistoryStore((st) => st.rides);
  const bizTrips = rides.filter((r) => r.business).slice(0, 6);
  const bizTotal = rides.filter((r) => r.business).reduce((t, r) => t + r.fare, 0);
  const [setup, setSetup] = useState(false);
  const [company, setCompany] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const bizField = { height: 52, borderRadius: 8, backgroundColor: colors.card, color: colors.text, paddingHorizontal: 14, fontSize: 16, fontFamily: font.medium, ...noOutline } as any;
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const seg = (p: "Personal" | "Business", icon: any) => (
    <Row
      onPress={() => setProfile(p)}
      style={{ flex: 1, height: 52, justifyContent: "center", gap: 8, borderRadius: 10, borderWidth: 2, borderColor: profile === p ? "#000" : "transparent" }}
    >
      <Ionicons name={icon} size={18} />
      <T style={{ fontFamily: font.bold, fontSize: 17 }}>{p}</T>
    </Row>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <H1 style={{ marginBottom: 18 }}>Pay with</H1>
        <Row style={{ backgroundColor: colors.card, borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {seg("Personal", "person")}
          {seg("Business", "briefcase")}
        </Row>

        {profile === "Business" ? (
          <>
            {!business && !setup && (
              <>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 20 }}>
                  <T style={{ fontFamily: font.extra, fontSize: 26, lineHeight: 34, padding: 20 }}>Unlock benefits with a business profile</T>
                  {[
                    ["Automatic receipts", "Get receipts at your work email and keep your accountant smiling"],
                    ["Keep business and personal separate", "Use separate payment methods for the right occasion"],
                    ["Get travel reports", "See trip activity all in one place"],
                  ].map(([t, d]) => (
                    <View key={t} style={{ padding: 16, paddingLeft: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <T style={{ fontFamily: font.bold, fontSize: 18 }}>{t}</T>
                      <T style={{ fontFamily: font.medium, fontSize: 16, color: colors.muted, marginTop: 4 }}>{d}</T>
                    </View>
                  ))}
                </View>
                <Button title="Get started" onPress={() => setSetup(true)} style={{ marginTop: 24 }} />
              </>
            )}

            {!business && setup && (
              <>
                <T style={{ fontFamily: font.extra, fontSize: 24, marginBottom: 6 }}>Set up your business profile</T>
                <T style={{ color: colors.muted, marginBottom: 14 }}>Rides you take for work are charged to this profile and receipts go to your work email.</T>
                <TextInput key="biz-company" value={company} onChangeText={setCompany} placeholder="Company name" style={bizField} />
                <TextInput key="biz-email" value={workEmail} onChangeText={setWorkEmail} placeholder="Work email" autoCapitalize="none" keyboardType="email-address" style={[bizField, { marginTop: 10 }]} />
                <Button title="Create business profile" disabled={company.trim().length < 2 || !/\S+@\S+\.\S+/.test(workEmail)} onPress={() => createBusiness(company.trim(), workEmail.trim())} style={{ marginTop: 16 }} />
                <Button title="Cancel" variant="grey" onPress={() => setSetup(false)} style={{ marginTop: 10 }} />
              </>
            )}

            {business && (
              <>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18 }}>
                  <Row style={{ gap: 14 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="briefcase" size={22} color={colors.onInk} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.extra, fontSize: 20 }}>{business.company}</T>
                      <T style={{ color: colors.muted, fontSize: 13 }}>Receipts go to {business.email}</T>
                    </View>
                  </Row>
                  <Row style={{ justifyContent: "space-between", marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.bold, fontSize: 16 }}>Use for my rides</T>
                      <T style={{ color: colors.muted, fontSize: 12 }}>New rides are charged to {business.company}.</T>
                    </View>
                    <Switch value={businessActive} onValueChange={setBusinessActive} trackColor={{ true: "#111" }} />
                  </Row>
                </View>

                <Row style={{ justifyContent: "space-between", marginTop: 26 }}>
                  <T style={{ fontFamily: font.bold, fontSize: 22 }}>Travel report</T>
                  <T style={{ color: colors.muted }}>{bizTrips.length} trip{bizTrips.length === 1 ? "" : "s"} · ₹{bizTotal.toFixed(2)}</T>
                </Row>
                {bizTrips.length === 0 && <T style={{ color: colors.muted, marginTop: 8 }}>No business trips yet. Turn on "Use for my rides" and take a trip.</T>}
                {bizTrips.map((r) => (
                  <Row key={r.id} style={{ justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: font.semi, fontSize: 16 }} numberOfLines={1}>{r.place}</T>
                      <T style={{ color: colors.muted, fontSize: 13 }}>{r.date} · {r.rideType}</T>
                    </View>
                    <T style={{ fontFamily: font.bold }}>₹{r.fare.toFixed(2)}</T>
                  </Row>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
              <T style={{ fontFamily: font.bold, fontSize: 24 }}>Routiq balances</T>
              <Switch value={useUberCash} onValueChange={setUseUberCash} trackColor={{ true: "#111" }} />
            </Row>
            <Row style={{ gap: 16, marginTop: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
                <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>Routiq</T>
              </View>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>Routiq Cash: ₹{balance.toFixed(2)}</T>
            </Row>

            <T style={{ fontFamily: font.bold, fontSize: 24, marginTop: 36, marginBottom: 6 }}>Payment methods</T>
            {METHODS.map(({ m, icon, dark }) => (
              <Row
                key={m}
                onPress={() => {
                  setPayment(m);
                  track("payment_selected", { method: m });
                  router.back();
                }}
                style={{ gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: dark ? "#000" : "#CDEFB2", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={icon} size={24} color={dark ? "#fff" : "#1B5E20"} />
                </View>
                <T style={{ flex: 1, fontFamily: font.bold, fontSize: 20 }}>{m}</T>
                <Ionicons name={payment === m ? "radio-button-on" : "radio-button-off"} size={26} />
              </Row>
            ))}
            <Row onPress={() => router.push("/(root)/add-cash" as any)} style={{ gap: 16, paddingVertical: 20 }}>
              <Ionicons name="add" size={28} style={{ width: 44, textAlign: "center" }} />
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>Add payment method</T>
            </Row>

            <Row style={{ justifyContent: "space-between", marginTop: 24 }}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.bold, fontSize: 24 }}>Split fare</T>
                <T style={{ color: colors.muted, fontSize: 13 }}>Share the cost of this ride with friends</T>
              </View>
              <Switch value={splitOn} onValueChange={(v) => { setSplitOn(v); if (!v) useTripStore.setState({ split: [] }); }} trackColor={{ true: colors.green }} />
            </Row>
            {splitOn && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 10 }}>
                <T style={{ fontFamily: font.semi }}>{split.length ? `You and ${split.length} friend${split.length > 1 ? "s" : ""} pay equal shares` : "Add the people you are splitting with"}</T>
                {split.map((p) => (
                  <Row key={p.phone} style={{ gap: 10, marginTop: 8 }}>
                    <T style={{ flex: 1 }}>{p.name} · +91 {p.phone}</T>
                    <T onPress={() => useTripStore.setState({ split: split.filter((x) => x.phone !== p.phone) })} style={{ color: colors.red, fontFamily: font.bold, padding: 6 }}>Remove</T>
                  </Row>
                ))}
                {trusted.filter((c) => !split.some((x) => x.phone === c.phone)).length > 0 && (
                  <Row style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {trusted.filter((c) => !split.some((x) => x.phone === c.phone)).map((c) => (
                      <T key={c.id} onPress={() => useTripStore.setState({ split: [...split, { name: c.name, phone: c.phone }] })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, overflow: "hidden", backgroundColor: colors.bg, fontFamily: font.semi }}>+ {c.name}</T>
                    ))}
                  </Row>
                )}
                {split.length < 5 && (
                  <>
                    <TextInput value={fName} onChangeText={setFName} placeholder="Friend's name" placeholderTextColor={colors.muted} style={{ color: colors.text, height: 46, borderRadius: 10, backgroundColor: colors.bg, paddingHorizontal: 12, marginTop: 12, fontFamily: font.medium, ...noOutline } as any} />
                    <TextInput value={fPhone} onChangeText={(v) => setFPhone(v.replace(/\D/g, "").slice(0, 10))} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={colors.muted} style={{ color: colors.text, height: 46, borderRadius: 10, backgroundColor: colors.bg, paddingHorizontal: 12, marginTop: 8, fontFamily: font.medium, ...noOutline } as any} />
                    <Button title="Add friend" variant="grey" disabled={!fName.trim() || fPhone.length < 10} onPress={() => { useTripStore.setState({ split: [...split, { name: fName.trim(), phone: fPhone }] }); setFName(""); setFPhone(""); }} style={{ marginTop: 8, height: 46 }} />
                  </>
                )}
                <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>After the ride you can send each friend a payment request. Fares are divided equally.</T>
              </View>
            )}

            <Row style={{ justifyContent: "space-between", marginTop: 24 }}>
              <T style={{ fontFamily: font.bold, fontSize: 24 }}>Vouchers</T>
              <View style={{ backgroundColor: colors.card, paddingHorizontal: 20, height: 46, borderRadius: 23, justifyContent: "center" }}>
                <T style={{ fontFamily: font.bold, fontSize: 16 }}>See details</T>
              </View>
            </Row>
            {voucher && (
              <Row style={{ gap: 12, paddingVertical: 14 }}>
                <Ionicons name="pricetag" size={22} color={colors.green} />
                <T style={{ flex: 1, fontFamily: font.semi, fontSize: 17 }}>{voucher} · 10% off your next ride</T>
                <T onPress={() => setVoucher(null)} style={{ color: colors.red, fontFamily: font.bold }}>Remove</T>
              </Row>
            )}
            {adding ? (
              <Row style={{ gap: 10, marginTop: 14 }}>
                <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="Voucher code" autoCapitalize="characters" style={{ color: colors.text, flex: 1, height: 52, borderRadius: 8, backgroundColor: colors.card, paddingHorizontal: 14, fontFamily: font.medium, fontSize: 16, ...noOutline } as any} />
                <Button
                  title="Apply"
                  disabled={code.trim().length < 4}
                  onPress={() => {
                    setVoucher(code.trim());
                    setCode("");
                    setAdding(false);
                  }}
                  style={{ width: 100, height: 52, borderRadius: 8 }}
                />
              </Row>
            ) : (
              <Row onPress={() => setAdding(true)} style={{ gap: 16, paddingVertical: 20 }}>
                <Ionicons name="add" size={28} style={{ width: 44, textAlign: "center" }} />
                <T style={{ fontFamily: font.bold, fontSize: 20 }}>Add voucher code</T>
              </Row>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PayWith;
