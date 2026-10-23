import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";

import { colors } from "@/constants/theme";

// Ionicons that follow the light / dark theme unless a colour is given.
const Icon = ({ color, ...p }: ComponentProps<typeof Ionicons>) => <Ionicons {...p} color={color ?? colors.text} />;
Icon.glyphMap = Ionicons.glyphMap;

export default Icon;
