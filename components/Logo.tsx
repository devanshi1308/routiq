import { Image } from "react-native";

import { colors } from "@/constants/theme";

const SRC = {
  full: { white: require("../assets/logo/routiq-white.png"), black: require("../assets/logo/routiq-black.png"), ratio: 605 / 475 },
  mark: { white: require("../assets/logo/mark-white.png"), black: require("../assets/logo/mark-black.png"), ratio: 480 / 475 },
};

/** Routiq logo. Without `tone` it picks white on dark screens and black on light ones. */
const Logo = ({ width = 120, mark = false, tone }: { width?: number; mark?: boolean; tone?: "white" | "black" }) => {
  const set = mark ? SRC.mark : SRC.full;
  const t = tone ?? (colors.bg === "#FFFFFF" ? "black" : "white");
  return <Image source={set[t]} style={{ width, height: width * set.ratio }} resizeMode="contain" accessibilityLabel="Routiq" />;
};

export default Logo;
