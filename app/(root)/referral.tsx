import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Share, View } from "react-native";

import { Button, Page, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useAuthStore } from "@/store";

// Invite another driver to Routiq with a personal code.
const Referral = () => {
  const phone = useAuthStore((s) => s.phone);
  const code = `ROUTIQ${(phone || "0000").slice(-4)}`;
  const text = `Drive with Routiq. Use my code ${code} when you sign up as a driver.`;
  const [note, setNote] = useState("");
  return (
    <Page title="Refer a driver">
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Know a driver who would like to join Routiq? Send them your code.</T>
      <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 22, marginTop: 20, alignItems: "center" }}>
        <T style={{ color: colors.muted, fontSize: 12 }}>YOUR CODE</T>
        <T style={{ fontFamily: font.extra, fontSize: 34, letterSpacing: 2, marginTop: 4 }}>{code}</T>
      </View>
      <Button title="Share code" onPress={() => Share.share({ message: text }).catch(() => {})} style={{ marginTop: 16 }} />
      <Button title="Copy" variant="grey" onPress={async () => { await Clipboard.setStringAsync(text); setNote("Copied."); }} style={{ marginTop: 10 }} />
      {!!note && <T style={{ color: colors.green, fontFamily: font.semi, marginTop: 8 }}>{note}</T>}
    </Page>
  );
};

export default Referral;
