import Ionicons from "@/components/Icon";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LiveMap from "@/components/LiveMap";
import { Button, IconCircle, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useTripStore } from "@/store";

// "Confirm pickup spot": the last step before the ride is requested.
const ConfirmPickup = () => {
  const { pickup, destination, rideType, status } = useTripStore();
  const [confirming, setConfirming] = useState(false);

  // after "Confirm pickup", a short "Confirming your ride" moment, then the request goes out
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => {
      useTripStore.setState({ status: "searching" });
      router.replace("/(root)/trip");
    }, 1400);
    return () => clearTimeout(t);
  }, [confirming]);

  if (!destination || !rideType) return <Redirect href="/(root)/(tabs)/home" />;
  if (status !== "idle" && !confirming) return <Redirect href="/(root)/trip" />;

  if (confirming) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LiveMap pickup={pickup} height={420} />
        <View style={{ flex: 1, marginTop: -20, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <T style={{ fontFamily: font.extra, fontSize: 24, textAlign: "center" }}>Confirming your ride</T>
          <View style={{ height: 6, backgroundColor: colors.card, borderRadius: 3, marginTop: 18, overflow: "hidden" }}>
            <View style={{ width: "40%", height: 6, backgroundColor: colors.ink }} />
          </View>
          <View style={{ height: 110, backgroundColor: "#F3F3F3", borderRadius: 16, marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View>
        <LiveMap pickup={pickup} height={430} />
        {/* the pin and its label sit in the middle of the map */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
          <View style={{ backgroundColor: colors.ink, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 44, maxWidth: 280 }}>
            <T numberOfLines={1} style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 14 }}>Pick-up on {pickup.name}</T>
          </View>
        </View>
        <SafeAreaView style={{ position: "absolute", top: 0, left: 16 }}>
          <IconCircle name="arrow-back" size={46} onPress={() => router.back()} />
        </SafeAreaView>
        <SafeAreaView style={{ position: "absolute", top: 0, right: 16 }}>
          <IconCircle name="layers-outline" size={46} />
        </SafeAreaView>
      </View>

      <View style={{ flex: 1, marginTop: -20, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
        <T style={{ fontFamily: font.extra, fontSize: 22, textAlign: "center" }}>Confirm pickup spot</T>
        <T style={{ color: colors.muted, textAlign: "center", marginTop: 4 }}>Your driver will meet you at this spot</T>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginTop: 18 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 17 }} numberOfLines={1}>{pickup.name}</T>
              {!!pickup.address && <T style={{ color: colors.muted, fontSize: 14 }} numberOfLines={2}>{pickup.address}</T>}
            </View>
            <Ionicons name="search" size={20} color={colors.muted} />
          </Row>
          <T style={{ color: colors.blue, fontFamily: font.semi, fontSize: 13, marginTop: 8 }}>Preferred by 95%+ of users</T>
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Confirm pickup" onPress={() => setConfirming(true)} />
      </View>
    </View>
  );
};

export default ConfirmPickup;
