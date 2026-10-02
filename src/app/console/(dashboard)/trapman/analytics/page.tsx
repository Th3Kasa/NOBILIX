import { AlertTriangle, Activity, Globe2, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { getAnalyticsData } from "./data";
import { getGa4Snapshot } from "../ga4-data";
import { CountryDistributionChart, LevelDistributionChart } from "./charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [data, ga4] = await Promise.all([getAnalyticsData(), getGa4Snapshot()]);
  const totalPlayers = data.guestShare.guests + data.guestShare.registered;
  const registeredShare =
    totalPlayers > 0
      ? Math.round((data.guestShare.registered / totalPlayers) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How players behave, from Google Analytics and the live player list."
      />

      {ga4.connected && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active app users today"
            value={ga4.activeUsers1d}
            icon={Activity}
            hint="Devices that played · Google Analytics"
          />
          <StatCard
            label="Active app users (last 7 days)"
            value={ga4.activeUsers7d}
            icon={Activity}
          />
          <StatCard
            label="Active app users (last 28 days)"
            value={ga4.activeUsers28d}
            icon={Activity}
          />
          <StatCard
            label="Top country"
            value={ga4.countries[0]?.country ?? null}
            icon={Globe2}
            hint={
              ga4.countries[0]
                ? `${ga4.countries[0].activeUsers} active app users`
                : undefined
            }
          />
        </div>
      )}

      {!data.connected && (
        <Card className="console-empty-state mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="relative flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to the game&apos;s database
              </p>
              <p className="text-muted-foreground">
                {data.error ??
                  "Live analytics will appear once the Firebase connection details are added to the app's environment settings."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.connected && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Players"
              value={data.sampleSize}
              icon={Users}
              hint={data.scanCapped ? "First 1,000 accounts" : "Accounts in the game database"}
            />
            <StatCard
              label="Countries represented"
              value={data.countryCount}
              icon={Globe2}
              hint="From the country on each player profile"
            />
            <StatCard
              label="Signed-up share"
              value={registeredShare != null ? `${registeredShare}%` : "—"}
              icon={TrendingUp}
              hint="Players with an account"
            />
          </div>

          <div className="console-page-grid">
            <Card className="console-glass console-grid-span-6">
              <CardHeader>
                <CardTitle className="text-base">Country distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <CountryDistributionChart countries={data.countries} />
              </CardContent>
            </Card>

            <Card className="console-glass console-grid-span-6">
              <CardHeader>
                <CardTitle className="text-base">Furthest level reached</CardTitle>
              </CardHeader>
              <CardContent>
                <LevelDistributionChart levelBuckets={data.levelBuckets} />
              </CardContent>
            </Card>
          </div>

          {ga4.connected && ga4.countries.length > 0 && (
            <Card className="console-glass mt-4">
              <CardHeader>
                <CardTitle className="text-base">
                  Active app users by country (Google Analytics, last 30 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {ga4.countries.map((c) => (
                    <div
                      key={c.country}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span>{c.country}</span>
                      <span className="font-mono tabular-nums">
                        {c.activeUsers.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Google Analytics works out the country from the device&apos;s
                  internet connection; the chart above uses the country saved
                  on the player profile — small differences are expected.
                </p>
              </CardContent>
            </Card>
          )}

          {data.sampleSize > 0 && data.sampleSize < 20 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Sample size is small ({data.sampleSize} player
              {data.sampleSize === 1 ? "" : "s"}) — distributions will firm up
              as the player base grows.
            </p>
          )}
        </>
      )}
    </>
  );
}
