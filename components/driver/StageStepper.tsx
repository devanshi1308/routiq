import { View } from "react-native";

import { T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { STAGES } from "@/lib/driverNav";

/** Five-step progress bar: Request, Pickup, Arrived, On trip, Done. `active` is the current step (-1 = none). */
const StageStepper = ({ active }: { active: number }) => (
  <View style={{ flexDirection: "row", marginTop: 18 }}>
    {STAGES.map((s, i) => {
      const done = i <= active;
      return (
        <View key={s} style={{ flex: 1, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
            <View style={{ flex: 1, height: 3, backgroundColor: i === 0 ? "transparent" : done ? colors.ink : colors.border }} />
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: done ? colors.ink : colors.border, borderWidth: i === active ? 3 : 0, borderColor: colors.green }} />
            <View style={{ flex: 1, height: 3, backgroundColor: i === STAGES.length - 1 ? "transparent" : i < active ? colors.ink : colors.border }} />
          </View>
          <T style={{ fontSize: 11, marginTop: 6, fontFamily: i === active ? font.bold : font.medium, color: done ? colors.text : colors.muted }}>{s}</T>
        </View>
      );
    })}
  </View>
);

export default StageStepper;
