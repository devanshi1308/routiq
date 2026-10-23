import AsyncStorage from "@react-native-async-storage/async-storage";

// Small on-device flags (kept between app launches): has the rider seen onboarding, been asked for location, etc.
export type Flag = "onboarded" | "askedLocation";

const key = (f: Flag) => `routiq:${f}`;

export const getFlag = async (f: Flag): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(key(f))) === "1";
  } catch {
    return false;
  }
};

export const setFlag = async (f: Flag) => {
  try {
    await AsyncStorage.setItem(key(f), "1");
  } catch {
    // storage unavailable (private window): the screen simply shows again next time
  }
};

export const clearFlags = async () => {
  try {
    await AsyncStorage.multiRemove([key("onboarded"), key("askedLocation")]);
  } catch {}
};
