import { useRef, useState } from "react";
import { Animated, PanResponder, View } from "react-native";

import Ionicons from "@/components/Icon";
import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

const KNOB = 52;

/** A slider you drag all the way to the right to confirm something (for example "Slide to cancel"). */
const SlideToAct = ({ label, onComplete, tone = "dark" }: { label: string; onComplete: () => void; tone?: "dark" | "red" }) => {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const max = Math.max(0, w - KNOB - 8);
  const maxRef = useRef(0);
  maxRef.current = max;
  const done = useRef(onComplete);
  done.current = onComplete;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(maxRef.current, g.dx))),
      onPanResponderRelease: (_, g) => {
        if (maxRef.current > 0 && g.dx >= maxRef.current * 0.85) {
          Animated.timing(x, { toValue: maxRef.current, duration: 120, useNativeDriver: false }).start(() => {
            done.current();
            x.setValue(0);
          });
        } else Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const bg = tone === "red" ? "#3a1a1a" : "#2b2b2b";
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: KNOB + 8, borderRadius: (KNOB + 8) / 2, backgroundColor: bg, justifyContent: "center" }}>
      <T style={{ position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontFamily: font.bold, fontSize: 16, paddingLeft: KNOB }}>{label}</T>
      <Animated.View {...pan.panHandlers} style={{ position: "absolute", left: 4, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: tone === "red" ? colors.red : "#fff", alignItems: "center", justifyContent: "center", transform: [{ translateX: x }] }}>
        <Ionicons name="arrow-forward" size={24} color={tone === "red" ? "#fff" : "#000"} />
      </Animated.View>
    </View>
  );
};

export default SlideToAct;
