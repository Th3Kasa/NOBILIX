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
        <div className="console-empty-state rounded-xl border border-dashed border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
          <div className="relative flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
              <Info className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">Gameplay analytics unavailable</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {data.unavailableReason}
            </p>
          </div>
        </div>
      ) : (
        <Card className="console-glass">
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
