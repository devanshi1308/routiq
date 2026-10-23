import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import Vehicle from "@/components/Vehicle";
import { DEMO } from "@/constants/config";
import { CLASS_LABEL, VehicleClass } from "@/lib/fleet";
import Logo from "@/components/Logo";
import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CountryPicker from "@/components/CountryPicker";
import { Button, H1, Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { Country, INDIA, phoneValid } from "@/lib/countries";
import { getFlag } from "@/lib/persist";
import { Role, useAuthStore } from "@/store";

type Step = "id" | "otp" | "signup" | "g-email" | "g-pass" | "a-id" | "a-share";

const RESEND_SECONDS = 15;
const newCode = () => String(1000 + Math.floor(Math.random() * 9000));
const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);
const nameFromEmail = (e: string) => e.split("@")[0].replace(/[._\d]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase()) || "New User";

// Sign-in and sign-up. Phone and email use a one-time code that has to match; Google and Apple open their own sign-in
// pages first. Everything here is a simulation (no real Google or Apple accounts are contacted).
const plateOk = (p: string) => /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}$/.test(p.trim().toUpperCase());

const Welcome = () => {
  const { isRegistered, signIn, register } = useAuthStore();
  const [role, setRole] = useState<Role>("rider");
  const [vehicle, setVehicle] = useState("Auto");
  const [plate, setPlate] = useState("");
  const [step, setStep] = useState<Step>("id");
  const [useEmail, setUseEmail] = useState(false);
  const [country, setCountry] = useState<Country>(INDIA);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [mail, setMail] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gPass, setGPass] = useState("");
  const [gShow, setGShow] = useState(false);
  const [aId, setAId] = useState("");
  const [aPass, setAPass] = useState("");
  const [shareEmail, setShareEmail] = useState(true);
  const otpInput = useRef<React.ComponentRef<typeof TextInput>>(null);

  const idValid = useEmail ? emailOk(value) : phoneValid(country, value);
  const field = { color: colors.text, letterSpacing: 0, height: 56, borderRadius: 8, backgroundColor: colors.card, paddingHorizontal: 16, fontSize: 17, fontFamily: font.medium, ...noOutline } as any;
  // phone numbers are stored with their country code unless they are Indian numbers (the demo accounts)
  const phoneId = country.code === "IN" ? value : `${country.dial}${value}`;
  const accountId = useEmail ? value.trim().toLowerCase() : phoneId;

  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  // After signing in: riders are asked for location access once, then go Home. Drivers go to their screen.
  const finish = async () => {
    if (role === "driver") return router.replace("/(root)/driver");
    const asked = await getFlag("askedLocation");
    router.replace(asked ? "/(root)/(tabs)/home" : ("/(auth)/allow-location" as any));
  };

  const sendCode = () => {
    setSentCode(newCode());
    setSeconds(RESEND_SECONDS);
    setOtp("");
    setError("");
    setStep("otp");
    setTimeout(() => otpInput.current?.focus(), 300);
  };

  const verify = () => {
    if (otp !== sentCode) return setError("That code is not correct. Check it and try again.");
    setError("");
    if (isRegistered(accountId, role)) {
      signIn(accountId, role);
      finish();
    } else setStep("signup");
  };

  // Social sign-in: the provider hands us a name and email. Known emails log in, new ones go to sign-up prefilled.
  const chooseAccount = (name: string, email: string) => {
    setValue(email);
    setUseEmail(true);
    if (isRegistered(email, role)) {
      signIn(email, role);
      finish();
    } else {
      const [f, ...rest] = name.split(" ");
      setFirst(f);
      setLast(rest.join(" "));
      setStep("signup");
    }
  };

  const providerButton = (label: string, icon: any, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ height: 52, borderRadius: 8, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 }}>
      <Ionicons name={icon} size={20} />
      <T style={{ fontFamily: font.bold, fontSize: 16 }}>{label}</T>
    </Pressable>
  );

  const back = (to: Step) => (
    <Button
      title="Back"
      variant="grey"
      onPress={() => {
        setError("");
        setStep(to);
      }}
      style={{ marginTop: 10, borderRadius: 8 }}
    />
  );
  const errorText = !!error && <T style={{ color: colors.red, fontSize: 13, marginTop: 8 }}>{error}</T>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ marginTop: 4, marginBottom: 20 }}>
            <Logo width={64} mark />
          </View>

          {step === "id" && (
            <Row style={{ backgroundColor: colors.card, borderRadius: 12, padding: 3, marginBottom: 20 }}>
              {(["rider", "driver"] as Role[]).map((r) => (
                <Row key={r} onPress={() => setRole(r)} style={{ flex: 1, height: 48, justifyContent: "center", gap: 8, borderRadius: 10, borderWidth: 2, borderColor: role === r ? "#000" : "transparent" }}>
                  <Ionicons name={r === "rider" ? "person" : "car"} size={18} />
                  <T style={{ fontFamily: font.bold, fontSize: 16 }}>{r === "rider" ? "Rider" : "Driver"}</T>
                </Row>
              ))}
            </Row>
          )}

          {/* ---------------- phone / email ---------------- */}
          {step === "id" && (
            <>
              <H1 style={{ fontSize: 24, marginBottom: 16 }}>{role === "driver" ? "Drive with Routiq" : useEmail ? "Enter your email" : "Enter your mobile number"}</H1>
              {useEmail ? (
                <TextInput key="id-email" value={value} onChangeText={setValue} placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" style={field} />
              ) : (
                <Row style={{ gap: 8 }}>
                  <Pressable onPress={() => setPickerOpen(true)} style={[field, { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }]}>
                    <T style={{ fontSize: 20 }}>{country.flag}</T>
                    <T style={{ fontFamily: font.semi, fontSize: 17 }}>{country.dial}</T>
                    <Ionicons name="chevron-down" size={14} />
                  </Pressable>
                  <TextInput key="id-phone" value={value} onChangeText={(v) => setValue(v.replace(/\D/g, "").slice(0, country.max))} placeholder="Mobile number" keyboardType="number-pad" style={[field, { flex: 1 }]} />
                </Row>
              )}
              <Button title="Continue" disabled={!idValid} onPress={sendCode} style={{ marginTop: 16, borderRadius: 8 }} />

              <Row style={{ gap: 12, marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <T style={{ color: colors.muted }}>or</T>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </Row>
              {providerButton("Continue with Google", "logo-google", () => {
                setError("");
                setGEmail("");
                setGPass("");
                setStep("g-email");
              })}
              {providerButton("Continue with Apple", "logo-apple", async () => {
                setError("");
                // on an iPhone, use the Apple ID that is signed in on the device
                if (Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync().catch(() => false))) {
                  try {
                    const c = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
                    const name = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(" ") || "Apple user";
                    return chooseAccount(name, c.email ?? `${c.user.slice(0, 12)}@privaterelay.appleid.com`);
                  } catch (e: any) {
                    if (e?.code === "ERR_REQUEST_CANCELED") return;
                    return setError("Apple sign-in did not complete. Try again.");
                  }
                }
                setAId("");
                setAPass("");
                setStep("a-id");
              })}
              {providerButton(useEmail ? "Continue with phone number" : "Continue with email", useEmail ? "call-outline" : "mail-outline", () => {
                setUseEmail(!useEmail);
                setValue("");
              })}
              <View style={{ flex: 1 }} />
              <T style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 28 }}>
                By proceeding, you consent to get calls, WhatsApp or SMS messages, including by automated means, from Routiq and its affiliates to the number provided. Demo: rider 9876543210 or driver 9988776655 are existing accounts; anything else signs up. Codes, Google and Apple sign-in are simulated.
              </T>
            </>
          )}

          {/* ---------------- one-time code ---------------- */}
          {step === "otp" && (
            <>
              <H1 style={{ fontSize: 26, marginBottom: 8 }}>Enter your OTP</H1>
              <T style={{ color: colors.muted, marginBottom: 22 }}>We sent a 4-digit code to {useEmail ? value : `${country.dial} ${value}`}</T>
              <Pressable onPress={() => otpInput.current?.focus()} style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ width: 62, height: 62, borderRadius: 12, backgroundColor: colors.card, borderWidth: 2, borderColor: otp.length === i ? "#000" : "transparent", alignItems: "center", justifyContent: "center" }}>
                    <T style={{ fontFamily: font.extra, fontSize: 26 }}>{otp[i] ?? ""}</T>
                  </View>
                ))}
              </Pressable>
              <TextInput
                key="otp"
                ref={otpInput}
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
                keyboardType="number-pad"
                autoFocus
                maxLength={4}
                style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
              />
              {!!error && <T style={{ color: colors.red, fontSize: 13, marginTop: 12, textAlign: "center" }}>{error}</T>}
              <T style={{ textAlign: "center", color: colors.muted, marginTop: 18 }}>
                {seconds > 0 ? `Resend code in 0:${String(seconds).padStart(2, "0")}` : ""}
                {seconds <= 0 && (
                  <T onPress={sendCode} style={{ color: colors.text, fontFamily: font.bold }}>
                    Resend code
                  </T>
                )}
              </T>
              <Button title="Verify" disabled={otp.length < 4} onPress={verify} style={{ marginTop: 20, borderRadius: 8 }} />
              {back("id")}

              {/* stand-in for the text message, since no real SMS or email is sent in this demo */}
              {DEMO && (<>
              <Pressable
                onPress={() => {
                  setOtp(sentCode);
                  setError("");
                }}
                style={{ marginTop: 26, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, height: 44 }}
              >
                <Ionicons name={useEmail ? "mail-outline" : "chatbubble-outline"} size={16} color={colors.muted} />
                <T style={{ color: colors.muted, fontSize: 13 }}>{useEmail ? "From Mail" : "From Messages"}</T>
                <T style={{ fontFamily: font.extra, fontSize: 18, letterSpacing: 4 }}>{sentCode}</T>
              </Pressable>
              <T style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 6 }}>Demo only: tap the code to fill it in.</T>
              </>)}
            </>
          )}

          {/* ---------------- Google sign-in ---------------- */}
          {step === "g-email" && (
            <View>
              <Ionicons name="logo-google" size={34} />
              <T style={{ fontFamily: font.extra, fontSize: 28, marginTop: 14 }}>Sign in</T>
              <T style={{ color: colors.muted, fontSize: 16, marginTop: 4, marginBottom: 22 }}>with your Google Account to continue to Routiq</T>
              <TextInput
                key="g-email"
                value={gEmail}
                onChangeText={(v) => {
                  setGEmail(v);
                  setError("");
                }}
                placeholder="Email or phone"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[field, { backgroundColor: colors.bg, borderWidth: 1, borderColor: "#9AA0A6" }]}
              />
              <T style={{ color: "#1A73E8", fontFamily: font.bold, marginTop: 12 }}>Forgot email?</T>
              {errorText}
              <T style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 28 }}>Before using this app, you can review Routiq's privacy policy and terms of service.</T>
              <Row style={{ justifyContent: "space-between", marginTop: 28 }}>
                <T style={{ color: "#1A73E8", fontFamily: font.bold }}>Create account</T>
                <Pressable
                  onPress={() => {
                    if (!emailOk(gEmail)) return setError("Enter a valid email address");
                    setError("");
                    setStep("g-pass");
                  }}
                  style={{ backgroundColor: "#1A73E8", borderRadius: 20, paddingHorizontal: 26, height: 40, justifyContent: "center" }}
                >
                  <T style={{ color: colors.onInk, fontFamily: font.bold }}>Next</T>
                </Pressable>
              </Row>
              {back("id")}
            </View>
          )}

          {step === "g-pass" && (
            <View>
              <Ionicons name="logo-google" size={34} />
              <T style={{ fontFamily: font.extra, fontSize: 28, marginTop: 14 }}>Welcome</T>
              <Row style={{ alignSelf: "flex-start", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, height: 34, marginTop: 10, marginBottom: 22 }}>
                <Ionicons name="person-circle-outline" size={18} />
                <T style={{ fontSize: 14 }}>{gEmail.trim()}</T>
              </Row>
              <Row style={[field, { backgroundColor: colors.bg, borderWidth: 1, borderColor: "#9AA0A6", paddingRight: 8 }]}>
                <TextInput
                  key="g-pass"
                  value={gPass}
                  onChangeText={(v) => {
                    setGPass(v);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  secureTextEntry={!gShow}
                  autoCapitalize="none"
                  style={{ flex: 1, color: colors.text, fontSize: 17, fontFamily: font.medium, ...noOutline } as any}
                />
                <Pressable onPress={() => setGShow((v) => !v)} hitSlop={10}>
                  <Ionicons name={gShow ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
                </Pressable>
              </Row>
              {errorText}
              <T style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Demo: any password of 6 or more characters works.</T>
              <Row style={{ justifyContent: "space-between", marginTop: 28 }}>
                <T style={{ color: "#1A73E8", fontFamily: font.bold }}>Forgot password?</T>
                <Pressable
                  onPress={() => {
                    if (gPass.length < 6) return setError("Wrong password. Try again or click Forgot password to reset it.");
                    chooseAccount(nameFromEmail(gEmail), gEmail.trim().toLowerCase());
                  }}
                  style={{ backgroundColor: "#1A73E8", borderRadius: 20, paddingHorizontal: 26, height: 40, justifyContent: "center" }}
                >
                  <T style={{ color: colors.onInk, fontFamily: font.bold }}>Next</T>
                </Pressable>
              </Row>
              {back("g-email")}
            </View>
          )}

          {/* ---------------- Apple sign-in ---------------- */}
          {step === "a-id" && (
            <View>
              <Ionicons name="logo-apple" size={40} />
              <T style={{ fontFamily: font.extra, fontSize: 26, marginTop: 12 }}>Sign in with Apple ID</T>
              <T style={{ color: colors.muted, fontSize: 16, marginTop: 4, marginBottom: 22 }}>Use your Apple ID to sign in to Routiq.</T>
              <TextInput
                key="a-id"
                value={aId}
                onChangeText={(v) => {
                  setAId(v);
                  setError("");
                }}
                placeholder="Apple ID (email)"
                autoCapitalize="none"
                keyboardType="email-address"
                style={field}
              />
              <TextInput
                key="a-pass"
                value={aPass}
                onChangeText={(v) => {
                  setAPass(v);
                  setError("");
                }}
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                style={[field, { marginTop: 10 }]}
              />
              {errorText}
              <T style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>Demo: any Apple ID email and a password of 6 or more characters.</T>
              <Button
                title="Sign in"
                onPress={() => {
                  if (!emailOk(aId)) return setError("Enter a valid Apple ID email");
                  if (aPass.length < 6) return setError("Your Apple ID or password is incorrect.");
                  setError("");
                  setStep("a-share");
                }}
                style={{ marginTop: 18, borderRadius: 8 }}
              />
              {back("id")}
            </View>
          )}

          {step === "a-share" && (
            <View>
              <Ionicons name="logo-apple" size={40} />
              <T style={{ fontFamily: font.extra, fontSize: 24, marginTop: 12 }}>Sign in to Routiq with Apple ID</T>
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginTop: 16 }}>
                <T style={{ fontFamily: font.bold, fontSize: 17 }}>{nameFromEmail(aId)}</T>
                <T style={{ color: colors.muted, fontSize: 13 }}>{aId.trim()}</T>
              </View>
              {[
                { share: true, t: "Share My Email", d: aId.trim() },
                { share: false, t: "Hide My Email", d: "x7k2m9qf@privaterelay.appleid.com" },
              ].map((o) => (
                <Row key={o.t} onPress={() => setShareEmail(o.share)} style={{ gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Ionicons name={shareEmail === o.share ? "radio-button-on" : "radio-button-off"} size={22} />
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: font.bold, fontSize: 16 }}>{o.t}</T>
                    <T style={{ color: colors.muted, fontSize: 13 }}>{o.d}</T>
                  </View>
                </Row>
              ))}
              <Button title="Continue" onPress={() => chooseAccount(nameFromEmail(aId), shareEmail ? aId.trim().toLowerCase() : "x7k2m9qf@privaterelay.appleid.com")} style={{ marginTop: 18, borderRadius: 8 }} />
              {back("a-id")}
            </View>
          )}

          {/* ---------------- sign-up details ---------------- */}
          {step === "signup" && (
            <>
              <H1 style={{ fontSize: 24, marginBottom: 16 }}>{role === "driver" ? "Create your driver account" : "What's your name?"}</H1>
              <TextInput key="first-name" value={first} onChangeText={setFirst} placeholder="First name" style={field} />
              <TextInput key="last-name" value={last} onChangeText={setLast} placeholder="Last name" style={[field, { marginTop: 10 }]} />
              {role === "driver" && (
                <>
                  <T style={{ fontFamily: font.semi, marginTop: 14, marginBottom: 8 }}>Which vehicle will you drive?</T>
                  <Row style={{ gap: 10 }}>
                    {([["Auto", "auto"], ["Car", "sedan"], ["Bike", "bike"]] as const).map(([v, kind]) => (
                      <Pressable key={v} accessibilityRole="button" accessibilityLabel={v} onPress={() => setVehicle(v === "Car" && (vehicle === "Premium car" || vehicle === "Van") ? vehicle : v)} style={{ flex: 1, height: 96, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 14, borderWidth: 2, borderColor: (v === "Car" ? ["Car", "Premium car", "Van"].includes(vehicle) : vehicle === v) ? colors.text : colors.border, backgroundColor: (v === "Car" ? ["Car", "Premium car", "Van"].includes(vehicle) : vehicle === v) ? colors.card : "transparent" }}>
                        <Vehicle kind={kind} size={46} />
                        <T style={{ fontFamily: font.bold }}>{v}</T>
                      </Pressable>
                    ))}
                  </Row>
                  {(vehicle === "Car" || vehicle === "Premium car" || vehicle === "Van") && (
                    <Row style={{ gap: 8, marginTop: 10 }}>
                      {["Car", "Premium car", "Van"].map((c) => (
                        <T key={c} onPress={() => setVehicle(c)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, overflow: "hidden", fontFamily: font.semi, backgroundColor: vehicle === c ? colors.ink : colors.card, color: vehicle === c ? colors.onInk : colors.text }}>{c === "Car" ? "Standard" : c === "Van" ? "Van (XL)" : c}</T>
                      ))}
                    </Row>
                  )}
                  <T style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>You will get {CLASS_LABEL[vehicle as VehicleClass] ?? CLASS_LABEL.Car} requests.</T>
                  <TextInput key="plate" value={plate} onChangeText={(t) => setPlate(t.toUpperCase())} placeholder="Vehicle number (MH 02 AB 1234)" autoCapitalize="characters" style={[field, { marginTop: 10 }]} />
                  {plate.length > 0 && !plateOk(plate) && <T style={{ color: colors.red, fontSize: 13, marginTop: 6 }}>Enter a valid number plate, like MH 02 AB 1234.</T>}
                </>
              )}
              {!useEmail && <TextInput key="signup-email" value={mail} onChangeText={setMail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={[field, { marginTop: 10 }]} />}
              <Button
                title="Create account"
                disabled={!first.trim() || (!useEmail && !emailOk(mail)) || (role === "driver" && !plateOk(plate))}
                onPress={() => {
                  register(accountId, role, `${first.trim()} ${last.trim()}`.trim(), useEmail ? accountId : mail, role === "driver" ? vehicle : "", role === "driver" ? plate.trim().toUpperCase() : "");
                  finish();
                }}
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPicker
        visible={pickerOpen}
        selected={country}
        onSelect={(c) => {
          setCountry(c);
          setValue("");
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
};

export default Welcome;
