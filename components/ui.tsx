import Ionicons from "@/components/Icon";
import { router } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextProps, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, font } from "@/constants/theme";
import { useAuthStore } from "@/store";

/** the browser draws a focus ring on text boxes; this removes it on web only (outlineStyle is not valid on phones) */
export const noOutline: any = Platform.OS === "web" ? { outlineStyle: "none" } : {};

export const T = ({ style, ...p }: TextProps) => <Text {...p} style={[{ fontFamily: font.regular, color: colors.text }, style]} />;

export const H1 = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <T style={[{ fontFamily: font.extra, fontSize: 32 }, style]}>{children}</T>
);

export const H2 = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <T style={[{ fontFamily: font.bold, fontSize: 20 }, style]}>{children}</T>
);

export const Button = ({
  title,
  onPress,
  variant = "black",
  style,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: "black" | "grey" | "outline";
  style?: ViewStyle;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      mk().btn,
      variant === "black" && { backgroundColor: colors.ink },
      variant === "grey" && { backgroundColor: colors.card },
      variant === "outline" && { borderWidth: 1, borderColor: colors.border },
      (pressed || disabled) && { opacity: 0.6 },
      style,
    ]}
  >
    <T style={{ fontFamily: font.bold, fontSize: 17, color: variant === "black" ? colors.onInk : colors.text }}>{title}</T>
  </Pressable>
);

export const IconCircle = ({ name, onPress, size = 40, label }: { name: any; onPress?: () => void; size?: number; label?: string }) => (
  // hitSlop keeps the touch area at least 44x44 and the label lets screen readers name an icon-only button
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label ?? String(name).replace(/-outline$/, "").replace(/-/g, " ")} hitSlop={Math.max(0, (44 - size) / 2)} style={[mk().circle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Ionicons name={name} size={size * 0.5} color={colors.text} />
  </Pressable>
);

export const Header = ({ title }: { title?: string }) => (
  <View style={mk().header}>
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(useAuthStore.getState().role === "driver" ? "/(root)/driver" : "/(root)/(tabs)/home"))} hitSlop={12}>
      <Ionicons name="close" size={28} color={colors.text} />
    </Pressable>
    {title ? <T style={{ fontFamily: font.bold, fontSize: 17 }}>{title}</T> : null}
    <View style={{ width: 28 }} />
  </View>
);

export const Skeleton = ({ h, w = "100%", r = 12, style }: { h: number; w?: any; r?: number; style?: any }) => (
  <View style={[{ height: h, width: w, borderRadius: r, backgroundColor: colors.skeleton }, style]} />
);

export const Row = ({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={[{ flexDirection: "row", alignItems: "center" }, style]}>
    {children}
  </Pressable>
);

const mk = () => StyleSheet.create({
  btn: { height: 54, borderRadius: 10, alignItems: "center", justifyContent: "center", width: "100%" },
  circle: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
});

/** Text box that follows the light / dark theme */
export const Field = (p: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    placeholderTextColor={colors.muted}
    {...p}
    style={[{ color: colors.text, letterSpacing: 0, height: 54, borderRadius: 10, backgroundColor: colors.card, paddingHorizontal: 16, fontSize: 17, fontFamily: font.medium, ...noOutline }, p.style] as any}
  />
);

/** Header with a back arrow, a title and the page body in a scroll view */
export const Page = ({ title, children, art }: { title: string; children: React.ReactNode; art?: any }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <Header />
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <H1>{title}</H1>
      {art && <Image source={art} resizeMode="cover" style={{ width: "100%", aspectRatio: 346 / 194, borderRadius: 22, marginTop: 14 }} accessibilityIgnoresInvertColors />}
      {children}
    </ScrollView>
  </SafeAreaView>
);
