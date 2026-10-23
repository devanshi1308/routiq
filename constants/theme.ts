// Light and dark palettes. `colors` is updated in place by applyTheme(), so every screen reads the active one.
// ink is the strong colour (black buttons in light, white in dark) and onInk is what sits on top of it.
const light = { bg: "#FFFFFF", card: "#F3F3F3", skeleton: "#EBEBEB", border: "#E2E2E2", text: "#000000", muted: "#6B6B6B", ink: "#000000", onInk: "#FFFFFF" };
const dark = { bg: "#121212", card: "#232323", skeleton: "#2C2C2C", border: "#3A3A3A", text: "#FFFFFF", muted: "#A3A3A3", ink: "#FFFFFF", onInk: "#000000" };

export type Scheme = "light" | "dark";
export const applyTheme = (scheme: Scheme) => Object.assign(colors, scheme === "dark" ? dark : light);

export const colors = {
  black: "#000000",
  white: "#FFFFFF",
  ...light,
  blue: "#276EF1",
  green: "#05944F",
  red: "#E11900",
  promo: "#D93A1B",
  yellow: "#FFC043",
};

export const font = {
  regular: "Jakarta",
  medium: "Jakarta-Medium",
  semi: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extra: "Jakarta-ExtraBold",
};
