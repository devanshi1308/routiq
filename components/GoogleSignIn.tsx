import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { ReactNode, useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

// Client IDs come from the Google Cloud console (see README, "Real sign-in"). Until they are set, the app keeps its
// simulated Google pages so nothing breaks.
export const GOOGLE_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};
export const GOOGLE_READY = !!(GOOGLE_IDS.webClientId || GOOGLE_IDS.androidClientId || GOOGLE_IDS.iosClientId);

type Props = { onAccount: (name: string, email: string) => void; onError: (msg: string) => void; children: (press: () => void) => ReactNode };

/** Opens Google's own account chooser and returns the signed-in person's name and email. Only mounted when client IDs exist. */
export const GoogleSignIn = ({ onAccount, onError, children }: Props) => {
  const [request, response, prompt] = Google.useAuthRequest({
    webClientId: GOOGLE_IDS.webClientId,
    androidClientId: GOOGLE_IDS.androidClientId ?? GOOGLE_IDS.webClientId,
    iosClientId: GOOGLE_IDS.iosClientId ?? GOOGLE_IDS.webClientId,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const token = response.authentication?.accessToken;
      if (!token) return onError("Google did not return a sign-in token. Try again.");
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((u) => (u.email ? onAccount(u.name || u.email.split("@")[0], u.email) : onError("Google did not share an email address.")))
        .catch(() => onError("Could not read your Google profile. Check your internet and try again."));
    } else if (response.type === "error") onError("Google sign-in did not complete. Try again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return <>{children(() => request && prompt())}</>;
};
