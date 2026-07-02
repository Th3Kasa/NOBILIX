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
import { getTrapManOverview } from "@/lib/trapman/overview";
import { getLiveMetrics } from "./live-metrics";
import { getGa4Snapshot } from "./ga4-data";

export const dynamic = "force-dynamic";

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default async function TrapManOverviewPage() {
  const [m, live, ga4] = await Promise.all([
    getTrapManOverview(),
    getLiveMetrics(),
    getGa4Snapshot(),
  ]);

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
        <Card className="mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
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
            value={money(ga4.totalRevenue, "USD")}
            icon={Receipt}
            hint="USD-normalised by Google"
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
            label={live.topRevenue ? `Revenue (${live.topRevenue.currency})` : "Revenue"}
            value={live.topRevenue ? money(live.topRevenue.total, live.topRevenue.currency) : null}
            icon={Receipt}
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-[var(--console-live)]" aria-hidden="true" />
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
        <Card className="mb-6 border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-sm font-medium uppercase tracking-wide text-[var(--console-violet)]">
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
