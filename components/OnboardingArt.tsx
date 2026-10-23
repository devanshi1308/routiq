import React from "react";
import { Image, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

// Illustrations for the three onboarding slides, drawn from simple shapes and the app's own vehicle pictures.
const SIZE = 280;

const Map = () => (
  <G>
    <Rect x={30} y={40} width={220} height={190} rx={22} fill="#F3F3F3" />
    <Rect x={60} y={70} width={60} height={40} rx={6} fill="#E6E6E6" />
    <Rect x={140} y={70} width={80} height={30} rx={6} fill="#CFE8D5" />
    <Rect x={60} y={150} width={90} height={50} rx={6} fill="#E6E6E6" />
    <Rect x={170} y={130} width={50} height={70} rx={6} fill="#E6E6E6" />
    <Line x1={30} y1={125} x2={250} y2={125} stroke="#fff" strokeWidth={10} />
    <Line x1={130} y1={40} x2={130} y2={230} stroke="#fff" strokeWidth={10} />
    <Line x1={30} y1={190} x2={250} y2={190} stroke="#fff" strokeWidth={6} />
  </G>
);

const Pin = ({ x, y, dark = true }: { x: number; y: number; dark?: boolean }) => (
  <G>
    <Circle cx={x} cy={y} r={11} fill={dark ? "#000" : "#276EF1"} />
    <Circle cx={x} cy={y} r={4} fill="#fff" />
    <Circle cx={x} cy={y} r={20} fill={dark ? "#000" : "#276EF1"} opacity={0.12} />
  </G>
);

export const Slide1 = () => (
  <View style={{ width: SIZE, height: SIZE }}>
    <Svg width={SIZE} height={SIZE} viewBox="0 0 280 280">
      <Circle cx={140} cy={140} r={128} fill="#F7F7F7" />
      <Map />
      <Path d="M130 125 L130 190" stroke="#000" strokeWidth={5} />
      <Pin x={130} y={190} />
      <Rect x={150} y={64} width={80} height={34} rx={17} fill="#000" />
      <Circle cx={168} cy={81} r={5} fill="#fff" />
      <Rect x={180} y={77} width={38} height={8} rx={4} fill="#fff" opacity={0.7} />
    </Svg>
    <Image source={require("../assets/vehicles/auto.png")} style={{ position: "absolute", left: 36, top: 118, width: 120, height: 80 }} resizeMode="contain" />
  </View>
);

export const Slide2 = () => (
  <View style={{ width: SIZE, height: SIZE }}>
    <Svg width={SIZE} height={SIZE} viewBox="0 0 280 280">
      <Circle cx={140} cy={140} r={128} fill="#F7F7F7" />
      <Map />
      <Path d="M70 200 L70 150 L130 150 L130 95 L205 95" stroke="#000" strokeWidth={6} fill="none" strokeLinejoin="round" />
      <Pin x={70} y={200} dark={false} />
      <Rect x={198} y={88} width={14} height={14} fill="#000" />
    </Svg>
    <Image source={require("../assets/vehicles/sedan.png")} style={{ position: "absolute", left: 84, top: 112, width: 100, height: 64 }} resizeMode="contain" />
  </View>
);

export const Slide3 = () => (
  <View style={{ width: SIZE, height: SIZE }}>
    <Svg width={SIZE} height={SIZE} viewBox="0 0 280 280">
      <Circle cx={140} cy={140} r={128} fill="#F7F7F7" />
      <Rect x={78} y={34} width={124} height={212} rx={24} fill="#fff" stroke="#111" strokeWidth={4} />
      <Rect x={118} y={44} width={44} height={8} rx={4} fill="#111" />
      <Rect x={92} y={66} width={96} height={64} rx={12} fill="#F3F3F3" />
      <Path d="M102 118 L126 96 L150 108 L176 78" stroke="#000" strokeWidth={4} fill="none" strokeLinejoin="round" />
      <Circle cx={176} cy={78} r={5} fill="#276EF1" />
      <Rect x={92} y={142} width={96} height={8} rx={4} fill="#E6E6E6" />
      <Rect x={92} y={142} width={64} height={8} rx={4} fill="#000" />
      <Rect x={92} y={162} width={60} height={8} rx={4} fill="#E6E6E6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Path key={i} d={`M${104 + i * 17} 192 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z`} fill={i < 4 ? "#F7C416" : "#DDD"} />
      ))}
    </Svg>
    <Image source={require("../assets/vehicles/taxi.png")} style={{ position: "absolute", left: 150, top: 188, width: 110, height: 68 }} resizeMode="contain" />
  </View>
);
