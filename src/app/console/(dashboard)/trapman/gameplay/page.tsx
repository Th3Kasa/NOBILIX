import { Info, Gauge, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { getGameplayData } from "@/lib/trapman/gameplay";
import { getLiveMetrics } from "../live-metrics";

export const dynamic = "force-dynamic";

export default async function GameplayPage() {
  const [data, live] = await Promise.all([getGameplayData(), getLiveMetrics()]);

  return (
    <>
      <PageHeader
        title="Gameplay"
        description="Level distribution and player progression analytics."
      />

      {live.connected && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Highest level reached"
            value={live.maxLevelReached}
            icon={Gauge}
            hint="Across all sampled players"
          />
          <StatCard
            label="Avg levels completed"
            value={live.avgCompletedLevels}
            icon={ListChecks}
            hint="Per player, from completedLevels"
          />
        </div>
      )}

      {data.unavailableReason ? (
        <Card className="border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
          <CardContent className="flex items-start gap-3 p-6">
            <Info className="mt-0.5 size-4 shrink-0 text-[var(--console-violet)]" />
            <p className="text-sm text-muted-foreground">
              {data.unavailableReason}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {data.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No gameplay data available yet.
              </p>
            ) : (
              <div className="space-y-2">
                {data.rows.map((row) => (
                  <div
                    key={row.level}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-mono text-muted-foreground">
                      Level {row.level}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {row.playerCount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
