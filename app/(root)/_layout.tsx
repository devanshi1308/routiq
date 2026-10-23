import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/store";

export default function Layout() {
  const signedIn = useAuthStore((s) => s.signedIn);
  if (!signedIn) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
