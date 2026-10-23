import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, H1, H2, Header, Row, T } from "@/components/ui";
import { colors, font } from "@/constants/theme";
import { funnel, SCHEMAS, useAnalytics } from "@/lib/analytics";
import { useRealtime } from "@/lib/realtime";
import { useCacheStats } from "@/lib/cache";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

const Data = () => {
  const { queue, batches, dropped, session } = useAnalytics();
  const f = funnel(batches, queue);
  const cache = useCacheStats();
  const rt = useRealtime();
  const steps: [string, number][] = [["Shown", f.shown], ["Clicked", f.clicked], ["Booked", f.booked], ["Completed", f.completed]];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <H1 style={{ fontSize: 28 }}>Data pipeline</H1>
        <T style={{ color: colors.muted, marginTop: 6 }}>
          App → client queue → batch every 5 s → backend → Kafka → data lake. Session {session}.
        </T>

        <H2 style={{ marginTop: 24 }}>Shortcut funnel</H2>
        <T style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>Recent-place shortcuts shown on Home vs. what riders did with them.</T>
        <Row style={{ gap: 8 }}>
          {steps.map(([l, v], i) => (
            <View key={l} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
              <T style={{ fontFamily: font.extra, fontSize: 24 }}>{v}</T>
              <T style={{ fontSize: 12 }}>{l}</T>
              <T style={{ fontSize: 11, color: colors.muted }}>{i ? pct(v, steps[i - 1][1]) : ""}</T>
            </View>
          ))}
        </Row>

        <Row style={{ gap: 8, marginTop: 16 }}>
          {[["Queued", queue.length], ["Batches sent", batches.length], ["Dropped (no schema)", dropped]].map(([l, v]) => (
            <View key={l as string} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>{v}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>{l}</T>
            </View>
          ))}
        </Row>

        <H2 style={{ marginTop: 24 }}>Recent batches</H2>
        {batches.length === 0 && <T style={{ color: colors.muted, marginTop: 6 }}>Nothing sent yet. Use the app and check back in a few seconds.</T>}
        {batches.slice(0, 6).map((b) => (
          <View key={b.no} style={{ marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
            <T style={{ fontFamily: font.bold }}>Batch {b.no} · {b.events.length} events · {new Date(b.sentAt).toLocaleTimeString("en-IN")}</T>
            {b.events.slice(0, 6).map((e) => (
              <T key={e.id} style={{ fontSize: 12, color: "#444", marginTop: 2 }}>
                {e.name} <T style={{ color: colors.muted, fontSize: 12 }}>[{e.meta.screen}] {JSON.stringify(e.payload).slice(0, 70)}</T>
              </T>
            ))}
          </View>
        ))}

        <H2 style={{ marginTop: 24 }}>Live updates (WebSocket)</H2>
        <T style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          Status: <T style={{ fontFamily: font.bold, color: rt.connected ? colors.green : colors.red }}>{rt.connected ? "connected" : "offline, using simulated fleet"}</T> · {rt.vehicles.length} vehicles · {rt.messages} updates received. Start the server with "npm run realtime".
        </T>

        <H2 style={{ marginTop: 24 }}>Route and search cache</H2>
        <T style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          Least-recently-used cache + token-bucket rate limiter in front of the free map services.
        </T>
        <Row style={{ gap: 8, marginTop: 8 }}>
          {[["Cache hits", cache.hits], ["Misses", cache.misses], ["Throttled", cache.throttled]].map(([l, v]) => (
            <View key={l as string} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
              <T style={{ fontFamily: font.bold, fontSize: 20 }}>{v}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>{l}</T>
            </View>
          ))}
        </Row>

        <H2 style={{ marginTop: 24 }}>Registered event schemas</H2>
        <T style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
          Events missing a registered schema or required fields are dropped.{"\n"}
          {Object.entries(SCHEMAS).map(([k, v]) => `${k}(${v.join(", ")})`).join("\n")}
        </T>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Data;
