import { router } from "expo-router";
import { View } from "react-native";

import { useConfirm } from "@/components/Confirm";
import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { maskPlate, shortName } from "@/lib/privacy";
import { RIDE_TYPES } from "@/lib/mock";
import { useTripStore } from "@/store";
import { useFavStore } from "@/store/extras";

// Drivers you liked. Pick one when you book and they are asked first.
const Favourites = () => {
  const { items, remove } = useFavStore();
  const [ask, dialog] = useConfirm();
  const rideWith = (id: string, rideId: string) => {
    useTripStore.getState().setPreferred(rideId);
    useTripStore.setState({ favDriver: id });
    router.push("/(root)/where-to");
  };
  return (
    <Page title="Favourite drivers" art={require("../../assets/illustrations/friends-taxi.webp")}>
      {dialog}
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Add a driver as a favourite from the end of a ride. Next time, they are asked first before other drivers nearby.</T>
      {items.length === 0 && <T style={{ marginTop: 24, color: colors.muted }}>No favourites yet. After a ride, tap "Add to favourites" on the rating screen.</T>}
      {items.map((f) => (
        <View key={f.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 14 }}>
          <Row style={{ gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
              <T style={{ color: colors.onInk, fontFamily: font.extra, fontSize: 20 }}>{f.name[0]}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.bold, fontSize: 17 }}>{shortName(f.name)}</T>
              <T style={{ color: colors.muted, fontSize: 13 }}>{f.vehicle} · {maskPlate(f.plate)} · {RIDE_TYPES.find((r) => r.id === f.rideId)?.name ?? "Ride"}</T>
            </View>
            <Row style={{ gap: 4 }}>
              <Ionicons name="star" size={14} />
              <T style={{ fontFamily: font.semi }}>{f.rating}</T>
            </Row>
          </Row>
          <Row style={{ gap: 10, marginTop: 12 }}>
            <Button title="Ride with them" onPress={() => rideWith(f.id, f.rideId)} style={{ flex: 1.5, height: 46 }} />
            <Button title="Remove" variant="grey" onPress={() => ask({ title: `Remove ${shortName(f.name)}?`, confirm: "Remove", destructive: true, onConfirm: () => remove(f.id) })} style={{ flex: 1, height: 46 }} />
          </Row>
        </View>
      ))}
    </Page>
  );
};

export default Favourites;
