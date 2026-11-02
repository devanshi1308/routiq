import { useLocalSearchParams } from "expo-router";
import { Linking, Platform, ScrollView, View } from "react-native";

import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { parseRideCard } from "@/lib/rideLink";

// Opened from a shared ride link. Needs no sign-in: it only shows the details that were put in the link.
export default function SharedRide() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const c = parseRideCard(d);
  const line = (label: string, value?: string | number) =>
    value ? (
      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <T style={{ color: colors.muted, fontSize: 13 }}>{label}</T>
        <T style={{ fontFamily: font.semi, fontSize: 17, marginTop: 2 }}>{value}</T>
      </View>
    ) : null;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <T style={{ fontFamily: font.extra, fontSize: 28 }}>{c ? `${c.rider}'s Routiq ride` : "Ride details"}</T>
      {!c ? (
        <T style={{ color: colors.muted, marginTop: 10 }}>This link has no ride details. Ask for it to be shared again.</T>
      ) : (
        <>
          <T style={{ color: colors.muted, marginTop: 4 }}>Shared {new Date(c.at).toLocaleString()}</T>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, marginTop: 18 }}>
            {line("Driver", c.driver?.name)}
            {line("Vehicle", c.driver ? `${c.driver.vehicle} · ${c.driver.plate}` : undefined)}
            {line("Ride", c.ride)}
            {line("From", c.pickup)}
            {line("To", c.drop)}
            {line("Trip", c.km ? `${c.km.toFixed(1)} km · about ${c.minutes} min` : undefined)}
            {line("Fare", c.fare ? `₹${c.fare}` : undefined)}
          </View>
          {!!c.live && (
            <>
              <T style={{ fontFamily: font.bold, fontSize: 18, marginTop: 22 }}>Live location</T>
              {Platform.OS === "web" ? (
                <iframe src={c.live} title="Live ride map" style={{ width: "100%", height: 480, border: 0, borderRadius: 16, marginTop: 10 }} />
              ) : null}
              <T onPress={() => Linking.openURL(c.live!)} style={{ color: colors.blue, fontFamily: font.semi, marginTop: 12 }}>Open the live map</T>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
