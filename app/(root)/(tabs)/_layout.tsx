import Ionicons from "@/components/Icon";
import { Tabs, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font } from "@/constants/theme";

const icon = (name: string, nameOutline: string, dot?: boolean) =>
  ({ focused, color }: { focused: boolean; color: any }) => (
    <View>
      <Ionicons name={(focused ? name : nameOutline) as any} size={24} color={color} />
      {dot && <View style={{ position: "absolute", top: -2, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blue }} />}
    </View>
  );

// Floating rounded tab bar. Drawn by hand because the built-in one paints a square highlight on phones.
const PillTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 12) + 4,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.bg,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      {state.routes.map((route: any, i: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === i;
        const color = focused ? colors.text : colors.muted;
        const onPress = () => {
          // Tell the navigator a tab was pressed (so other code can react), then always go to the tab by its path.
          // Going by path works on every Expo Router version; calling navigation.navigate directly stopped working on some.
          try {
            const nav = navigation ?? descriptors[route.key]?.navigation;
            const e = nav?.emit?.({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (e?.defaultPrevented) return;
          } catch {}
          if (focused) return;
          router.navigate(`/(root)/(tabs)/${route.name}` as any);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={options.title}
            hitSlop={{ top: 8, bottom: 8 }}
            style={{ flex: 1, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: focused ? colors.card : "transparent" }}
          >
            {options.tabBarIcon?.({ focused, color, size: 24 })}
            <Text style={{ fontFamily: focused ? font.bold : font.semi, fontSize: 12, color, marginTop: 3 }}>{options.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PillTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }} />
      <Tabs.Screen name="services" options={{ title: "Services", tabBarIcon: icon("apps", "apps-outline") }} />
      <Tabs.Screen name="activity" options={{ title: "Activity", tabBarIcon: icon("receipt", "receipt-outline") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("person", "person-outline", true) }} />
    </Tabs>
  );
}
