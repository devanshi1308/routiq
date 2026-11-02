import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@/components/Icon";
import { Button, Field, H1, Row, T } from "@/components/ui";
import { DEMO } from "@/constants/config";
import { colors, font } from "@/constants/theme";
import { useAuthStore } from "@/store";
import { DocKey, useDriverStore } from "@/store/extras";

// Driver create flow, after the account is made: about you, vehicle, documents, payout, review. Then Routiq "reviews" it
// (simulated: a few seconds in the demo) and an approved driver can go online. Nothing is uploaded or checked for real.
const STEPS = ["About you", "Vehicle", "Documents", "Payout", "Review"] as const;
const REVIEW_SECONDS = 6;

// Indian driving licence: state code, RTO number, year, serial (e.g. MH02 2011 0012345). Spaces and dashes are ignored.
const licenceOk = (v: string) => /^[A-Z]{2}\d{2}(19|20)\d{2}\d{7}$/.test(v.replace(/[\s-]/g, "").toUpperCase());
const refOk = (v: string) => /^[A-Z0-9/-]{6,24}$/i.test(v.trim());
const upiOk = (v: string) => /^[\w.-]+@[\w]+$/.test(v.trim());
const yearOk = (v: string) => /^(19|20)\d{2}$/.test(v) && +v <= new Date().getFullYear() && +v >= new Date().getFullYear() - 25;

const DOCS: { k: DocKey; label: string; hint: string }[] = [
  { k: "licence", label: "Driving licence", hint: "Photo of the front and back" },
  { k: "rc", label: "Vehicle registration (RC)", hint: "Matches the number plate you entered" },
  { k: "insurance", label: "Vehicle insurance", hint: "A policy that has not expired" },
  { k: "police", label: "Police verification", hint: "A clearance certificate" },
];

const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingHorizontal: 16, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.ink : colors.card }}>
    <T style={{ fontFamily: font.semi, color: on ? colors.onInk : colors.text }}>{label}</T>
  </Pressable>
);

const Label = ({ children }: { children: string }) => <T style={{ fontFamily: font.semi, marginTop: 16, marginBottom: 8 }}>{children}</T>;
const Err = ({ show, children }: { show: boolean; children: string }) => (show ? <T style={{ color: colors.red, fontSize: 13, marginTop: 6 }}>{children}</T> : null);

const DriverOnboarding = () => {
  const { signedIn, role, approval, name, vehicle, plate, setApproval, signOut } = useAuthStore();
  const logOut = () => {
    signOut();
    router.replace("/(auth)/welcome");
  };
  const { gender, setGender, details, setDetails, docs, toggleDoc, upi, setUpi } = useDriverStore();
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(REVIEW_SECONDS);

  // while the application is "under review", count down and approve (demo only; a real app waits for a person to review)
  useEffect(() => {
    if (approval !== "pending") return;
    if (!DEMO) return;
    if (left <= 0) return setApproval("approved");
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [approval, left, setApproval]);

  if (!signedIn || role !== "driver") return <Redirect href="/(auth)/welcome" />;

  const valid = [
    details.city.trim().length >= 2,
    details.make.trim().length >= 2 && details.colour.trim().length >= 3 && yearOk(details.year),
    licenceOk(details.licenceNo) && refOk(details.insuranceNo) && refOk(details.policeNo) && DOCS.every((d) => docs[d.k]),
    upiOk(upi),
    true,
  ];

  const submit = () => {
    setLeft(REVIEW_SECONDS);
    setApproval("pending");
  };

  // ---------- review finished ----------
  if (approval === "approved") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: 24, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="checkmark-circle" size={96} color={colors.green} />
          <H1 style={{ marginTop: 16, textAlign: "center" }}>You're approved!</H1>
          <T style={{ color: colors.muted, textAlign: "center", marginTop: 8, fontSize: 16 }}>Welcome to Routiq, {name.split(" ")[0]}. Go online to start getting ride requests.</T>
          <Button title="Go to driver home" onPress={() => router.replace("/(root)/driver")} style={{ marginTop: 28 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- waiting for review ----------
  if (approval === "pending") {
    const checks = [["Documents received", 0], ["Licence and ID check", 2], ["Vehicle check", 4], ["Background check", 5]] as const;
    const elapsed = REVIEW_SECONDS - left;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <H1>Reviewing your application</H1>
          <T style={{ color: colors.muted, marginTop: 8, fontSize: 16 }}>{DEMO ? "This takes a few seconds in the demo." : "We will notify you as soon as it is done. This usually takes 1 to 2 days."}</T>
          <View style={{ marginTop: 28 }}>
            {checks.map(([label, at]) => {
              const done = DEMO && elapsed >= at + 1;
              return (
                <Row key={label} style={{ gap: 12, paddingVertical: 12 }}>
                  <Ionicons name={done ? "checkmark-circle" : "time-outline"} size={26} color={done ? colors.green : colors.muted} />
                  <T style={{ fontFamily: font.semi, fontSize: 17, color: done ? colors.text : colors.muted }}>{label}</T>
                </Row>
              );
            })}
          </View>
          {DEMO && <Button title="Skip review (demo)" variant="grey" onPress={() => setApproval("approved")} style={{ marginTop: 24 }} />}
          <T onPress={logOut} style={{ textAlign: "center", color: colors.muted, fontFamily: font.semi, marginTop: 18, padding: 8 }}>Log out</T>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- the steps ----------
  const next = () => (step < 4 ? setStep(step + 1) : submit());
  const showVeh = [vehicle, plate].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Row style={{ gap: 6, marginBottom: 6 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.ink : colors.border }} />
            ))}
          </Row>
          <T style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>Step {step + 1} of {STEPS.length}</T>
          <H1 style={{ fontSize: 28, marginTop: 4 }}>{STEPS[step]}</H1>

          {step === 0 && (
            <>
              <T style={{ color: colors.muted, marginTop: 6 }}>Hi {name.split(" ")[0]}, a few details before you can drive.</T>
              <Label>Which city will you drive in?</Label>
              <Field value={details.city} onChangeText={(city) => setDetails({ city })} placeholder="City (e.g. Mumbai)" />
              <Label>Gender</Label>
              <Row style={{ gap: 8, flexWrap: "wrap" }}>
                <Chip label="Woman" on={gender === "woman"} onPress={() => setGender("woman")} />
                <Chip label="Man" on={gender === "man"} onPress={() => setGender("man")} />
                <Chip label="Prefer not to say" on={gender === "na"} onPress={() => setGender("na")} />
              </Row>
              <T style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Women drivers also receive Women Rider requests. Riders never see this.</T>
            </>
          )}

          {step === 1 && (
            <>
              <T style={{ color: colors.muted, marginTop: 6 }}>You chose {showVeh || "your vehicle"} at sign-up. Add the rest.</T>
              <Label>Make and model</Label>
              <Field value={details.make} onChangeText={(make) => setDetails({ make })} placeholder="e.g. Bajaj RE, Maruti Dzire" />
              <Label>Colour</Label>
              <Field value={details.colour} onChangeText={(colour) => setDetails({ colour })} placeholder="e.g. Yellow and green" />
              <Label>Year of manufacture</Label>
              <Field value={details.year} onChangeText={(y) => setDetails({ year: y.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 2021" keyboardType="number-pad" />
              <Err show={details.year.length === 4 && !yearOk(details.year)}>Vehicles older than 25 years or from the future are not accepted.</Err>
            </>
          )}

          {step === 2 && (
            <>
              <T style={{ color: colors.muted, marginTop: 6 }}>Enter each number and tap Upload. Uploads are simulated in this app.</T>
              {DOCS.map((d) => {
                const key = d.k === "licence" ? "licenceNo" : d.k === "insurance" ? "insuranceNo" : d.k === "police" ? "policeNo" : null;
                const value = key ? details[key] : plate;
                const ok = d.k === "licence" ? licenceOk(value) : d.k === "rc" ? !!plate : refOk(value);
                return (
                  <View key={d.k} style={{ marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 14 }}>
                    <Row style={{ gap: 10 }}>
                      <Ionicons name={docs[d.k] ? "checkmark-circle" : "document-text-outline"} size={24} color={docs[d.k] ? colors.green : colors.muted} />
                      <View style={{ flex: 1 }}>
                        <T style={{ fontFamily: font.bold, fontSize: 16 }}>{d.label}</T>
                        <T style={{ color: colors.muted, fontSize: 12 }}>{d.hint}</T>
                      </View>
                      <Pressable accessibilityRole="button" disabled={!ok && !docs[d.k]} onPress={() => toggleDoc(d.k)} style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: docs[d.k] ? colors.bg : colors.ink, opacity: !ok && !docs[d.k] ? 0.4 : 1 }}>
                        <T style={{ fontFamily: font.bold, fontSize: 13, color: docs[d.k] ? colors.text : colors.onInk }}>{docs[d.k] ? "Remove" : "Upload"}</T>
                      </Pressable>
                    </Row>
                    {key ? (
                      <Field
                        value={value}
                        onChangeText={(t) => setDetails({ [key]: t.toUpperCase() })}
                        placeholder={d.k === "licence" ? "Licence number (MH02 20110012345)" : d.k === "insurance" ? "Policy number" : "Certificate number"}
                        autoCapitalize="characters"
                        style={{ marginTop: 10, height: 48, backgroundColor: colors.bg }}
                      />
                    ) : (
                      <T style={{ marginTop: 10, fontFamily: font.semi }}>{plate || "Add a number plate first"}</T>
                    )}
                    <Err show={d.k === "licence" && value.length > 5 && !ok}>Enter a valid licence number, like MH02 20110012345.</Err>
                  </View>
                );
              })}
            </>
          )}

          {step === 3 && (
            <>
              <T style={{ color: colors.muted, marginTop: 6 }}>Where should we send your earnings? You keep 90% of every fare, and tips are all yours.</T>
              <Label>UPI ID</Label>
              <Field value={upi} onChangeText={setUpi} placeholder="name@bank" autoCapitalize="none" />
              <Err show={upi.length > 3 && !upiOk(upi)}>Enter a valid UPI ID, like name@bank.</Err>
            </>
          )}

          {step === 4 && (
            <>
              <T style={{ color: colors.muted, marginTop: 6 }}>Check everything. Tap Back to change anything.</T>
              {[
                ["Name", name],
                ["City", details.city],
                ["Vehicle", `${details.make} · ${details.colour} · ${details.year}`],
                ["Number plate", `${vehicle || "Vehicle"} · ${plate}`],
                ["Documents", `${DOCS.filter((d) => docs[d.k]).length} of ${DOCS.length} uploaded`],
                ["Payout UPI", upi],
              ].map(([l, v]) => (
                <Row key={l} style={{ justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 16 }}>
                  <T style={{ color: colors.muted }}>{l}</T>
                  <T style={{ fontFamily: font.semi, flex: 1, textAlign: "right" }} numberOfLines={2}>{v}</T>
                </Row>
              ))}
              <T style={{ color: colors.muted, fontSize: 12, marginTop: 14 }}>By submitting, you confirm the details are true and agree to Routiq's driver terms.</T>
            </>
          )}

          <Button title={step === 4 ? "Submit for review" : "Continue"} disabled={!valid[step]} onPress={next} style={{ marginTop: 22, borderRadius: 8 }} />
          {step > 0 && <Button title="Back" variant="grey" onPress={() => setStep(step - 1)} style={{ marginTop: 10, borderRadius: 8 }} />}
          <T onPress={logOut} style={{ textAlign: "center", color: colors.muted, fontFamily: font.semi, marginTop: 18, padding: 8 }}>Log out and finish later</T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DriverOnboarding;
