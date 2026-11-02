import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

// Blueprint-style logo reveal (like a wordmark being constructed on a grid): thin white guide lines and circles appear,
// a bright white line sweeps across and reveals the logo behind it, then the guides fade away and the clean logo stays.
// About 2.6 seconds. Positions below are in the logo image's own pixels (475 x 605) and are scaled to the screen.
const LW = 475;
const LH = 605;
const BLUE = "#FFFFFF";

const LogoBlueprint = ({ logoWidth = 300, onDone }: { logoWidth?: number; onDone?: () => void }) => {
  const { width: W, height: H } = useWindowDimensions();
  const s = logoWidth / LW;
  const lh = LH * s;
  const ox = (W - logoWidth) / 2;
  const oy = (H - lh) / 2;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;

  const guides = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const clean = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(guides, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(sweep, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.delay(150),
      Animated.timing(clean, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start(() => onDone?.());
  }, [guides, sweep, clean, onDone]);

  const guideOpacity = Animated.multiply(guides, clean.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }));
  const revealW = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, logoWidth] });
  const lineX = sweep.interpolate({ inputRange: [0, 1], outputRange: [ox, ox + logoWidth] });
  const lineOpacity = Animated.multiply(guides, clean.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }));

  // guide geometry, in logo pixels
  const hLines = [15, 215, 467, 500, 580];
  const vLines = [23, 225, 448];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: guideOpacity }]} pointerEvents="none">
        <Svg width={W} height={H}>
          {hLines.map((y) => (
            <Line key={`h${y}`} x1={0} x2={W} y1={Y(y)} y2={Y(y)} stroke={BLUE} strokeOpacity={0.55} strokeWidth={1} />
          ))}
          {vLines.map((x) => (
            <Line key={`v${x}`} x1={X(x)} x2={X(x)} y1={0} y2={H} stroke={BLUE} strokeOpacity={0.55} strokeWidth={1} />
          ))}
          <Circle cx={X(223)} cy={Y(215)} r={200 * s} stroke={BLUE} strokeOpacity={0.7} strokeWidth={1.2} fill="none" />
          <Circle cx={X(225)} cy={Y(205)} r={125 * s} stroke={BLUE} strokeOpacity={0.7} strokeWidth={1.2} fill="none" />
          <Circle cx={X(225)} cy={Y(213)} r={70 * s} stroke={BLUE} strokeOpacity={0.7} strokeWidth={1.2} fill="none" />
        </Svg>
      </Animated.View>

      {/* the logo, uncovered from left to right as the white line passes */}
      <Animated.View style={{ position: "absolute", left: ox, top: oy, width: revealW, height: lh, overflow: "hidden" }}>
        <Animated.Image source={require("../assets/logo/routiq-white.png")} style={{ width: logoWidth, height: lh }} resizeMode="contain" />
      </Animated.View>

      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, width: 4, left: lineX, marginLeft: -2, backgroundColor: BLUE, opacity: lineOpacity }} />
    </View>
  );
};

export default LogoBlueprint;
