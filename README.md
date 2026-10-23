# Routiq (Expo + React Native)

Ride-hailing app (rider and driver). Runs with mock data, so no Clerk, Stripe, Supabase or Google keys are needed.

```bash
npm install
npx expo start            # scan the QR code with the iPhone Camera -> opens in Expo Go
npx expo start --web      # or preview in the browser (use a phone-sized window)
npm run realtime          # optional: live moving vehicles over WebSocket
```

Expo SDK 58. A copy of the old SDK 51 version is in ../uber-backup-sdk51.

Sign in with any 10-digit number and any 4-digit code.

## Screens
Splash, phone/OTP sign-in, Home (Uber / Parcel / Outstation), Services, Activity, Account, Where to, Choose a ride, live trip (search, driver, PIN, trip, rating), Wallet, Safety hub, Inbox, Help, Uber Account.

## UML diagrams
`docs/diagrams.html` holds the activity, class and state chart diagrams (open it in a browser; needs internet for Mermaid CDN).

## Layout
- `app/` routes, `components/` shared UI and SVG map, `store/` Zustand stores, `lib/mock.ts` places, fares and sample data
- `legacy/` the original Ryde code (Clerk/Stripe/Supabase) kept for reference; excluded from TypeScript

## Real sign-in (Google and Apple)

Both are built in. Until they are set up, the app falls back to simulated sign-in pages so demos keep working.

**Apple (iPhone only).** "Continue with Apple" opens Apple's own sheet and uses the Apple ID on the phone. It works in a development, TestFlight or App Store build. Apple sign-in on Android or the web needs a paid Apple Developer account (a Services ID), so those use the simulated page.

**Google (Android, iPhone and web).** Create OAuth client IDs in the Google Cloud console (free):
1. Create a project, then APIs & Services > OAuth consent screen (External; add yourself as a test user).
2. Credentials > Create credentials > OAuth client ID:
   - **Web application**: gives `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - **Android**: package name `com.routiq.app` and the SHA-1 fingerprint of the signing key (`keytool -printcert -jarfile routiq.apk`), gives `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.
   - **iOS**: bundle ID `com.routiq.app`, gives `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
3. Put the IDs in `.env` (copy `.env.example`) for local runs, and add them to the build as EAS environment variables (`eas env:create`) so the APK or IPA includes them. Rebuild the app after changing them.
