import { View } from "react-native";

import { Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";

/** "Today's status": finished and cancelled trips, and earnings. Tapping it opens the earnings page. */
const StatusCard = ({ completed, cancelled, earnings }: { completed: number; cancelled: number; earnings: number }) => (
  <View style={{ backgroundColor: colors.bg, borderRadius: 22, padding: 16 }}>
    <Row style={{ justifyContent: "space-between" }}>
      <View>
        <T style={{ color: colors.muted, fontSize: 12 }}>TODAY'S STATUS</T>
        <T style={{ fontFamily: font.semi, marginTop: 6 }}>Completed <T style={{ fontFamily: font.extra }}>{String(completed).padStart(2, "0")}</T></T>
        <T style={{ fontFamily: font.semi, marginTop: 2 }}>Cancelled <T style={{ fontFamily: font.extra }}>{String(cancelled).padStart(2, "0")}</T></T>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <T style={{ color: colors.muted, fontSize: 12 }}>EARNINGS</T>
        <T style={{ fontFamily: font.extra, fontSize: 34, marginTop: 2 }}>₹{earnings.toFixed(0)}</T>
      </View>
    </Row>
  </View>
);

export default StatusCard;
