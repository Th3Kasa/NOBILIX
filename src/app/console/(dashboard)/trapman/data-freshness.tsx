import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalTime } from "@/components/console/local-time";
import { getAppleSales } from "@/lib/trapman/app-store-connect";
import { getPlaySales } from "@/lib/trapman/play-reports";
import { getPlayerScan } from "@/lib/trapman/player-scan";
import { getSyncStatus, type SourceSyncResult } from "@/lib/trapman/sync-status";
import { LIVE_REFRESH, nextDailyRefresh } from "@/lib/trapman/refresh-schedule";
import { getGa4Snapshot } from "./ga4-data";

/**
 * How current each data source is, and when it next updates.
 *
 * The game's database and Google Analytics are read live; Apple and Google
 * Play publish daily reports, which the daily job pulls in. Without this an
 * operator comparing the console with App Store Connect has no way to tell a
 * wrong number from one that is simply a day older.
 *
 * Every read here is already cached by the page that shows it, so the panel
 * costs nothing extra.
 */

/** "2026-10-25" → "25 Oct". Dates, unlike times, need no timezone shift. */
function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * The next daily refresh, read off the clock outside the render pass — the
 * same reason purchases/range.ts resolves its window asynchronously.
 */
async function nextRefreshNow(): Promise<number> {
  return nextDailyRefresh(Date.now());
}

function Source({
  name,
  badge,
  children,
}: {
  name: string;
  badge: { label: string; tone: "live" | "daily" | "warn" };
  children: ReactNode;
}) {
  const tone =
    badge.tone === "live"
      ? "border-[var(--console-live-border)] bg-[var(--console-live-tint)] text-[var(--console-live)]"
      : badge.tone === "warn"
        ? "border-[var(--console-action-border)] bg-[var(--console-action-tint)] text-[var(--console-action)]"
        : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="font-medium">{name}</p>
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tone}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="space-y-0.5 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

function DailyRefreshLines({
  ranAt,
  result,
  next,
}: {
  ranAt: number | null;
  result: SourceSyncResult | null;
  next: number;
}) {
  return (
    <>
      {ranAt ? (
        <p>
          Last refreshed <LocalTime ms={ranAt} />
          {result && !result.ok && result.error ? (
            <span className="block text-[var(--console-action)]">{result.error}</span>
          ) : null}
        </p>
      ) : (
        <p className="text-[var(--console-action)]">
          The daily refresh hasn&apos;t run yet — it needs CRON_SECRET set in
          Vercel. Until then this updates when the page is opened.
        </p>
      )}
      <p>
        Next refresh <LocalTime ms={next} withRelative />
      </p>
    </>
  );
}

export async function DataFreshness({ className }: { className?: string }) {
  const [apple, play, ga4, scan, sync, next] = await Promise.all([
    getAppleSales(30),
    getPlaySales(),
    getGa4Snapshot(),
    getPlayerScan(),
    getSyncStatus(),
    nextRefreshNow(),
  ]);
  const playLatestSale = shortDate(play.latestSaleDate);
  const playLatestInstalls = shortDate(play.installs?.latestDate);
  const playLatestPayout = play.earnings[0]?.month;

  return (
    <Card className={`console-glass ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-[var(--console-violet)]" aria-hidden="true" />
          How up to date is this?
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-0 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <Source
          name="Game database (Firebase)"
          badge={scan.connected ? { label: "Live", tone: "live" } : { label: "Offline", tone: "warn" }}
        >
          <p>
            Players, purchases and scores, re-read every{" "}
            {LIVE_REFRESH.firestoreSeconds / 60} minutes.
          </p>
          {scan.connected && (
            <p>
              Last read <LocalTime ms={scan.scannedAt} />
            </p>
          )}
        </Source>

        <Source
          name="Google Analytics (Firebase)"
          badge={ga4.connected ? { label: "Live", tone: "live" } : { label: "Offline", tone: "warn" }}
        >
          <p>
            Re-read every minute. Google takes 24–48 hours to finalise a day, so
            yesterday&apos;s and today&apos;s figures can still rise — as they
            do in the Firebase console.
          </p>
          {ga4.connected && ga4.fetchedAt > 0 && (
            <p>
              Last read <LocalTime ms={ga4.fetchedAt} />
            </p>
          )}
        </Source>

        <Source
          name="App Store"
          badge={
            !apple.configured
              ? { label: "Not connected", tone: "warn" }
              : { label: "Daily", tone: "daily" }
          }
        >
          <p>
            Apple publishes each day&apos;s sales the next morning, California
            time.{" "}
            {apple.latestReportDate
              ? `Sales up to ${shortDate(apple.latestReportDate)}.`
              : null}
          </p>
          <DailyRefreshLines ranAt={sync?.ranAt ?? null} result={sync?.apple ?? null} next={next} />
        </Source>

        <Source
          name="Google Play"
          badge={
            !play.configured
              ? { label: "Not connected", tone: "warn" }
              : { label: "Daily", tone: "daily" }
          }
        >
          <p>
            Google&apos;s reports run 2–7 days behind.
            {playLatestSale ? ` Sales up to ${playLatestSale}` : ""}
            {playLatestInstalls ? `, installs up to ${playLatestInstalls}` : ""}
            {playLatestSale || playLatestInstalls ? "." : ""} Payouts arrive
            early the following month
            {playLatestPayout
              ? ` (latest: ${new Date(Date.UTC(Number(playLatestPayout.slice(0, 4)), Number(playLatestPayout.slice(4)) - 1, 1)).toLocaleDateString("en-AU", { month: "long", timeZone: "UTC" })})`
              : ""}
            .
          </p>
          <DailyRefreshLines ranAt={sync?.ranAt ?? null} result={sync?.play ?? null} next={next} />
        </Source>
      </CardContent>
    </Card>
  );
}
