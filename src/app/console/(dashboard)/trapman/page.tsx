import type { ReactNode } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Ghost,
  AlertTriangle,
  ShoppingCart,
  BellRing,
  Receipt,
  Activity,
  Gauge,
} from "lucide-react";
import { format } from "date-fns";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveStatus } from "@/components/console/live-status";
import { getAdminById } from "@/lib/admins";
import { getTrapManOverview, type TrapManOverview } from "@/lib/trapman/overview";
import { getLiveMetrics, type LiveMetrics } from "./live-metrics";
import { getGa4Snapshot, type Ga4Snapshot } from "./ga4-data";
import { getAudRates, convertToAud, formatAud, formatOriginal, type FxRates } from "./fx";
import { getOverviewWidget, resolveOverviewLayout } from "./overview-widgets";
import { CustomizeOverview } from "./customize-overview";

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
  const [mResult, liveResult, ga4Result, fxResult, session] =
    await Promise.allSettled([
      getTrapManOverview(),
      getLiveMetrics(),
      getGa4Snapshot(),
      getAudRates(),
      auth(),
    ]);

  const m = mResult.status === "fulfilled" ? mResult.value : FALLBACK_OVERVIEW;
  const live = liveResult.status === "fulfilled" ? liveResult.value : FALLBACK_LIVE;
  const ga4 = ga4Result.status === "fulfilled" ? ga4Result.value : FALLBACK_GA4;
  const fx = fxResult.status === "fulfilled" ? fxResult.value : FALLBACK_FX;

  // Every admin arranges their own overview; the layout lives on their
  // admin record and only ever changes for them.
  const adminId =
    session.status === "fulfilled" ? session.value?.user?.id : undefined;
  const admin = adminId ? await getAdminById(adminId).catch(() => null) : null;
  const { order, hidden } = resolveOverviewLayout(admin?.overviewPrefs);

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

  // One node per registry widget. A null node means the widget has nothing
  // to show right now (its data source is not connected) and is skipped —
  // the same conditions the old hard-coded sections used.
  const widgetNodes: Record<string, ReactNode | null> = {
    "players-total": (
      <StatCard key="players-total" label="Total players" value={m.totalPlayers} icon={Users} />
    ),
    "players-registered": (
      <StatCard
        key="players-registered"
        label="Signed-up players"
        value={m.registeredPlayers}
        icon={UserCheck}
        hint="Players with an account"
      />
    ),
    "players-guests": (
      <StatCard key="players-guests" label="Guest players" value={m.guestPlayers} icon={Ghost} />
    ),
    "players-new-7d": (
      <StatCard
        key="players-new-7d"
        label="New players (last 7 days)"
        value={ga4.connected ? ga4.newUsers7d : m.newPlayers7d}
        icon={UserPlus}
        hint={ga4.connected ? "Counted by Google Analytics" : undefined}
      />
    ),
    "ga4-active-7d": ga4.connected ? (
      <StatCard
        key="ga4-active-7d"
        label="Active players (last 7 days)"
        value={ga4.activeUsers7d}
        icon={Activity}
        hint={`${ga4.activeUsers28d} in the last 28 days`}
      />
    ) : null,
    "ga4-revenue-30d": ga4.connected ? (
      <StatCard
        key="ga4-revenue-30d"
        label="Google Analytics revenue (last 30 days)"
        value={
          ga4RevenueAud != null
            ? formatAud(ga4RevenueAud)
            : formatOriginal(ga4.totalRevenue, "USD")
        }
        icon={Receipt}
        hint={
          ga4RevenueAud != null
            ? `${formatOriginal(ga4.totalRevenue, "USD")} USD · converted at the live exchange rate`
            : "In US dollars — exchange rate unavailable"
        }
      />
    ) : null,
    "ga4-avg-session": ga4.connected ? (
      <StatCard
        key="ga4-avg-session"
        label="Average session length"
        value={
          ga4.avgSessionSeconds > 0
            ? `${Math.floor(ga4.avgSessionSeconds / 60)}m ${Math.round(ga4.avgSessionSeconds % 60)}s`
            : null
        }
        icon={Gauge}
      />
    ) : null,
    "ga4-engaged-sessions": ga4.connected ? (
      <StatCard
        key="ga4-engaged-sessions"
        label="Meaningful play sessions (last 30 days)"
        value={ga4.engagedSessions}
        icon={UserCheck}
      />
    ) : null,
    "store-purchases": live.connected ? (
      <StatCard
        key="store-purchases"
        label="Store purchases"
        value={live.purchaseCount}
        icon={ShoppingCart}
        hint={
          live.buyerCount > 0
            ? `${live.buyerCount} unique buyer${live.buyerCount === 1 ? "" : "s"}`
            : undefined
        }
      />
    ) : null,
    "store-revenue-aud": live.connected ? (
      <StatCard
        key="store-revenue-aud"
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
            ? `Converted at today's exchange rate · ${fx.asOf}`
            : live.topRevenue
              ? "Exchange rate unavailable — shown in the original currency"
              : undefined
        }
      />
    ) : null,
    "push-reachable": live.connected ? (
      <StatCard
        key="push-reachable"
        label="Players we can notify"
        value={live.pushReachable}
        icon={BellRing}
        hint="Have notifications turned on"
      />
    ) : null,
    "top-level": live.connected ? (
      <StatCard
        key="top-level"
        label="Highest level reached"
        value={live.maxLevelReached}
        icon={Gauge}
        hint={
          live.avgCompletedLevels != null
            ? `A typical player finishes ${live.avgCompletedLevels} levels`
            : undefined
        }
      />
    ) : null,
    "latest-scores":
      live.connected && live.recentActivity.length > 0 ? (
        <Card key="latest-scores" className="console-glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-[var(--console-live)] drop-shadow-[0_0_4px_var(--console-live)]" aria-hidden="true" />
              Latest scores coming in
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
      ) : null,
    "revenue-note":
      live.connected || ga4.connected ? (
        <p key="revenue-note" className="mb-6 text-xs text-muted-foreground">
          We show two revenue numbers on purpose:{" "}
          <strong className="text-foreground">Store revenue</strong> adds up
          the purchase receipts saved on player profiles, while{" "}
          <strong className="text-foreground">Google Analytics revenue</strong>{" "}
          is what Google measured over the last 30 days. They come from
          different sources, so they will rarely match exactly.
        </p>
      ) : null,
  };

  // Walk the admin's order, batching consecutive stat cards into the
  // responsive grid so drag-reordering can cross old section boundaries
  // without ever breaking the layout.
  const sections: ReactNode[] = [];
  let statChunk: ReactNode[] = [];
  const flushStats = () => {
    if (statChunk.length === 0) return;
    sections.push(
      <div
        key={`stat-group-${sections.length}`}
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statChunk}
      </div>,
    );
    statChunk = [];
  };
  for (const id of order) {
    if (hidden.has(id)) continue;
    const node = widgetNodes[id];
    if (node == null) continue;
    if (getOverviewWidget(id)?.kind === "stat") {
      statChunk.push(node);
    } else {
      flushStats();
      sections.push(node);
    }
  }
  flushStats();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <PageHeader
          title="TrapMan — Mission Control"
          description="A live picture of your players, updated straight from the game's database."
        />
        <div className="flex shrink-0 items-center gap-2">
          <CustomizeOverview order={order} hidden={[...hidden]} />
          <LiveStatus connected={m.connected} />
        </div>
      </div>

      {/* Connection warning — always shown when disconnected, not a widget. */}
      {!m.connected && (
        <Card className="console-empty-state mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="relative flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to the game&apos;s database
              </p>
              <p className="text-muted-foreground">
                Live data will appear once the Firebase connection details are
                added to the app&apos;s environment settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {sections}

      {/* Chart region — honest empty state when no data, not a widget. */}
      {!m.connected && (
        <Card className="mb-6">
          <CardContent className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            Activity chart unavailable — connect the game&apos;s database first.
          </CardContent>
        </Card>
      )}
    </>
  );
}
