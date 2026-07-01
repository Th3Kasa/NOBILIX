import { AlertTriangle, Globe2, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { getAnalyticsData } from "./data";
import { CountryDistributionChart, LevelDistributionChart } from "./charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const totalPlayers = data.guestShare.guests + data.guestShare.registered;
  const registeredShare =
    totalPlayers > 0
      ? Math.round((data.guestShare.registered / totalPlayers) * 100)
      : null;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Player distributions derived from the live users collection."
      />

      {!data.connected && (
        <Card className="mb-6 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to Firebase
              </p>
              <p className="text-muted-foreground">
                {data.error ?? "Add service-account credentials to see live analytics."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.connected && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Sampled players" value={data.sampleSize} icon={Users} />
            <StatCard
              label="Countries represented"
              value={data.countries.length}
              icon={Globe2}
              hint={data.sampleSize >= 1000 ? "Capped at first 1,000 docs" : undefined}
            />
            <StatCard
              label="Registered share"
              value={registeredShare != null ? `${registeredShare}%` : "—"}
              icon={TrendingUp}
              hint="Non-guest accounts"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Country distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <CountryDistributionChart countries={data.countries} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Level progress distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <LevelDistributionChart levelBuckets={data.levelBuckets} />
              </CardContent>
            </Card>
          </div>

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
