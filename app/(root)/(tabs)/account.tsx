import Vehicle, { VehicleKind } from "@/components/Vehicle";
import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { H1, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useConfirm } from "@/components/Confirm";
import { useThemeStore } from "@/lib/theme";
import { useIntegrity } from "@/lib/integrity";
import { clearFlags } from "@/lib/persist";
import { useAuthStore, useTripStore } from "@/store";

const Account = () => {
  const { width } = useWindowDimensions();
  const tileW = Math.floor((width - 40 - 12) / 2);
  const { name, signOut } = useAuthStore();
  const reset = useTripStore((s) => s.reset);
  const { mode, setMode } = useThemeStore();

  const [ask, dialog] = useConfirm();
  const doLogOut = () => {
    useIntegrity.getState().reset();
    reset();
    signOut();
    router.replace("/(auth)/welcome");
  };

  const logOut = () => ask({ title: "Log out?", message: "You will need to sign in again to book rides.", confirm: "Log out", destructive: true, onConfirm: doLogOut });

  const tiles = [
    { l: "Help", i: "help-buoy-outline", to: "/(root)/help" },
    { l: "Wallet", i: "wallet-outline", to: "/(root)/wallet" },
    { l: "Safety", i: "shield-outline", to: "/(root)/safety" },
    { l: "Inbox", i: "mail-outline", to: "/(root)/inbox", dot: true },
  ] as const;

  const cards = [
    { t: "Favourite drivers", d: "Drivers you liked are asked first", e: "person", to: "/(root)/favourites" },
    { t: "Notifications", d: "Choose which reminders you get", e: "gift", to: "/(root)/notifications" },
    { t: "Daily commute", d: "Repeat your office ride every day", e: "calendar", to: "/(root)/commute" },
    { t: "You have multiple promos", d: "We'll automatically apply the one that saves you the most", e: "tag", to: "/(root)/promo" },
    { t: "Bike Flex Pass", d: "Save 30% on Bike rides", e: "bike", to: "/(root)/where-to", bike: true },
    { t: "Save with Routiq One", d: "Get rewards for 1 month at 20% off", e: "gift", to: "/(root)/routiq-one" },
    { t: "Rider insurance", d: "₹10L cover for ₹3/trip", e: "umbrella", to: "/(root)/safety-info?kind=routiq" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {dialog}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Row style={{ justifyContent: "space-between", marginTop: 16 }}>
          <View>
            <H1>{name}</H1>
            <Row style={{ backgroundColor: colors.card, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, marginTop: 8 }}>
              <Ionicons name="star" size={14} />
              <T style={{ fontFamily: font.semi }}>4.67</T>
            </Row>
          </View>
          <Pressable onPress={() => router.push("/(root)/uber-account")} style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: "#6E6E6E", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person-outline" size={36} color={colors.onInk} />
          </Pressable>
        </Row>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
          {tiles.map((t) => (
            <Pressable key={t.l} onPress={() => router.push(t.to)} style={{ width: tileW, height: 74, borderRadius: 16, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 }}>
              <Ionicons name={t.i as any} size={26} />
              <T style={{ fontFamily: font.bold, fontSize: 20, flex: 1 }}>{t.l}</T>
              {"dot" in t && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue }} />}
            </Pressable>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={logOut} style={{ marginTop: 14, height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: colors.red, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.red} />
          <T style={{ fontFamily: font.bold, color: colors.red, fontSize: 18 }}>Log out</T>
        </Pressable>

        {cards.map((c) => (
          <Pressable key={c.t} onPress={() => {
            if ("bike" in c) useTripStore.getState().setPreferred("bike");
            router.push(("to" in c ? c.to : "/(root)/promo") as any);
          }} style={{ backgroundColor: colors.card, borderRadius: 20, padding: 22, marginTop: 14, flexDirection: "row", alignItems: "center", minHeight: 112 }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 22 }}>{c.t}</T>
              <T style={{ fontFamily: font.medium, fontSize: 17, color: colors.muted, marginTop: 6 }}>{c.d}</T>
            </View>
            <Vehicle kind={c.e as VehicleKind} size={64} />
          </Pressable>
        ))}

        <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 24, marginBottom: 10 }}>Appearance</T>
        <Row style={{ backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
          {(["system", "light", "dark"] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, height: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: mode === m ? colors.ink : "transparent" }}>
              <T style={{ fontFamily: font.semi, color: mode === m ? colors.onInk : colors.text }}>{m === "system" ? "Auto" : m === "light" ? "Light" : "Dark"}</T>
            </Pressable>
          ))}
        </Row>

        <Pressable
          onPress={async () => {
            await clearFlags();
            router.replace("/(auth)/onboarding" as any);
          }}
          style={{ marginTop: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
        >
          <T style={{ fontFamily: font.bold, fontSize: 17 }}>Show intro again</T>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
