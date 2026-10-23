import { Linking } from "react-native";

import { Place } from "@/lib/mock";

/** Opens Google Maps (the app if installed, otherwise the website) with driving directions to a place. */
export const openGoogleMaps = (to: Place, from?: Place) => {
  const origin = from ? `&origin=${from.latitude},${from.longitude}` : "";
  const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${to.latitude},${to.longitude}&travelmode=driving`;
  return Linking.openURL(url).catch(() => undefined);
};
