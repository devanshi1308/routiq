import React, { useEffect, useMemo, useRef } from "react";
import { Platform, View } from "react-native";

import { Place, RouteOption } from "@/lib/mock";

type Props = {
  pickup: Place;
  destination?: Place | null;
  routes?: RouteOption[];
  routeIndex?: number;
  /** 0..1 position of the vehicle along the selected route */
  progress?: number | null;
  height: number;
  etaLabel?: string;
  /** H3 cells to outline (lat/lon rings) */
  hexes?: [number, number][][];
  vehicles?: { latitude: number; longitude: number; kind?: "auto" | "car" | "bike" }[];
  /** the matched driver's live position while they travel to the pickup */
  driverPos?: { latitude: number; longitude: number } | null;
};

// Real map: OpenStreetMap tiles drawn with Leaflet (free, no API key), inside an iframe on web
// and a WebView on iOS/Android.
const html = (init: object) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#m{height:100%;margin:0;background:#E5E7EB}.sq{width:14px;height:14px;background:#000;border:3px solid #fff;box-sizing:border-box}
.car{width:18px;height:28px;background:#F7C416;border:2px solid #000;border-radius:5px;box-sizing:border-box}
.v{width:10px;height:16px;background:#EAB308;border:1.5px solid #000;border-radius:3px;box-sizing:border-box}.eta{background:#000;color:#fff;border:0;font:700 12px system-ui;border-radius:0;padding:4px 8px}.eta:before{display:none}</style></head>
<body><div id="m"></div><script>
var map=L.map('m',{zoomControl:false}).setView([${(init as any).lat},${(init as any).lon}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var layers=[],lastKey='';
function apply(st){
  layers.forEach(function(l){map.removeLayer(l)});layers=[];
  var all=[[st.pickup.lat,st.pickup.lon]];
  (st.hexes||[]).forEach(function(h){layers.push(L.polygon(h,{color:'#276EF1',weight:1,fillColor:'#276EF1',fillOpacity:.07}).addTo(map));});
  (st.veh||[]).forEach(function(v){layers.push(L.marker([v[0],v[1]],{icon:L.divIcon({className:'',html:'<div style="width:30px;height:30px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center;font-size:18px">'+(v[2]==='bike'?'🏍️':v[2]==='car'?'🚕':'🛺')+'</div>',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map));});
  if(st.dest){all.push([st.dest.lat,st.dest.lon]);}
  (st.routes||[]).forEach(function(r,i){ if(i!==st.sel) layers.push(L.polyline(r,{color:'#8A9099',weight:6,opacity:.85}).addTo(map)); });
  var sel=(st.routes||[])[st.sel];
  if(sel){layers.push(L.polyline(sel,{color:'#000',weight:6}).addTo(map));all=all.concat(sel);}
  layers.push(L.circleMarker([st.pickup.lat,st.pickup.lon],{radius:8,color:'#fff',weight:3,fillColor:'#000',fillOpacity:1}).addTo(map));
  if(st.dest) layers.push(L.marker([st.dest.lat,st.dest.lon],{icon:L.divIcon({className:'',html:'<div class="sq"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map));
  if(st.eta) layers.push(L.marker([st.pickup.lat,st.pickup.lon],{opacity:0}).bindTooltip(st.eta,{permanent:true,direction:'right',className:'eta',offset:[10,-14]}).addTo(map));
  if(st.drv){layers.push(L.marker(st.drv,{icon:L.divIcon({className:'',html:'<div class="car"></div>',iconSize:[18,28],iconAnchor:[9,14]})}).addTo(map));all.push(st.drv);}
  if(st.car) layers.push(L.marker(st.car,{icon:L.divIcon({className:'',html:'<div class="car"></div>',iconSize:[18,28],iconAnchor:[9,14]})}).addTo(map));
  var key=JSON.stringify([st.pickup,st.dest,st.sel,(st.routes||[]).length,(st.hexes||[]).length]);
  if(key!==lastKey){lastKey=key;map.fitBounds(L.latLngBounds(all),{padding:[40,40],maxZoom:16});}
}
function onMsg(e){try{apply(JSON.parse(e.data))}catch(x){}}
window.addEventListener('message',onMsg);document.addEventListener('message',onMsg);
apply(${JSON.stringify(init)}.state);
</script></body></html>`;

const along = (coords: [number, number][], progress: number): [number, number] | null => {
  if (coords.length < 2) return null;
  const seg = coords.slice(1).map((p, i) => Math.hypot(p[0] - coords[i][0], p[1] - coords[i][1]));
  let d = progress * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const f = seg[i] ? d / seg[i] : 0;
      return [coords[i][0] + (coords[i + 1][0] - coords[i][0]) * f, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * f];
    }
    d -= seg[i];
  }
  return coords[coords.length - 1];
};

const LiveMap = ({ pickup, destination, routes = [], routeIndex = 0, progress = null, height, etaLabel, hexes = [], vehicles = [], driverPos = null }: Props) => {
  const state = useMemo(
    () => ({
      pickup: { lat: pickup.latitude, lon: pickup.longitude },
      dest: destination ? { lat: destination.latitude, lon: destination.longitude } : null,
      routes: routes.map((r) => r.coords),
      sel: Math.min(routeIndex, Math.max(0, routes.length - 1)),
      car: progress != null && routes[routeIndex] ? along(routes[routeIndex].coords, progress) : null,
      eta: etaLabel ? `${etaLabel} MIN` : null,
      hexes,
      veh: vehicles.map((v) => [v.latitude, v.longitude, v.kind ?? "auto"]),
      drv: driverPos ? [driverPos.latitude, driverPos.longitude] : null,
    }),
    [pickup, destination, routes, routeIndex, progress, etaLabel, hexes, vehicles, driverPos],
  );
  // The page is built once per pickup/destination; later changes are pushed in as messages.
  const doc = useMemo(() => html({ lat: pickup.latitude, lon: pickup.longitude, state }), [pickup, destination]); // eslint-disable-line react-hooks/exhaustive-deps
  const frame = useRef<any>(null);

  useEffect(() => {
    const msg = JSON.stringify(state);
    if (Platform.OS === "web") frame.current?.contentWindow?.postMessage(msg, "*");
    else frame.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(msg)}}));true;`);
  }, [state]);

  if (Platform.OS === "web") {
    return (
      <View style={{ width: "100%", height }}>
        {React.createElement("iframe", {
          ref: frame,
          srcDoc: doc,
          onLoad: () => frame.current?.contentWindow?.postMessage(JSON.stringify(state), "*"),
          style: { border: 0, width: "100%", height: "100%" },
          title: "map",
        })}
      </View>
    );
  }
  const { WebView } = require("react-native-webview");
  return (
    <View style={{ width: "100%", height }}>
      <WebView ref={frame} originWhitelist={["*"]} source={{ html: doc, baseUrl: "https://routiq.app" }} javaScriptEnabled scrollEnabled={false} style={{ flex: 1 }} />
    </View>
  );
};

export default LiveMap;
