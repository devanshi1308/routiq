import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Switch, View } from "react-native";

import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useIntegrity } from "@/lib/integrity";
import { clearFlags } from "@/lib/persist";
import { useAuthStore } from "@/store";
import { useSafetyStore } from "@/store/extras";

// One page for each row under Security and Privacy & Data in Routiq Account.
const AccountDetail = () => {
  const { k = "" } = useLocalSearchParams<{ k?: string }>();
  const { twoStep, passkey, setFlag } = useSafetyStore();
  const { email, signOut } = useAuthStore();
  const [done, setDone] = useState("");
  const [confirm, setConfirm] = useState(false);

  const toggle = (label: string, desc: string, on: boolean, set: (v: boolean) => void) => (
    <>
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>{desc}</T>
      <Row style={{ marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.card }}>
        <T style={{ flex: 1, fontFamily: font.bold, fontSize: 18 }}>{label}</T>
        <Switch value={on} onValueChange={set} />
      </Row>
      <T style={{ color: on ? colors.green : colors.muted, marginTop: 10, fontFamily: font.semi }}>{on ? "On" : "Off"}</T>
    </>
  );
  const info = (text: string) => <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 24 }}>{text}</T>;

  let body: React.ReactNode;
  if (k === "Passkeys") body = toggle("Use a passkey", "Sign in with your phone's fingerprint or face instead of a code.", passkey, (v) => setFlag("passkey", v));
  else if (k === "2-step verification") body = toggle("2-step verification", "Routiq asks for a code when you sign in on a new phone.", twoStep, (v) => setFlag("twoStep", v));
  else if (k === "Login with Google")
    body = (
      <>
        {info(email ? `Your Google account ${email} can be used to sign in.` : "No Google account is linked. Sign in with Google from the sign-in page to link one.")}
        {!!email && <Button title="Unlink Google" variant="outline" onPress={() => { useAuthStore.setState({ email: "" }); setDone("Google account unlinked."); }} style={{ marginTop: 20 }} />}
      </>
    );
  else if (k === "Connected apps" || k === "Third-party apps with account access") body = info("No apps have access to your Routiq account.");
  else if (k === "Privacy Center")
    body = info("We use your location only while you ride or search for pickups. Your trips, saved places and recordings are stored on this phone. We never sell your personal information. You can download or delete your data any time from this section.");
  else if (k === "Download your data")
    body = (
      <>
        {info("We prepare a copy of your trips, saved places and wallet history and send it to your email.")}
        <Button title="Request my data" onPress={() => setDone(email ? `We will email your data to ${email} within 24 hours.` : "Add an email in Account checkup first, then request again.")} style={{ marginTop: 20 }} />
      </>
    );
  else if (k === "Delete your account")
    body = (
      <>
        {info("This removes your account, trips, saved places and wallet balance from this phone. It cannot be undone.")}
        {!confirm ? (
          <Button title="Delete my account" variant="outline" onPress={() => setConfirm(true)} style={{ marginTop: 20 }} />
        ) : (
          <>
            <T style={{ color: colors.red, fontFamily: font.bold, marginTop: 20 }}>Are you sure?</T>
            <Button
              title="Yes, delete everything"
              onPress={async () => {
                await clearFlags();
                useIntegrity.getState().reset();
                signOut();
                router.replace("/" as any);
              }}
              style={{ marginTop: 10, backgroundColor: colors.red }}
            />
            <Button title="Keep my account" variant="grey" onPress={() => setConfirm(false)} style={{ marginTop: 10 }} />
          </>
        )}
      </>
    );
  else body = info("Nothing to show here.");

  return (
    <Page title={k}>
      {body}
      {!!done && <T style={{ color: colors.green, fontFamily: font.semi, marginTop: 16 }}>{done}</T>}
    </Page>
  );
};

export default AccountDetail;
