import {
  Users,
  UserCheck,
  UserPlus,
  Ghost,
  AlertTriangle,
  Info,
  ShoppingCart,
  BellRing,
  Receipt,
  Activity,
  Gauge,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveStatus } from "@/components/console/live-status";
import { getTrapManOverview, type TrapManOverview } from "@/lib/trapman/overview";
import { getLiveMetrics, type LiveMetrics } from "./live-metrics";
import { getGa4Snapshot, type Ga4Snapshot } from "./ga4-data";
import { getAudRates, convertToAud, formatAud, formatOriginal, type FxRates } from "./fx";

export const dynamic = "force-dynamic";

const FALLBACK_OVERVIEW: TrapManOverview = {
  connected: false,
  totalPlayers: null,
  registeredPlayers: null,
  guestPlayers: null,
  newPlayers7d: null,
  purchases24h: null,
  revenue24h: null,
  adsClosed24h: null,
  adsClicked24h: null,
  unavailable: ["All metrics — panel failed to load"],
};

const FALLBACK_LIVE: LiveMetrics = {
  connected: false,
  pushReachable: 0,
  purchaseCount: 0,
  buyerCount: 0,
  topRevenue: null,
  revenueByCurrency: [],
  maxLevelReached: null,
  avgCompletedLevels: null,
  recentActivity: [],
  latestActivityAt: null,
  error: "Panel failed to load",
};

const FALLBACK_GA4: Ga4Snapshot = {
  connected: false,
  activeUsers1d: 0,
  activeUsers7d: 0,
  activeUsers28d: 0,
  totalUsers30d: 0,
  newUsers7d: 0,
  events: [],
  adClicked30d: 0,
  adClosed30d: 0,
  totalRevenue: 0,
  purchaseRevenue: 0,
  avgSessionSeconds: 0,
  engagedSessions: 0,
  countries: [],
  error: "Panel failed to load",
};

const FALLBACK_FX: FxRates = {
  connected: false,
  audTo: {},
  error: "Panel failed to load",
};

export default async function TrapManOverviewPage() {
  // Each data source is independently fetched from a different backend
  // (Firestore, GA4, an external FX API). Promise.allSettled means one
  // source failing unexpectedly (outside its own internal try/catch) still
  // renders the rest of the page — with that panel's own honest
  // "unavailable" state — instead of crashing the whole overview.
  const [mResult, liveResult, ga4Result, fxResult] = await Promise.allSettled([
    getTrapManOverview(),
    getLiveMetrics(),
    getGa4Snapshot(),
    getAudRates(),
  ]);

  const m = mResult.status === "fulfilled" ? mResult.value : FALLBACK_OVERVIEW;
  const live = liveResult.status === "fulfilled" ? liveResult.value : FALLBACK_LIVE;
  const ga4 = ga4Result.status === "fulfilled" ? ga4Result.value : FALLBACK_GA4;
  const fx = fxResult.status === "fulfilled" ? fxResult.value : FALLBACK_FX;

  // Store revenue (embedded receipts, mixed currencies) converted to AUD.
  let storeRevenueAud: number | null = null;
  if (fx.connected && live.revenueByCurrency.length > 0) {
    let total = 0;
    let allConverted = true;
    for (const { currency, total: amount } of live.revenueByCurrency) {
      const aud = convertToAud(amount, currency, fx);
      if (aud == null) {
        allConverted = false;
        break;
      }
      total += aud;
    }
    if (allConverted) storeRevenueAud = total;
  }

  const ga4RevenueAud =
    fx.connected && ga4.connected
      ? convertToAud(ga4.totalRevenue, "USD", fx)
      : null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <PageHeader
          title="TrapMan — Mission Control"
          description="Live snapshot of the TrapMan player base, straight from Firebase."
        />
        <LiveStatus connected={m.connected} className="shrink-0" />
      </div>

      {/* 1. Connection warning */}
      {!m.connected && (
        <Card className="console-empty-state mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="relative flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to Firebase
              </p>
              <p className="text-muted-foreground">
                Add the service-account credentials to environment variables to
                see live data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Player health metrics */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total players" value={m.totalPlayers} icon={Users} />
        <StatCard
          label="Registered"
          value={m.registeredPlayers}
          icon={UserCheck}
          hint="Non-guest accounts"
        />
        <StatCard label="Guests" value={m.guestPlayers} icon={Ghost} />
        <StatCard
          label="New (7 days)"
          value={ga4.connected ? ga4.newUsers7d : m.newPlayers7d}
          icon={UserPlus}
          hint={ga4.connected ? "GA4 new users" : undefined}
        />
      </div>

      {/* 2b. Behavioural metrics from Google Analytics */}
      {ga4.connected && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active (7 days)"
            value={ga4.activeUsers7d}
            icon={Activity}
            hint={`${ga4.activeUsers28d} over 28 days`}
          />
          <StatCard
            label="GA4 revenue (30d)"
            value={
              ga4RevenueAud != null
                ? formatAud(ga4RevenueAud)
                : formatOriginal(ga4.totalRevenue, "USD")
            }
            icon={Receipt}
            hint={
              ga4RevenueAud != null
                ? `${formatOriginal(ga4.totalRevenue, "USD")} USD · live rate`
                : "USD — FX unavailable"
            }
          />
          <StatCard
            label="Avg session"
            value={
              ga4.avgSessionSeconds > 0
                ? `${Math.floor(ga4.avgSessionSeconds / 60)}m ${Math.round(ga4.avgSessionSeconds % 60)}s`
                : null
            }
            icon={Gauge}
          />
          <StatCard
            label="Engaged sessions (30d)"
            value={ga4.engagedSessions}
            icon={UserCheck}
          />
        </div>
      )}

      {/* 3. Commerce + engagement metrics (live, from confirmed fields) */}
      {live.connected && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Purchases"
            value={live.purchaseCount}
            icon={ShoppingCart}
            hint={
              live.buyerCount > 0
                ? `${live.buyerCount} unique buyer${live.buyerCount === 1 ? "" : "s"}`
                : undefined
            }
          />
          <StatCard
            label="Store revenue (AUD)"
            value={
              storeRevenueAud != null
                ? formatAud(storeRevenueAud)
                : live.topRevenue
                  ? formatOriginal(live.topRevenue.total, live.topRevenue.currency)
                  : null
            }
            icon={Receipt}
            hint={
              storeRevenueAud != null
                ? `Live ECB rate · ${fx.asOf}`
                : live.topRevenue
                  ? "FX unavailable — original currency"
                  : undefined
            }
          />
          <StatCard
            label="Push-reachable"
            value={live.pushReachable}
            icon={BellRing}
            hint="Players with an active FCM token"
          />
          <StatCard
            label="Highest level"
            value={live.maxLevelReached}
            icon={Gauge}
            hint={
              live.avgCompletedLevels != null
                ? `avg ${live.avgCompletedLevels} levels completed`
                : undefined
            }
          />
        </div>
      )}

      {/* 4. Live activity feed from leaderboard events */}
      {live.connected && live.recentActivity.length > 0 && (
        <Card className="console-glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-[var(--console-live)] drop-shadow-[0_0_4px_var(--console-live)]" aria-hidden="true" />
              Latest score submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">Player</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Country</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Score</th>
                    <th scope="col" className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {live.recentActivity.map((entry) => (
                    <tr
                      key={`${entry.username}-${entry.timestamp}`}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="py-2.5 pr-4">{entry.username}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{entry.country ?? "—"}</td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {entry.timestamp ? format(new Date(entry.timestamp), "PP p") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Activity chart region — honest empty state when no data */}
      {!m.connected && (
        <Card className="mb-6">
          <CardContent className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            Activity chart unavailable — Firebase connection required.
          </CardContent>
        </Card>
      )}

      {/* 6. Unavailable data-source panel */}
      {m.unavailable.length > 0 && (
        <Card className="console-empty-state mb-6 border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
          <CardContent className="relative p-4">
            <div className="console-pixel-label mb-3 flex items-center gap-2 text-[var(--console-violet)]">
              <Info className="size-4" aria-hidden="true" />
              Data sources pending verification
            </div>
            <ul className="space-y-1.5">
              {m.unavailable.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--console-violet)]/50" />
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
