import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

// Animated Routiq logo: the R grows up from its base, the pin drops in and bounces, then the name slides up.
// About 1.7 seconds. All motion uses transform and opacity so it runs smoothly on the phone's UI thread.
const W = 475;
const MARK_H = 480;
const WORD_H = 125;

const LogoReveal = ({ width = 300, onDone }: { width?: number; onDone?: () => void }) => {
  const s = width / W;
  const body = useRef(new Animated.Value(0)).current;
  const dot = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(body, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(dot, { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, [body, dot, word, onDone]);

  return (
    <View style={{ width, height: (MARK_H + WORD_H) * s }}>
      <Animated.Image
        source={require("../assets/logo/anim-body.png")}
        style={{ position: "absolute", left: 0, top: 0, width, height: MARK_H * s, opacity: body, transformOrigin: "50% 100%", transform: [{ scaleY: body.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }, { scale: body.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}
      />
      <Animated.Image
        source={require("../assets/logo/anim-dot.png")}
        style={{ position: "absolute", left: 0, top: 0, width, height: MARK_H * s, opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [-160 * s, 0] }) }] }}
      />
      <Animated.Image
        source={require("../assets/logo/anim-word.png")}
        style={{ position: "absolute", left: 0, top: MARK_H * s, width, height: WORD_H * s, opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [28 * s, 0] }) }] }}
      />
    </View>
  );
};

export default LogoReveal;
