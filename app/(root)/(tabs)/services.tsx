import Vehicle, { VehicleKind } from "@/components/Vehicle";
import { router } from "expo-router";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { H1, H2, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { OFFERS } from "@/lib/offers";
import { SERVICE_RIDE, SERVICES } from "@/lib/mock";
import { useTripStore } from "@/store";

const Services = () => {
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - 40 - 36) / 4); // 4 equal tiles per row, 20px side padding, 12px gaps
  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }}>
      <H1 style={{ marginTop: 24 }}>Services</H1>
      <H2 style={{ fontSize: 26, marginTop: 28, marginBottom: 20 }}>Go anywhere, get anything</H2>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {SERVICES.map((svc, i) => (
          <Pressable
            key={svc.id}
            onPress={() => {
              if (svc.id === "carpool") return router.push("/(root)/carpool" as any);
              useTripStore.getState().setPreferred(SERVICE_RIDE[svc.id] ?? null);
              useTripStore.setState({ offer: OFFERS[svc.id] ?? null });
              router.push("/(root)/where-to");
            }}
            style={{ width: tile, height: 120, backgroundColor: colors.card, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Vehicle kind={svc.emoji as VehicleKind} size={46} />
            <T style={{ fontFamily: font.bold, fontSize: 16, textAlign: "center" }}>{svc.label}</T>
            {svc.badge && (
              <View style={{ position: "absolute", top: -12, backgroundColor: colors.promo, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 13 }}>{svc.badge}</T>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);
};

export default Services;
