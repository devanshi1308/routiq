import { View } from "react-native";

import LiveMap from "@/components/LiveMap";
import type { Place, RouteOption } from "@/lib/mock";

type Props = { pickup: Place; destination: Place; routes: RouteOption[]; routeIndex: number; height: number; driverPos: { latitude: number; longitude: number } | null; progress: number | null };

/** Rounded map card used in the pickup and trip stages. */
const TripMap = ({ height, ...map }: Props) => (
  <View style={{ borderRadius: 22, overflow: "hidden", marginTop: 14 }}>
    <LiveMap {...map} height={height} />
  </View>
);

export default TripMap;
