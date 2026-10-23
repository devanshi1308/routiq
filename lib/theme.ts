import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

// Appearance: follow the phone (default), or force light / dark. The choice is kept between launches.
export type Mode = "system" | "light" | "dark";

const KEY = "routiq:theme";

export const useThemeStore = create<{ mode: Mode; setMode: (m: Mode) => void }>((set) => ({
  mode: "system",
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(KEY, mode).catch(() => {});
  },
}));

export const loadTheme = async () => {
  try {
    const m = await AsyncStorage.getItem(KEY);
    if (m === "light" || m === "dark" || m === "system") useThemeStore.setState({ mode: m });
  } catch {
    // storage unavailable: stay on "system"
  }
};
