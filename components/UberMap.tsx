import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { Place } from "@/lib/mock";

type Props = {
  pickup: Place;
  destination?: Place | null;
  height?: number;
  showVehicles?: boolean;
  etaLabel?: string;
  /** 0..1 position of the driver/vehicle along the route */
  progress?: number | null;
  /** which alternative route to highlight (0 shortest, 1 balanced, 2 fastest) */
  routeIndex?: number;
};

const W = 400;
const H = 400;
const LABELS = ["NATWAR NAGAR", "JOGESHWARI EAST", "Hubtown Viva", "Tata Consultancy", "Andheri West", "Radha Krishna Rd", "Veg Delight"];

// deterministic pseudo-random so the "map" doesn't change between renders
const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

const UberMap = ({ pickup, destination, height = 300, showVehicles = true, etaLabel, progress, routeIndex = 0 }: Props) => {
  const { p0, p1, variants, vehicles, blocks, roads } = useMemo(() => {
    const pts = destination ? [pickup, destination] : [pickup];
    const lats = pts.map((p) => p.latitude);
    const lons = pts.map((p) => p.longitude);
    const minLat = Math.min(...lats) - (destination ? 0.006 : 0.004);
    const maxLat = Math.max(...lats) + (destination ? 0.006 : 0.004);
    const minLon = Math.min(...lons) - (destination ? 0.006 : 0.004);
    const maxLon = Math.max(...lons) + (destination ? 0.006 : 0.004);
    const proj = (p: Place) => ({
      x: 40 + ((p.longitude - minLon) / (maxLon - minLon || 1)) * (W - 80),
      y: 60 + (1 - (p.latitude - minLat) / (maxLat - minLat || 1)) * (H - 140),
    });
    const a = proj(pickup);
    const b = destination ? proj(destination) : null;
    const variants = b
      ? [
          [a, { x: a.x, y: b.y }, b],
          [a, { x: b.x, y: a.y }, b],
          [a, { x: a.x, y: (a.y + b.y) / 2 }, { x: b.x, y: (a.y + b.y) / 2 }, b],
        ]
      : [[a]];

    const rand = rng(Math.round(pickup.latitude * 1e4));
    const bl = Array.from({ length: 26 }, () => ({
      x: rand() * W,
      y: rand() * H,
      w: 30 + rand() * 60,
      h: 20 + rand() * 50,
      park: rand() > 0.88,
    }));
    const ro = Array.from({ length: 9 }, (_, i) => ({
      x1: i % 2 ? rand() * W : 0,
      y1: i % 2 ? 0 : rand() * H,
      x2: i % 2 ? rand() * W : W,
      y2: i % 2 ? H : rand() * H,
    }));
    const v = [0, 1, 2, 3].map((i) => ({ x: a.x + 18 + rand() * 50, y: a.y - 40 + i * 22 + rand() * 10 }));
    return { p0: a, p1: b, variants, vehicles: v, blocks: bl, roads: ro };
  }, [pickup, destination]);

  const route = variants[Math.min(routeIndex, variants.length - 1)];
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const car = useMemo(() => {
    if (progress == null || route.length < 2) return null;
    const segs = route.slice(1).map((p, i) => ({ from: route[i], to: p, len: Math.hypot(p.x - route[i].x, p.y - route[i].y) }));
    let d = progress * segs.reduce((t, x) => t + x.len, 0);
    for (const sg of segs) {
      if (d <= sg.len) {
        const f = sg.len ? d / sg.len : 0;
        return { x: sg.from.x + (sg.to.x - sg.from.x) * f, y: sg.from.y + (sg.to.y - sg.from.y) * f };
      }
      d -= sg.len;
    }
    return route[route.length - 1];
  }, [progress, route]);

  return (
    <View style={{ width: "100%", height, backgroundColor: "#E8E9EC", overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Rect width={W} height={H} fill="#E5E7EB" />
        {blocks.map((b, i) => (
          <Rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill={b.park ? "#CFE8D5" : "#EEF0F3"} />
        ))}
        {roads.map((r, i) => (
          <Line key={i} {...r} stroke="#FFFFFF" strokeWidth={i % 3 === 0 ? 9 : 5} />
        ))}
        {LABELS.map((t, i) => (
          <SvgText key={t} x={20 + ((i * 97) % 280)} y={40 + ((i * 53) % 330)} fontSize={11} fill="#9AA0A6" fontWeight="700">
            {t}
          </SvgText>
        ))}
        <Path d={toPath(route)} stroke="#000" strokeWidth={4} fill="none" strokeLinejoin="round" />
        {showVehicles && !destination &&
          vehicles.map((v, i) => <Rect key={i} x={v.x} y={v.y} width={12} height={20} rx={3} fill={i % 2 ? "#F6C343" : "#EAB308"} />)}
        {showVehicles && destination &&
          vehicles.slice(0, 3).map((v, i) => <Rect key={i} x={v.x} y={v.y} width={12} height={20} rx={3} fill="#EAB308" />)}
        <Circle cx={p0.x} cy={p0.y} r={7} fill="#000" stroke="#fff" strokeWidth={3} />
        {p1 && <Rect x={p1.x - 7} y={p1.y - 7} width={14} height={14} fill="#000" stroke="#fff" strokeWidth={3} />}
        {car && (
          <G>
            <Rect x={car.x - 8} y={car.y - 13} width={16} height={26} rx={4} fill="#EAB308" stroke="#000" strokeWidth={1.5} />
          </G>
        )}
        {etaLabel && (
          <G>
            <Rect x={Math.min(p0.x + 12, W - 130)} y={p0.y - 46} width={118} height={34} fill="#000" />
            <SvgText x={Math.min(p0.x + 12, W - 130) + 8} y={p0.y - 30} fontSize={13} fontWeight="800" fill="#fff">
              {etaLabel}
            </SvgText>
            <SvgText x={Math.min(p0.x + 12, W - 130) + 8} y={p0.y - 17} fontSize={9} fill="#ddd">
              MIN · Current Location
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

export default UberMap;
