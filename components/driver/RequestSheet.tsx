import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import SlideToAct from "@/components/SlideToAct";
import { Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { RideRequest } from "./RadarCard";

const R = 62;
const C = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Incoming request: pickup and drop, the fare, a countdown ring you tap to accept, and a slider to reject.
 * When the countdown reaches zero the request counts as declined.
 */
const RequestSheet = ({ req, seconds = 15, onAccept, onReject }: { req: RideRequest; seconds?: number; onAccept: () => void; onReject: () => void }) => {
  const [left, setLeft] = useState(seconds);
  const fill = useRef(new Animated.Value(0)).current;
  const out = useRef(onReject);
  out.current = onReject;

  useEffect(() => {
    Animated.timing(fill, { toValue: 1, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [fill, seconds]);
  useEffect(() => {
    if (left <= 0) out.current();
  }, [left]);

  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 26, padding: 18 }}>
      <Row style={{ gap: 8 }}>
        <View style={{ backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 10, height: 26, justifyContent: "center" }}>
          <T style={{ color: colors.onInk, fontFamily: font.bold, fontSize: 12 }}>{req.product}</T>
        </View>
        <T style={{ color: colors.muted, fontSize: 13, fontFamily: font.semi }}>{req.viewers} nearby</T>
        <T style={{ marginLeft: "auto", fontFamily: font.extra, fontSize: 26 }}>₹{req.fare.toFixed(0)}</T>
      </Row>
      <View style={{ marginTop: 12, gap: 10 }}>
        <Row style={{ gap: 10 }}>
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.green }} />
          <T numberOfLines={1} style={{ flex: 1, fontFamily: font.semi }}>{req.pickup}</T>
          <T style={{ color: colors.muted, fontSize: 12 }}>{req.awayMin} min · {req.awayKm.toFixed(1)} km</T>
        </Row>
        <Row style={{ gap: 10 }}>
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.red }} />
          <T numberOfLines={1} style={{ flex: 1, fontFamily: font.semi }}>{req.dest}</T>
          <T style={{ color: colors.muted, fontSize: 12 }}>{req.tripMin} min · {req.tripKm.toFixed(1)} km</T>
        </Row>
      </View>
      <View style={{ alignItems: "center", marginVertical: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Accept, ${Math.max(0, left)} seconds left`} onPress={onAccept} style={{ width: 150, height: 150, alignItems: "center", justifyContent: "center" }}>
          <Svg width={150} height={150} style={{ position: "absolute" }}>
            <Circle cx={75} cy={75} r={R} stroke={colors.border} strokeWidth={9} fill={colors.card} />
            <AnimatedCircle cx={75} cy={75} r={R} stroke={colors.green} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={fill.interpolate({ inputRange: [0, 1], outputRange: [0, C] }) as any} rotation={-90} origin="75, 75" />
          </Svg>
          <T style={{ fontFamily: font.extra, fontSize: 38 }}>{String(Math.max(0, left)).padStart(2, "0")}</T>
          <T style={{ fontFamily: font.bold, fontSize: 15, color: colors.green }}>Accept</T>
        </Pressable>
      </View>
      <SlideToAct label="Slide to reject" onComplete={onReject} />
    </View>
  );
};

export default RequestSheet;
