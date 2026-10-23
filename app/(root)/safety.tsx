import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { H1, H2, Header, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useTripStore } from "@/store";
import { useRecordingStore, useSafetyStore } from "@/store/extras";

const Safety = () => {
  const pin = useTripStore((s) => s.pin);
  const { emergency, share, rideCheck, womenPref, safeArrival } = useSafetyStore();
  const clips = useRecordingStore((s) => s.clips.length);
  const names = (l: { name: string }[]) => (l.length === 0 ? "Add people" : l.length === 1 ? l[0].name : `${l[0].name} +${l.length - 1} more`);
  const prefs = [
    { i: "keypad-outline", t: "PIN verification", d: `Your PIN: ${pin}`, chip: "All trips" },
    { i: "mic-outline", t: "Audio recording", d: clips ? `${clips} saved recording${clips > 1 ? "s" : ""}` : "Record audio while you ride.", to: "/(root)/recording" },
    { i: "person-add-outline", t: "Emergency contacts", d: names(emergency), to: "/(root)/contacts?kind=emergency" },
    { i: "woman-outline", t: "Women Rider Preferences", d: womenPref ? "On for every ride" : "Ask for women drivers", to: "/(root)/women-rider" },
    { i: "home-outline", t: "Safe arrival", d: safeArrival ? "Tell your contacts you got there" : "Off", to: "/(root)/safe-arrival" },
    { i: "navigate-outline", t: "Share trip location", d: names(share), to: "/(root)/contacts?kind=share" },
    { i: "car-outline", t: "RideCheck", d: "Get a message if we detect a possible safety issue.", chip: rideCheck ? "All trips" : "Off", to: "/(root)/ridecheck" },
  ];
  const more = [
    { i: "bulb-outline", t: "Safety tips", d: "Take charge of your safety.", to: "/(root)/safety-info?kind=tips" },
    { i: "heart-circle-outline", t: "Safety at Routiq", d: "Learn how we stand for your safety.", to: "/(root)/safety-info?kind=routiq" },
  ];
  const row = (x: any) => (
    <Row key={x.t} onPress={x.to ? () => router.push(x.to) : undefined} style={{ gap: 16, paddingVertical: 16, alignItems: "flex-start" }}>
      <Ionicons name={x.i} size={30} style={{ marginTop: 4 }} />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: font.bold, fontSize: 20 }}>{x.t}</T>
        <T style={{ fontFamily: font.medium, fontSize: 17, color: colors.muted, marginTop: 2 }}>{x.d}</T>
        {x.chip && (
          <View style={{ backgroundColor: "#E8F0FE", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 6 }}>
            <T style={{ color: colors.blue, fontFamily: font.bold }}>{x.chip}</T>
          </View>
        )}
      </View>
      {x.to ? <Ionicons name="chevron-forward" size={20} color={colors.muted} style={{ marginTop: 8 }} /> : null}
    </Row>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <H1>Safety hub</H1>
        <Image source={require("../../assets/illustrations/safety-shield.webp")} resizeMode="cover" style={{ width: "100%", aspectRatio: 346 / 194, borderRadius: 22, marginTop: 14 }} accessibilityIgnoresInvertColors />
        <H2 style={{ fontSize: 28, marginTop: 24 }}>Safety preferences</H2>
        <T style={{ fontFamily: font.medium, fontSize: 17, color: colors.muted, marginBottom: 6 }}>Manage and schedule your safety features</T>
        {prefs.map(row)}
        <H2 style={{ fontSize: 28, marginTop: 24 }}>More safety support</H2>
        {more.map(row)}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Safety;
