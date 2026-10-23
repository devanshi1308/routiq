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
