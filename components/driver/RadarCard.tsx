import { View } from "react-native";

import Ionicons from "@/components/Icon";
import { Button, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import Card from "./Card";

export type RideRequest = { product: string; fare: number; viewers: number; awayMin: number; awayKm: number; pickup: string; tripMin: number; tripKm: number; dest: string };

const Stop = ({ shape, title, sub }: { shape: "dot" | "square"; title: string; sub: string }) => (
  <Row style={{ alignItems: "flex-start", gap: 12 }}>
    <View style={[{ width: 11, height: 11, marginTop: 5 }, shape === "dot" ? { borderRadius: 6, borderWidth: 2.5, borderColor: colors.text } : { backgroundColor: colors.ink }]} />
    <View style={{ flex: 1 }}>
      <T style={{ fontFamily: font.semi, fontSize: 15 }}>{title}</T>
      <T style={{ color: colors.muted, fontSize: 14 }} numberOfLines={1}>{sub}</T>
    </View>
  </Row>
);

/** One incoming request on the Trip Radar. Presentational only: the screen decides what Accept and Decline do. */
const RadarCard = ({ req, onAccept, onDecline }: { req: RideRequest; onAccept: () => void; onDecline: () => void }) => (
  <Card style={{ padding: 0, overflow: "hidden", borderWidth: 2, borderColor: colors.ink }}>
    <View style={{ padding: 18 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row style={{ backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 10, height: 26, gap: 5 }}>
          <Ionicons name="person" size={12} color={colors.onInk} />
          <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>{req.product}</T>
        </Row>
        <Row style={{ gap: 4 }}>
          <Ionicons name="eye" size={14} color={colors.muted} />
          <T style={{ color: colors.muted, fontSize: 13, fontFamily: font.semi }}>{req.viewers} nearby</T>
        </Row>
      </Row>
      <T style={{ fontFamily: font.extra, fontSize: 38, marginTop: 10 }}>₹{req.fare.toFixed(2)}</T>
    </View>
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 18, gap: 14 }}>
      <Stop shape="dot" title={`${req.awayMin} min (${req.awayKm.toFixed(1)} km) away`} sub={req.pickup} />
      <Stop shape="square" title={`${req.tripMin} min (${req.tripKm.toFixed(1)} km) trip`} sub={req.dest} />
      {req.tripMin >= 45 && (
        <Row style={{ alignSelf: "flex-start", backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 12, height: 34, gap: 8 }}>
          <Ionicons name="trail-sign-outline" size={16} />
          <T style={{ fontFamily: font.semi, fontSize: 13 }}>Long trip (45+ min)</T>
        </Row>
      )}
      <Row style={{ gap: 10, marginTop: 2 }}>
        <Button title="Decline" variant="grey" onPress={onDecline} style={{ flex: 1, height: 50 }} />
        <Button title="Accept" onPress={onAccept} style={{ flex: 1.4, height: 50 }} />
      </Row>
    </View>
  </Card>
);

export default RadarCard;
