// Checks every foreground/background pairing in public/theme.css against WCAG 2.2 AA in every theme.
//   node scripts/check-contrast.js        (exit code 1 if any pairing fails)
const fs = require("fs");
const path = require("path");
const css = fs.readFileSync(path.join(__dirname, "..", "public", "theme.css"), "utf8");

// [foreground, background, minimum ratio, what it is]. 4.5 = normal text, 3 = large text and UI parts.
const PAIRS = [
  ["text", "bg", 4.5, "body text on page"],
  ["text", "surface", 4.5, "text on cards and inputs"],
  ["text", "surface-raised", 4.5, "text on sheets and menus"],
  ["text-muted", "bg", 4.5, "secondary text on page"],
  ["text-muted", "surface", 4.5, "secondary text on cards"],
  ["text-muted", "surface-raised", 4.5, "secondary text on sheets"],
  ["link", "bg", 4.5, "links on page"],
  ["link", "surface", 4.5, "links on cards"],
  ["on-accent", "accent", 4.5, "text on primary buttons"],
  ["success-text", "bg", 4.5, "success text on page"],
  ["success-text", "surface", 4.5, "success text on cards"],
  ["danger-text", "bg", 4.5, "error text on page"],
  ["danger-text", "surface", 4.5, "error text on cards"],
  ["warning-text", "bg", 4.5, "warning text on page"],
  ["warning-text", "surface", 4.5, "warning text on cards"],
  ["border-strong", "bg", 3, "input outline on page"],
  ["border-strong", "surface", 3, "input outline on cards"],
  ["focus-ring", "bg", 3, "focus ring on page"],
  ["focus-ring", "surface", 3, "focus ring on cards"],
  ["accent", "bg", 3, "primary button against the page"],
  ["success", "bg", 3, "progress fill against the page"],
  ["info", "bg", 3, "map marker against the page"],
];

const tokens = (block) => Object.fromEntries([...block.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
const base = tokens(root);
const split = (v) => (v.startsWith("light-dark(") ? v.slice(11, -1).split(",").map((s) => s.trim()) : [v, v]);

// built-in themes come from the light-dark() pairs; extra themes are ":root.theme-NAME { ... }" blocks
const themes = { light: {}, dark: {} };
for (const [k, v] of Object.entries(base)) {
  const [l, d] = split(v);
  themes.light[k] = l;
  themes.dark[k] = d;
}
for (const m of css.matchAll(/:root\.theme-([\w-]+)\s*\{([\s\S]*?)\n\s*\}/g)) {
  if (m[1] === "light" || m[1] === "dark" || /^\s*color-scheme:\s*\w+;\s*$/.test(m[2].trim()) && !/--color-/.test(m[2])) continue;
  const dark = /color-scheme:\s*dark/.test(m[2]);
  themes[m[1]] = { ...(dark ? themes.dark : themes.light), ...tokens(m[2]) };
}

const lum = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [16, 8, 0].map((s) => ((n >> s) & 255) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let fails = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min, what] of PAIRS) {
    if (!t[fg] || !t[bg]) { console.log(`  ?  missing token for ${fg} / ${bg}`); fails++; continue; }
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) fails++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (needs ${min})  ${fg} on ${bg}  ${t[fg]} / ${t[bg]}  - ${what}`);
  }
}
console.log(fails ? `\n${fails} pairing(s) below WCAG AA` : "\nAll pairings meet WCAG AA in every theme.");
process.exit(fails ? 1 : 0);
