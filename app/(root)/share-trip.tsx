import * as Clipboard from "expo-clipboard";
import { Linking, Platform, Share, View } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useTripStore } from "@/store";
import { useSafetyStore } from "@/store/extras";
import { pushSnapshot, trackLink, useShareStore } from "@/lib/tripShare";

// Share a live link with the trip details and where the vehicle is right now.
const ShareTrip = () => {
  const { driver, driverPos, pickup, destination, requestId, status, etaSec } = useTripStore();
  const contacts = useSafetyStore((s) => s.share);
  const [note, setNote] = useState("");

  const sharingId = useShareStore((s) => s.sharingId);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const id = requestId || "pending";
  const link = trackLink(id);

  // opening this page starts live sharing for the current trip
  useEffect(() => {
    if (!requestId) return;
    useShareStore.getState().start(requestId);
    pushSnapshot(requestId).then(setReachable);
  }, [requestId]);
  const where = status === "in_progress" ? "on the way" : status === "driver_arrived" ? "at the pickup point" : status === "driver_assigned" ? `arriving in about ${Math.max(1, Math.ceil(etaSec / 60))} min` : "waiting for a driver";
  const message = [
    "I'm on a Routiq ride and sharing it with you.",
    driver ? `Driver: ${driver.name}, ${driver.vehicle} (${driver.plate})` : "",
    `From: ${pickup.name}`,
    destination ? `To: ${destination.name}` : "",
    `Status: ${where}`,
    `Follow my ride live (map, route and arrival time): ${link}`,
    `Trip ID: ${requestId || "pending"}`,
  ].filter(Boolean).join("\n");

  const share = async () => {
    try {
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message);
      setNote("Link copied.");
    }
  };
  const copy = async () => {
    await Clipboard.setStringAsync(message);
    setNote("Trip details and link copied.");
  };
  const sms = (phone: string) => Linking.openURL(`sms:${phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(message)}`).catch(() => setNote("Could not open messages."));

  return (
    <Page title="Share trip" art={require("../../assets/illustrations/map-driver.webp")}>
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Anyone with the link can open it, with no app needed, and follow your ride live: the map, the route, how long it will take, and who is driving.</T>
      <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 18 }}>
        <T style={{ fontFamily: font.bold, fontSize: 17 }}>{destination ? `To ${destination.name}` : "No active trip"}</T>
        <T style={{ color: colors.muted, marginTop: 2 }}>{driver ? `${driver.name} · ${driver.vehicle} · ${driver.plate}` : "Driver not assigned yet"}</T>
        <T style={{ color: colors.blue, marginTop: 8 }} numberOfLines={2}>{link}</T>
        <Row style={{ gap: 6, marginTop: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sharingId && reachable !== false ? colors.green : colors.red }} />
          <T style={{ fontFamily: font.semi, fontSize: 13 }}>{!requestId ? "Start a ride to share it" : reachable === false ? "Tracking server not reachable. Run npm run realtime." : "Sharing live. Updates every 2 seconds."}</T>
        </Row>
      </View>
      <Button title="Share link" onPress={share} style={{ marginTop: 16 }} />
      <Button title="Copy" variant="grey" onPress={copy} style={{ marginTop: 10 }} />
      {!!note && <T style={{ color: colors.green, marginTop: 8, fontFamily: font.semi }}>{note}</T>}

      <T style={{ fontFamily: font.bold, fontSize: 20, marginTop: 26, marginBottom: 4 }}>Your trusted contacts</T>
      {contacts.length === 0 && <T style={{ color: colors.muted }}>No one added yet.</T>}
      {contacts.map((c) => (
        <Row key={c.id} style={{ gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 17 }}>{c.name}</T>
            <T style={{ color: colors.muted }}>+91 {c.phone}</T>
          </View>
          <T onPress={() => sms(c.phone)} style={{ color: colors.blue, fontFamily: font.bold, padding: 6 }}>Send</T>
        </Row>
      ))}
      <T onPress={() => router.push("/(root)/contacts?kind=share" as any)} style={{ color: colors.blue, fontFamily: font.semi, marginTop: 14 }}>Add or remove people</T>
    </Page>
  );
};

export default ShareTrip;
