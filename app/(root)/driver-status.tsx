import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import Ionicons from "@/components/Icon";
import { useOffline } from "@/components/OfflineBanner";
import { Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { startDriverLocation, useDriverLoc } from "@/lib/driverLoc";

// App status: the few things that decide whether a driver can receive requests.
const DriverStatus = () => {
  const offline = useOffline();
  const loc = useDriverLoc();
  const [notif, setNotif] = useState<boolean | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") return setNotif(null);
    Notifications.getPermissionsAsync().then((p) => setNotif(p.granted)).catch(() => setNotif(false));
  }, []);

  const rows: [string, boolean | null, string, string][] = [
    ["Internet", !offline, "Connected", "No internet. You will not get requests."],
    ["Location", loc.state === "ready", "On", "Off. Tap to turn on."],
    ["Notifications", notif, "Allowed", "Off. Turn on in Account, Notifications."],
  ];
  return (
    <Page title="App status">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16 }}>Everything below should be green to receive ride requests.</T>
      {rows.map(([label, ok, good, bad]) => (
        <Row key={label} onPress={label === "Location" && !ok ? () => startDriverLocation() : undefined} style={{ gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name={ok === null ? "help-circle-outline" : ok ? "checkmark-circle" : "close-circle"} size={26} color={ok === null ? colors.muted : ok ? colors.green : colors.red} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{label}</T>
            <T style={{ color: ok === null ? colors.muted : ok ? colors.green : colors.red, fontSize: 14 }}>{ok === null ? "Not available here" : ok ? good : bad}</T>
          </View>
        </Row>
      ))}
      <T style={{ color: colors.muted, marginTop: 18 }}>Routiq {Constants.expoConfig?.version ?? "2.0.0"}</T>
    </Page>
  );
};

export default DriverStatus;
