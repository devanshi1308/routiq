import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useConfirm } from "@/components/Confirm";

import Ionicons from "@/components/Icon";
import { Button, Page, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { useRecordingStore } from "@/store/extras";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// On the web a recording is a temporary blob, so keep the audio itself in the saved clip.
const persistUri = async (uri: string) => {
  if (Platform.OS !== "web") return uri;
  try {
    const blob = await (await fetch(uri)).blob();
    return await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
};

const ClipRow = ({ uri, at, sec, onDelete }: { uri: string; at: string; sec: number; onDelete: () => void }) => {
  const player = useAudioPlayer(uri);
  const st = useAudioPlayerStatus(player);
  return (
    <Row style={{ gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable accessibilityRole="button" accessibilityLabel={st.playing ? "Pause" : "Play"} onPress={() => {
          if (st.playing) return player.pause();
          if (st.didJustFinish || st.currentTime >= st.duration - 0.1) player.seekTo(0);
          player.play();
        }} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={st.playing ? "pause-circle" : "play-circle"} size={40} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: font.bold, fontSize: 16 }}>{at}</T>
        <T style={{ color: colors.muted }}>{fmt(sec)}</T>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Delete recording" onPress={onDelete} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="trash-outline" size={22} color={colors.red} />
      </Pressable>
    </Row>
  );
};

const Recording = () => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const { clips, add, remove } = useRecordingStore();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [ask, dialog] = useConfirm();

  const start = async () => {
    setErr("");
    setSaved(false);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return setErr("Microphone permission is needed to record. Allow it in your settings.");
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e: any) {
      setErr(`Could not start recording. ${e?.message ?? ""}`);
    }
  };

  const stop = async () => {
    const sec = state.durationMillis / 1000;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const raw = recorder.uri;
      if (!raw) return setErr("Nothing was recorded.");
      const uri = await persistUri(raw);
      add({ uri, sec, at: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) });
      setSaved(true);
    } catch (e: any) {
      setErr(`Could not save the recording. ${e?.message ?? ""}`);
    }
  };

  const on = state.isRecording;
  return (
    <Page title="Audio recording">
      {dialog}
      <T style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 23 }}>Record the audio of your ride. Clips are saved on this phone, only you can play or delete them.</T>
      <View style={{ alignItems: "center", marginVertical: 30 }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: on ? colors.red : colors.card, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={on ? "stop" : "mic"} size={52} color={on ? "#fff" : colors.text} onPress={on ? stop : start} accessibilityLabel={on ? "Stop recording" : "Start recording"} />
        </View>
        <T style={{ fontFamily: font.extra, fontSize: 34, marginTop: 14 }}>{fmt(state.durationMillis / 1000)}</T>
        <T style={{ color: on ? colors.red : colors.muted, fontFamily: font.semi }}>{on ? "● Recording…" : saved ? "Saved" : "Tap the mic to start"}</T>
      </View>
      {on && <Button title="Stop and save" onPress={stop} />}
      {!!err && <T style={{ color: colors.red, marginTop: 10 }}>{err}</T>}
      <T style={{ fontFamily: font.bold, fontSize: 22, marginTop: 26 }}>Saved recordings</T>
      {clips.length === 0 && <T style={{ color: colors.muted, marginTop: 8 }}>No recordings yet.</T>}
      {clips.map((c) => (
        <ClipRow key={c.id} {...c} onDelete={() => ask({ title: "Delete this recording?", message: "It will be removed from this phone.", confirm: "Delete", destructive: true, onConfirm: () => remove(c.id) })} />
      ))}
    </Page>
  );
};

export default Recording;
