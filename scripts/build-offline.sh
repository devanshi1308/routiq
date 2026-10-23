#!/bin/bash
# Builds the offline web app into dist/ and zips it as routiq-offline.zip
set -e
cd "$(dirname "$0")/.."
rm -rf dist
npx expo export -p web
python3 - <<'PY'
p="dist/index.html"; s=open(p).read()
inj='<link rel="stylesheet" href="/theme.css"><meta name="color-scheme" content="light dark"><link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#000000"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Routiq"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="/icon-192.png"><script>if("serviceWorker" in navigator){window.addEventListener("load",function(){(window.requestIdleCallback||function(f){setTimeout(f,3000)})(function(){navigator.serviceWorker.register("/sw.js")})})}</script>'
pre=""  # font preload was tried and made the browser download each font twice, so it is left out
if "manifest.json" not in s: s=s.replace("</head>",pre+inj+"</head>")
open(p,"w").write(s)
PY
(cd dist && find . -type f ! -name sw.js ! -name precache.json | sed 's|^\./|/|' | python3 -c "import sys,json;print(json.dumps(['/']+[l.strip() for l in sys.stdin]))" > precache.json)
cat > dist/start-routiq.command <<'EOS'
#!/bin/bash
cd "$(dirname "$0")"
echo "Routiq is running at http://localhost:8080  (Ctrl-C to stop)"
(sleep 1; open http://localhost:8080) &
python3 -m http.server 8080
EOS
chmod +x dist/start-routiq.command
rm -f routiq-offline.zip
zip -qr routiq-offline.zip dist
echo "Done: routiq-offline.zip"
