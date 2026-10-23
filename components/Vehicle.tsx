import React from "react";
import { Image } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export type VehicleKind =
  | "sedan" | "sedan2" | "premier" | "taxi" | "van" | "sleek" | "scooter"
  | "auto" | "car" | "bike" | "bus" | "metro" | "parcel" | "suitcase" | "truck" | "mini3w" | "calendar" | "person" | "intercity" | "rental" | "coin" | "gift" | "tag" | "umbrella";

// Illustrated vehicle pictures (assets/vehicles). Kinds without a picture fall back to the drawings below.
const IMAGES: Record<string, any> = {
  sedan: require("../assets/vehicles/sedan.png"),
  sedan2: require("../assets/vehicles/sedan2.png"),
  premier: require("../assets/vehicles/premier.png"),
  taxi: require("../assets/vehicles/taxi.png"),
  van: require("../assets/vehicles/van.png"),
  sleek: require("../assets/vehicles/sleek.png"),
  scooter: require("../assets/vehicles/scooter.png"),
  bike: require("../assets/vehicles/bike.png"),
  auto: require("../assets/vehicles/auto.png"),
};
const ALIAS: Record<string, string> = { car: "sedan", rental: "sedan2", intercity: "sedan", mini3w: "auto" };

const Wheel = ({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) => (
  <G>
    <Circle cx={cx} cy={cy} r={r} fill="#1B1B1B" />
    <Circle cx={cx} cy={cy} r={r * 0.45} fill="#BDBDBD" />
  </G>
);

const Shadow = ({ cx = 50, w = 36 }: { cx?: number; w?: number }) => <Ellipse cx={cx} cy={55} rx={w} ry={3} fill="#000" opacity={0.12} />;

const art = (k: VehicleKind) => {
  switch (k) {
    case "auto":
      return (
        <G>
          <Shadow />
          <Path d="M24 14 Q50 6 72 14 L76 28 L22 28 Z" fill="#1B1B1B" />
          <Path d="M27 16 Q50 10 70 16 L72 27 L26 27 Z" fill="#7A8794" />
          <Rect x={20} y={27} width={58} height={11} rx={3} fill="#F7C416" />
          <Path d="M14 38 L84 38 L84 44 L14 44 Z" fill="#1B1B1B" />
          <Path d="M10 36 L22 28 L22 38 Z" fill="#F7C416" />
          <Rect x={8} y={32} width={6} height={4} rx={2} fill="#FFF3B0" />
          <Wheel cx={18} cy={46} />
          <Wheel cx={72} cy={46} />
        </G>
      );
    case "mini3w":
      return (
        <G>
          <Shadow />
          <Rect x={22} y={12} width={52} height={32} rx={5} fill="#F4F4F4" />
          <Rect x={28} y={16} width={30} height={14} rx={2} fill="#4A5560" />
          <Rect x={60} y={16} width={10} height={24} rx={2} fill="#D8DDE2" />
          <Rect x={12} y={30} width={14} height={14} rx={3} fill="#F4F4F4" />
          <Rect x={8} y={36} width={6} height={4} rx={2} fill="#F7C416" />
          <Wheel cx={18} cy={46} />
          <Wheel cx={68} cy={46} />
        </G>
      );
    case "car":
    case "rental":
    case "intercity":
      return (
        <G>
          <Defs>
            <LinearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor="#D5D9DE" />
            </LinearGradient>
          </Defs>
          <Shadow />
          <Path d="M8 40 Q8 30 20 28 L32 16 Q36 13 42 13 L62 13 Q68 13 72 18 L80 28 Q92 30 92 40 L92 44 L8 44 Z" fill="url(#cb)" />
          <Path d="M35 18 L44 18 L44 28 L28 28 Z" fill="#3B4650" />
          <Path d="M48 18 L62 18 Q65 18 67 22 L72 28 L48 28 Z" fill="#3B4650" />
          <Rect x={86} y={34} width={5} height={4} rx={2} fill="#FFE27A" />
          <Wheel cx={26} cy={44} r={8} />
          <Wheel cx={74} cy={44} r={8} />
        </G>
      );
    case "bike":
      return (
        <G>
          <Shadow />
          <Wheel cx={20} cy={42} r={11} />
          <Wheel cx={80} cy={42} r={11} />
          <Path d="M20 42 L38 28 L60 28 L80 42" stroke="#444" strokeWidth={3} fill="none" />
          <Path d="M36 26 Q48 14 62 24 L60 32 L38 32 Z" fill="#F26B21" />
          <Rect x={30} y={30} width={26} height={7} rx={3} fill="#2A2A2A" />
          <Path d="M72 24 L82 18 L86 22" stroke="#333" strokeWidth={3} fill="none" />
          <Circle cx={82} cy={28} r={3} fill="#FFE27A" />
        </G>
      );
    case "bus":
      return (
        <G>
          <Shadow />
          <Rect x={8} y={10} width={84} height={34} rx={7} fill="#5BA8E6" />
          <Rect x={8} y={34} width={84} height={10} rx={3} fill="#2F6FB2" />
          {[14, 34, 54].map((x) => <Rect key={x} x={x} y={15} width={16} height={12} rx={2} fill="#EAF5FF" />)}
          <Rect x={74} y={15} width={14} height={18} rx={2} fill="#EAF5FF" />
          <Wheel cx={26} cy={45} />
          <Wheel cx={72} cy={45} />
        </G>
      );
    case "metro":
      return (
        <G>
          <Shadow />
          <Path d="M6 40 L6 20 Q6 12 16 12 L84 12 Q94 12 94 22 L94 40 Z" fill="#F1F3F5" />
          <Rect x={10} y={18} width={74} height={10} rx={2} fill="#2B2F36" />
          <Path d="M84 18 L92 24 L84 28 Z" fill="#2B2F36" />
          <Rect x={6} y={34} width={88} height={4} fill="#2F80ED" />
          <Rect x={10} y={42} width={80} height={4} rx={2} fill="#9AA3AD" />
        </G>
      );
    case "parcel":
      return (
        <G>
          <Shadow w={28} />
          <Path d="M24 22 L50 12 L76 22 L76 46 L50 56 L24 46 Z" fill="#E7A35B" />
          <Path d="M50 12 L76 22 L50 32 L24 22 Z" fill="#F2BE80" />
          <Path d="M50 32 L50 56 L24 46 L24 22 Z" fill="#D78E42" />
          <Path d="M44 14 L58 20 L58 34 L44 28 Z" fill="#fff" opacity={0.7} />
        </G>
      );
    case "suitcase":
      return (
        <G>
          <Shadow w={24} />
          <Rect x={30} y={14} width={40} height={36} rx={5} fill="#8C949C" />
          <Rect x={42} y={7} width={16} height={9} rx={3} fill="none" stroke="#555" strokeWidth={3} />
          <Rect x={38} y={14} width={4} height={36} fill="#6F777E" />
          <Rect x={58} y={14} width={4} height={36} fill="#6F777E" />
          <Wheel cx={38} cy={52} r={3} />
          <Wheel cx={62} cy={52} r={3} />
        </G>
      );
    case "truck":
      return (
        <G>
          <Shadow />
          <Rect x={8} y={20} width={22} height={22} rx={4} fill="#F4F4F4" />
          <Rect x={12} y={24} width={12} height={9} rx={2} fill="#4A5560" />
          <Rect x={30} y={30} width={60} height={12} fill="#E9E9E9" />
          <Rect x={36} y={14} width={22} height={16} fill="#E7A35B" />
          <Rect x={60} y={18} width={20} height={12} fill="#D78E42" />
          <Wheel cx={20} cy={44} />
          <Wheel cx={72} cy={44} />
        </G>
      );
    case "calendar":
      return (
        <G>
          <Shadow w={26} />
          <Rect x={26} y={12} width={48} height={40} rx={4} fill="#F4F4F4" />
          <Rect x={26} y={12} width={48} height={10} rx={4} fill="#E04B3A" />
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <Rect key={`${r}${c}`} x={31 + c * 10} y={27 + r * 8} width={6} height={5} fill="#B7BEC6" />))}
          <Circle cx={68} cy={46} r={10} fill="#fff" stroke="#333" strokeWidth={2} />
          <Path d="M68 40 L68 46 L72 48" stroke="#333" strokeWidth={2} fill="none" />
        </G>
      );
    case "person":
      return (
        <G>
          <Shadow w={14} />
          <Circle cx={50} cy={14} r={7} fill="#E0A97A" />
          <Rect x={42} y={22} width={16} height={18} rx={5} fill="#2F80ED" />
          <Rect x={43} y={40} width={6} height={14} rx={2} fill="#1E4FA3" />
          <Rect x={51} y={40} width={6} height={14} rx={2} fill="#1E4FA3" />
        </G>
      );
    case "coin":
      return (
        <G>
          <Circle cx={50} cy={32} r={22} fill="#E8A317" />
          <Circle cx={50} cy={32} r={15} fill="#F7C948" stroke="#B67B00" strokeWidth={3} />
          <Path d="M45 32 L55 32 M50 25 L50 39" stroke="#B67B00" strokeWidth={3} />
        </G>
      );
    case "gift":
      return (
        <G>
          <Rect x={26} y={24} width={48} height={30} rx={3} fill="#E0301E" />
          <Rect x={22} y={18} width={56} height={10} rx={3} fill="#F2543F" />
          <Rect x={46} y={18} width={8} height={36} fill="#FFD7CF" />
          <Path d="M50 18 Q38 4 34 14 Q40 20 50 18 Z M50 18 Q62 4 66 14 Q60 20 50 18 Z" fill="#F2543F" />
        </G>
      );
    case "tag":
      return (
        <G>
          <Path d="M20 14 L56 8 L82 34 L52 56 L20 42 Z" fill="#3B2A7A" />
          <Circle cx={36} cy={22} r={4} fill="#fff" />
          <Path d="M34 44 L58 20" stroke="#fff" strokeWidth={4} />
        </G>
      );
    case "umbrella":
      return (
        <G>
          <Path d="M14 32 Q50 -8 86 32 Z" fill="#3E7BFA" />
          <Path d="M50 32 L50 52 Q50 58 56 56" stroke="#222" strokeWidth={3} fill="none" />
        </G>
      );
  }
};

const Vehicle = ({ kind, size = 56 }: { kind: VehicleKind; size?: number }) => {
  const img = IMAGES[ALIAS[kind] ?? kind];
  if (img) return <Image source={img} style={{ width: size * 1.45, height: size }} resizeMode="contain" />;
  return (
  <Svg width={size * 1.4} height={size} viewBox="0 0 100 60">
    {art(kind)}
  </Svg>
  );
};

export default Vehicle;
