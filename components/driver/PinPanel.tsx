import { useState } from "react";

import { Button, Field, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import Card from "./Card";

/** Driver types the rider's 4-digit PIN. `onSubmit` returns false when the PIN is wrong. */
const PinPanel = ({ onSubmit }: { onSubmit: (pin: string) => boolean }) => {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  return (
    <Card>
      <T style={{ fontFamily: font.bold, fontSize: 18 }}>Ask the rider for their PIN</T>
      <Field
        value={pin}
        onChangeText={(v) => {
          setPin(v.replace(/\D/g, "").slice(0, 4));
          setErr("");
        }}
        keyboardType="number-pad"
        placeholder="4-digit PIN"
        style={{ marginTop: 10, height: 58, fontSize: 24, fontFamily: font.bold, letterSpacing: pin ? 8 : 0 }}
      />
      {!!err && <T style={{ color: colors.red, marginTop: 6 }}>{err}</T>}
      <Button
        title="Start trip"
        disabled={pin.length < 4}
        onPress={() => {
          if (onSubmit(pin)) setPin("");
          else setErr("Wrong PIN. Ask the rider to check the PIN on their screen.");
        }}
        style={{ marginTop: 12 }}
      />
    </Card>
  );
};

export default PinPanel;
