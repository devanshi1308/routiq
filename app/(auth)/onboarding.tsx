import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Logo from "@/components/Logo";
import Ionicons from "@/components/Icon";
import { T } from "@/components/ui";
import { font } from "@/constants/theme";
import { setFlag } from "@/lib/persist";

// Each slide's background is the colour of its picture, so the picture reads as part of the screen.
const SLIDES = [
  { img: require("../../assets/onboarding/auto.webp"), ratio: 750 / 1000, bg: "#FFFFFF", top: "#FFFFFF", at: "bottom", title: "Get a ride to your destination easily", body: "Pick where you're going, choose a ride and a driver is on the way in minutes." },
  { img: require("../../assets/onboarding/city.webp"), ratio: 601 / 1198, bg: "#8BD9C1", top: "#F0F0F0", at: "top", title: "Seamless navigation for every trip", body: "Shortest route by default. Choose another when you're in a hurry." },
  { img: require("../../assets/onboarding/chat.webp"), ratio: 480 / 474, bg: "#8ADAC1", top: "#8ADAC1", at: "bottom", title: "Track your ride, share your trip", body: "Watch your driver arrive, chat, share with family and rate every ride." },
] as const;

// Shown once, the first time the app opens. Pictures slide at a different speed from the text.
const Onboarding = () => {
  const { width, height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const list = useRef<FlatList>(null);
  const last = index === SLIDES.length - 1;
  const HEAD = inset.top + 64;

  const finish = async () => {
    await setFlag("onboarded");
    router.replace("/(auth)/welcome");
  };
  const next = () => {
    if (last) return finish();
    list.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: SLIDES[index].bg }}>
      <Animated.FlatList
        ref={list as any}
        data={SLIDES as any}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s: any) => s.title}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }: any) => {
          const imgH = width * item.ratio;
          // picture drifts and fades as it leaves; the text moves the other way
          const range = [(i - 1) * width, i * width, (i + 1) * width];
          const imgX = x.interpolate({ inputRange: range, outputRange: [width * 0.35, 0, -width * 0.35] });
          const txtX = x.interpolate({ inputRange: range, outputRange: [-width * 0.2, 0, width * 0.2] });
          const fade = x.interpolate({ inputRange: range, outputRange: [0, 1, 0] });
          return (
            <View style={{ width, height, backgroundColor: item.bg }}>
              {item.at === "top" && <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: HEAD + imgH, backgroundColor: item.top }} />}
              <Animated.Image
                source={item.img}
                style={{ position: "absolute", width, height: imgH, left: 0, ...(item.at === "top" ? { top: HEAD } : { bottom: 0 }), opacity: fade, transform: [{ translateX: imgX }, { scale: x.interpolate({ inputRange: range, outputRange: [0.9, 1, 0.9] }) }] }}
                resizeMode="cover"
              />
              <Animated.View style={{ position: "absolute", left: 28, right: 28, opacity: fade, transform: [{ translateX: txtX }], ...(item.at === "top" ? { top: HEAD + imgH + 28 } : { top: HEAD + 20 }) }}>
                <T style={{ fontFamily: font.extra, fontSize: 30, lineHeight: 36, color: "#000" }}>{item.title}</T>
                <T style={{ fontSize: 17, lineHeight: 25, marginTop: 12, color: "#222" }}>{item.body}</T>
              </Animated.View>
            </View>
          );
        }}
      />
      <View style={{ position: "absolute", top: inset.top + 10, left: 24, right: 24, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Logo width={34} mark tone="black" />
        <View style={{ flexDirection: "row", gap: 6 }}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={{ width: i === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? "#000" : "rgba(0,0,0,0.25)" }} />
          ))}
        </View>
        <T onPress={finish} style={{ fontFamily: font.bold, fontSize: 16, color: "#000", opacity: last ? 0 : 1, padding: 6 }}>Skip</T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={last ? "Get started" : "Next"}
        onPress={next}
        style={{ position: "absolute", left: 24, bottom: inset.bottom + 24, minWidth: 64, height: 64, borderRadius: 32, backgroundColor: "#000", borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: last ? 22 : 0, gap: 8 }}
      >
        {last && <T style={{ color: "#fff", fontFamily: font.bold, fontSize: 17 }}>Get started</T>}
        <Ionicons name="arrow-forward" size={26} color="#fff" />
      </Pressable>
    </View>
  );
};

export default Onboarding;
