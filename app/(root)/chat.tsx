import Ionicons from "@/components/Icon";
import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Row, T, noOutline } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { driverReply, QUICK_REPLIES } from "@/lib/chat";
import { useChatStore, useTripStore } from "@/store";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;

// Rider <-> driver chat. The driver's answers are scripted for the demo.
const Chat = () => {
  const { driver, status, etaSec } = useTripStore();
  const { messages, send, markRead } = useChatStore();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scroll = useRef<any>(null);

  useEffect(() => {
    markRead();
  }, [messages.length, markRead]);
  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [messages.length, typing]);

  if (!driver) return <Redirect href="/(root)/(tabs)/home" />;

  const submit = (msg: string) => {
    const t = msg.trim();
    if (!t) return;
    send("rider", t);
    setText("");
    setTyping(true);
    setTimeout(() => {
      send("driver", driverReply(t, useTripStore.getState().etaSec));
      setTyping(false);
    }, 1300);
  };

  const sub = status === "driver_assigned" ? `Arriving in ${fmt(etaSec)}` : status === "driver_arrived" ? "Arrived at pickup" : status === "in_progress" ? "On trip" : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Row style={{ gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: font.bold, fontSize: 18 }}>{driver.name}</T>
            <T style={{ color: colors.muted, fontSize: 13 }}>{driver.plate.replace(/ /g, "")} • {driver.vehicle}</T>
          </View>
          {!!sub && <T style={{ color: colors.muted, fontSize: 12, fontFamily: font.semi }}>{sub}</T>}
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="call" size={20} color={colors.onInk} />
          </View>
        </Row>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 8 }}>
          <T style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginBottom: 6 }}>Messages are only visible during this trip</T>
          {messages.map((m) => (
            <View key={m.id} style={{ alignSelf: m.from === "rider" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <View style={{ backgroundColor: m.from === "rider" ? colors.ink : colors.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }}>
                <T style={{ color: m.from === "rider" ? colors.onInk : colors.text, fontFamily: font.medium, fontSize: 16 }}>{m.text}</T>
              </View>
              <T style={{ fontSize: 11, color: colors.muted, marginTop: 2, alignSelf: m.from === "rider" ? "flex-end" : "flex-start" }}>{m.time}</T>
            </View>
          ))}
          {typing && (
            <View style={{ alignSelf: "flex-start", backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }}>
              <T style={{ color: colors.muted }}>{driver.name.split(" ")[0]} is typing…</T>
            </View>
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
          {QUICK_REPLIES.map((q) => (
            <Pressable key={q} onPress={() => submit(q)} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, height: 38, justifyContent: "center" }}>
              <T style={{ fontFamily: font.semi, fontSize: 14 }}>{q}</T>
            </Pressable>
          ))}
        </ScrollView>
        <Row style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => submit(text)}
            placeholder="Send a message"
            returnKeyType="send"
            style={{ color: colors.text, flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.card, paddingHorizontal: 18, fontSize: 16, fontFamily: font.medium, ...noOutline } as any}
          />
          <Pressable onPress={() => submit(text)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: text.trim() ? colors.ink : colors.muted, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-up" size={22} color={colors.onInk} />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
