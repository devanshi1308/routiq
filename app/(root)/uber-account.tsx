import Ionicons from "@/components/Icon";
import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Header, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useIntegrity } from "@/lib/integrity";
import { useAuthStore } from "@/store";

const TABS = ["Home", "Personal info", "Security", "Privacy & Data"];

const UberAccount = () => {
  const { name, phone, email, signOut } = useAuthStore();
  const [tab, setTab] = useState("Home");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Routiq Account" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, borderBottomWidth: 2, borderBottomColor: colors.border }}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={{ paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: tab === t ? colors.text : "transparent", marginBottom: -2 }}>
            <T style={{ fontFamily: tab === t ? font.bold : font.medium, fontSize: 17 }}>{t}</T>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {tab === "Home" && (
          <>
            <Row style={{ backgroundColor: "#FDEADB", borderRadius: 14, padding: 18, gap: 14 }}>
              <Ionicons name="warning" size={26} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: font.bold, fontSize: 18, color: "#000" }}>Secure your account</T>
                <T style={{ fontFamily: font.medium, color: "#000" }}>Add another login method</T>
              </View>
              <Pressable onPress={() => router.push("/(root)/checkup" as any)} style={{ backgroundColor: "#F9D5B6", paddingHorizontal: 20, height: 44, borderRadius: 22, justifyContent: "center" }}>
                <T style={{ fontFamily: font.bold, color: "#000" }}>Set up</T>
              </Pressable>
            </Row>
            <View style={{ alignItems: "center", marginVertical: 24 }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "#6E6E6E", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="person-outline" size={48} color={colors.onInk} />
              </View>
              <T style={{ fontFamily: font.extra, fontSize: 30, marginTop: 10 }}>{name.split(" ")[0]}</T>
            </View>
            <Row style={{ gap: 12 }}>
              {[
                { l: "Personal info", i: "person-outline", to: "Personal info" },
                { l: "Security", i: "lock-closed-outline", to: "Security" },
                { l: "Privacy & Data", i: "lock-open-outline", to: "Privacy & Data" },
              ].map((x) => (
                <Pressable key={x.l} onPress={() => setTab(x.to)} style={{ flex: 1, height: 120, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Ionicons name={x.i as any} size={34} />
                  <T style={{ fontFamily: font.semi, fontSize: 16, textAlign: "center" }}>{x.l}</T>
                </Pressable>
              ))}
            </Row>
            <T style={{ fontFamily: font.extra, fontSize: 26, marginTop: 28, marginBottom: 14 }}>Suggestions</T>
            <View style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, padding: 22 }}>
              <T style={{ fontFamily: font.extra, fontSize: 32, lineHeight: 40 }}>Complete your account checkup</T>
              <T style={{ fontSize: 20, lineHeight: 30, marginTop: 14 }}>Complete your account checkup to make Routiq work better for you and keep you secure.</T>
              <Button title="Begin checkup" variant="grey" onPress={() => router.push("/(root)/checkup" as any)} style={{ width: 190, marginTop: 18, borderRadius: 30 }} />
            </View>
            <Button title="Log out" variant="outline" onPress={() => { useIntegrity.getState().reset(); signOut(); router.replace("/(auth)/welcome"); }} style={{ marginTop: 24 }} />
          </>
        )}
        {tab === "Personal info" && (
          <>
            {[["Name", name], ["Phone number", `+91 ${phone || "98XXXXXX21"}`], ["Email", email || "—"]].map(([k, v]) => (
              <View key={k} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <T style={{ color: colors.muted }}>{k}</T>
                <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 2 }}>{v}</T>
              </View>
            ))}
          </>
        )}
        {tab === "Security" && ["Passkeys", "Login with Google", "2-step verification", "Connected apps"].map((k) => (
          <Row key={k} onPress={() => router.push({ pathname: "/(root)/account-detail", params: { k } } as any)} style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <T style={{ flex: 1, fontFamily: font.semi, fontSize: 18 }}>{k}</T>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Row>
        ))}
        {tab === "Privacy & Data" && ["Privacy Center", "Download your data", "Third-party apps with account access", "Delete your account"].map((k) => (
          <Row key={k} onPress={() => router.push({ pathname: "/(root)/account-detail", params: { k } } as any)} style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <T style={{ flex: 1, fontFamily: font.semi, fontSize: 18 }}>{k}</T>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Row>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default UberAccount;
