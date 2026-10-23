import { View, ViewStyle } from "react-native";

import { colors } from "@/constants/theme";

/** The one card look used across the driver screen (consistent radius, padding and soft shadow). */
const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ backgroundColor: colors.bg, borderRadius: 22, padding: 18, marginTop: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, style]}>{children}</View>
);

export default Card;
