import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import LogoBlueprint from "@/components/LogoBlueprint";
import { useAuthStore } from "@/store";

// Black splash with the circle + square mark, then route on auth state.
const Page = () => {
  const signedIn = useAuthStore((s) => s.signedIn);
  const role = useAuthStore((s) => s.role);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // anyone who is not signed in sees the intro slides first, then the sign-in page
  if (done) return <Redirect href={signedIn ? (role === "driver" ? "/(root)/driver" : "/(root)/(tabs)/home") : ("/(auth)/onboarding" as any)} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <LogoBlueprint logoWidth={300} />
    </View>
  );
};

export default Page;
