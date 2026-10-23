import { View } from "react-native";

import { Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import Card from "./Card";

const Node = ({ filled }: { filled: boolean }) =>
  filled ? (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#CFE0FF", alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.blue }} />
    </View>
  ) : (
    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: "#CFE0FF", backgroundColor: colors.bg }} />
  );

const Link = () => <View style={{ width: 2, height: 18, backgroundColor: "#CFE0FF", marginLeft: 12 }} />;

/** Where you are heading, the next instruction, and the average speed. */
const NavCard = ({ destination, instruction, distance, speed }: { destination: string; instruction: string; distance: string; speed: number }) => (
  <Card>
    <Row style={{ gap: 14 }}>
      <Node filled />
      <T style={{ fontFamily: font.semi, fontSize: 18, flex: 1 }} numberOfLines={1}>{destination}</T>
    </Row>
    <Link />
    <Row style={{ gap: 14 }}>
      <Node filled={false} />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: font.bold, fontSize: 18 }}>{instruction}</T>
        {!!distance && <T style={{ color: colors.muted, fontSize: 15 }}>in {distance}</T>}
      </View>
    </Row>
    <Link />
    <Row style={{ gap: 14 }}>
      <Node filled />
      <T style={{ fontFamily: font.semi, fontSize: 16, color: colors.muted }}>{speed} km/h average</T>
    </Row>
  </Card>
);

export default NavCard;
