// The page people get when they open a shared trip link. It polls the trip snapshot and draws the live map.
module.exports = (id) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#000000">
<title>Routiq · live ride</title>
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif;background:var(--color-bg);color:var(--color-text);overflow:hidden}
#map{position:absolute;inset:0}
.top{position:absolute;z-index:500;top:max(12px,env(safe-area-inset-top));left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
.pill{background:var(--color-surface-raised);border-radius:999px;box-shadow:var(--shadow-raised);height:42px;padding:0 14px;display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px}
.pill i{width:22px;height:22px;background:var(--logo-mark) center/contain no-repeat;display:block}
.live{color:var(--color-success-text)}.live:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--color-success);animation:p 1.4s infinite}
.live.off{color:var(--color-text-muted)}.live.off:before{background:var(--color-text-muted);animation:none}
@keyframes p{50%{opacity:.25}}
.sheet{position:absolute;z-index:500;left:0;right:0;bottom:0;background:var(--color-bg);border-radius:26px 26px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.16);padding:10px 20px calc(18px + env(safe-area-inset-bottom));max-height:62vh;overflow:auto}
.grab{width:42px;height:4px;border-radius:2px;background:var(--color-border);margin:0 auto 12px}
.chip{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;background:var(--color-surface);border-radius:999px;padding:5px 10px}
h1{font-size:28px;line-height:1.15;margin:10px 0 2px;font-weight:800}
.sub{color:var(--color-text-muted);font-size:15px;margin-top:2px}
.track{position:relative;margin:40px 4px 0}.pct{position:absolute;top:-32px;left:0;transform:translateX(-50%);background:var(--color-accent);color:var(--color-on-accent);font-size:12px;font-weight:800;padding:4px 8px;border-radius:8px;transition:left .9s ease;white-space:nowrap}.pct:after{content:"";position:absolute;left:50%;bottom:-4px;width:8px;height:8px;background:var(--color-accent);transform:translateX(-50%) rotate(45deg);border-radius:1px}.track .rail2{height:8px;border-radius:4px;background:var(--color-border);overflow:hidden}.track .fill{height:100%;width:0;background:var(--color-success);border-radius:4px;transition:width .9s ease}
.track .dot{position:absolute;top:-3px;width:14px;height:14px;border-radius:50%;background:var(--color-bg);border:3px solid var(--color-border);transform:translateX(-50%);transition:border-color .4s,background .4s}.track .dot.on{border-color:var(--color-success);background:var(--color-success)}
.marks{position:relative;height:18px;margin:10px 4px 0;font-size:12px;font-weight:600;color:var(--color-text-muted)}.marks span{position:absolute;transform:translateX(-50%);white-space:nowrap}.marks span.on{color:var(--color-text)}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.tile{background:var(--color-surface);border-radius:16px;padding:12px 14px}
.tile small{display:block;color:var(--color-text-muted);font-size:12px}.tile strong{font-size:20px;display:block;margin-top:2px}
.driver{display:flex;align-items:center;gap:12px;margin-top:14px;background:var(--color-surface);border-radius:16px;padding:12px 14px}
.av{width:44px;height:44px;border-radius:50%;background:var(--color-accent);color:var(--color-on-accent);display:grid;place-items:center;font-weight:800;font-size:18px}
.driver .n{font-weight:700;font-size:16px}.driver .v{color:var(--color-text-muted);font-size:13px}.plate{margin-left:auto;font-weight:800;font-size:13px;border:2px solid var(--color-text);border-radius:6px;padding:3px 7px;white-space:nowrap}
.route{margin-top:14px;display:flex;gap:12px}.rail{display:flex;flex-direction:column;align-items:center;padding-top:5px}.rail s{width:10px;height:10px;border:3px solid var(--color-text);border-radius:50%;display:block}.rail u{flex:1;width:2px;background:var(--color-border);margin:3px 0}.rail q{width:10px;height:10px;background:var(--color-text);display:block}
.route small{color:var(--color-text-muted);font-size:12px;display:block}.route div b{font-size:15px;font-weight:600}
.foot{margin-top:14px;font-size:12px;color:var(--color-text-muted);text-align:center}
.banner{display:none;background:#fdeadb;color:#7a3b00;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:10px}
.leaflet-control-attribution{font-size:9px}
.car{width:22px;height:22px;border-radius:50%;background:var(--color-info);border:4px solid #fff;box-shadow:0 0 0 6px rgba(39,110,241,.25),0 2px 8px rgba(0,0,0,.4)}
</style></head><body>
<div id="map"></div>
<div class="top"><div class="pill"><i></i>Routiq</div><div class="pill live" id="live">Live</div></div>
<div class="sheet"><div class="grab"></div>
  <div class="banner" id="banner">Reconnecting… showing the last update.</div>
  <span class="chip" id="chip">Shared ride</span>
  <h1 id="title">Waiting for the ride…</h1>
  <div class="sub" id="sub">The rider has not started sharing yet.</div>
  <div class="track"><div class="pct" id="pct">0%</div><div class="rail2"><div class="fill" id="prog"></div></div></div>
  <div class="marks"><span id="mL" style="left:0;transform:none">Driver</span><span id="mR" style="right:0;transform:none;left:auto">Pickup</span></div>
  <div class="tiles"><div class="tile"><small>Arrives in</small><strong id="eta">–</strong></div><div class="tile"><small id="dl">Distance</small><strong id="route">–</strong></div></div>
  <div class="driver" id="drv" style="display:none"><img class="av" id="av" alt="" style="background:none;border-radius:0;width:64px;height:44px;object-fit:contain"><div><div class="n" id="dn"></div><div class="v" id="dv"></div></div><div class="plate" id="pl"></div></div>
  <div class="route"><div class="rail"><s></s><u></u><q></q></div><div style="flex:1"><div><small>From</small><b id="from">–</b></div><div style="margin-top:12px"><small>To</small><b id="to">–</b></div></div></div>
  <div class="foot" id="upd"></div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var ID=${JSON.stringify(id)};var $=function(i){return document.getElementById(i)};
var map=L.map('map',{zoomControl:false}).setView([19.13,72.85],13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var line,veh,fitted=false,got=false,lookShown;
var TITLE={searching:'Finding a driver',driver_assigned:'Driver is on the way',driver_arrived:'Driver has arrived',in_progress:'On the way',completed:'Arrived safely',cancelled:'Ride cancelled'};
var STEP={searching:-1,driver_assigned:0,driver_arrived:0,in_progress:1,completed:2,cancelled:-1};
function along(c,p){if(!c||!c.length)return null;return c[Math.min(c.length-1,Math.floor(p*(c.length-1)))];}
function render(t){
  got=true;var s=t.status;
  $('chip').textContent=(t.rider?t.rider+"'s ride":'Shared ride');
  var mins=s==='in_progress'?Math.max(1,Math.ceil(t.minutes*(1-t.progress))):s==='driver_assigned'?Math.max(1,Math.ceil(t.etaSec/60)):0;
  $('title').textContent=s==='in_progress'?(t.progress>=1?'Arrived safely':'Arriving in '+mins+' min'):s==='driver_assigned'?(t.etaSec<=0?'Driver is at the pickup':'Driver arrives in '+mins+' min'):(TITLE[s]||'Ride');
  $('sub').textContent=t.destination?'Heading to '+t.destination.name:'';
  var assigned=s==='driver_assigned',trip=s==='in_progress';
  var ov=s==='completed'||s==='driver_arrived'?1:assigned?(t.etaTotal?1-t.etaSec/t.etaTotal:0.05):trip?t.progress:0;
  $('prog').style.width=Math.max(3,Math.round(Math.min(1,ov)*100))+'%';
  $('mL').textContent=trip||s==='completed'?'Pickup':'Driver';$('mR').textContent=trip||s==='completed'?(t.destination?t.destination.name:'Destination'):'Pickup';
  var pc=Math.round(Math.min(1,ov)*100);$('pct').textContent=pc+'%';$('pct').style.left=Math.min(92,Math.max(8,pc))+'%';$('pct').style.display=(assigned||trip||s==='completed'||s==='driver_arrived')?'block':'none';
  $('dl').textContent=assigned?'Driver is':trip?'Left to travel':'Route';
  $('eta').textContent=s==='completed'?'Arrived':mins?mins+' min':'–';
  $('route').textContent=(assigned||trip)&&t.kmLeft!=null?(t.kmLeft<0.1?'Almost there':t.kmLeft.toFixed(1)+' km '+(assigned?'away':'left')):(t.routeName?t.routeName+' · '+t.km+' km':'–');
  if(t.driver){$('drv').style.display='flex';$('av').src='/v/'+(t.look||'sedan')+'.png';$('dn').textContent=t.driver.name+'  ★ '+t.driver.rating;$('dv').textContent=t.driver.vehicle;$('pl').textContent=t.driver.plate;}
  $('from').textContent=t.pickup?t.pickup.name:'–';$('to').textContent=t.destination?t.destination.name:'–';
  if(t.coords&&t.coords.length){if(!line){line=L.polyline(t.coords,{color:'#000',weight:5,opacity:.85}).addTo(map);
    L.circleMarker(t.coords[0],{radius:7,color:'#000',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(map);
    L.circleMarker(t.coords[t.coords.length-1],{radius:7,color:'#000',weight:3,fillColor:'#000',fillOpacity:1}).addTo(map);}
    if(!fitted){map.fitBounds(line.getBounds(),{paddingTopLeft:[30,70],paddingBottomRight:[30,Math.round(innerHeight*.5)]});fitted=true;}}
  var pos=(s==='in_progress'||s==='completed')?along(t.coords,s==='completed'?1:t.progress):t.driverPos?[t.driverPos.latitude,t.driverPos.longitude]:null;
  if(pos){var ic=L.divIcon({className:'',html:'<img src="/v/'+(t.look||'sedan')+'.png" style="width:54px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">',iconSize:[54,36],iconAnchor:[27,18]});if(!veh)veh=L.marker(pos,{icon:ic}).addTo(map);else veh.setLatLng(pos);if(lookShown!==t.look){veh.setIcon(ic);lookShown=t.look;}}
  var fresh=Date.now()-t.updatedAt<15000;$('live').className='pill live'+(fresh?'':' off');$('live').textContent=fresh?'Live':'Paused';
  $('upd').textContent='Updated '+new Date(t.updatedAt).toLocaleTimeString();
}
function tick(){fetch('/api/trip/'+ID).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(t){$('banner').style.display='none';render(t)}).catch(function(){if(got)$('banner').style.display='block';else{$('live').className='pill live off';$('live').textContent='Waiting';}});}
tick();setInterval(tick,1000);
</script></body></html>`;
