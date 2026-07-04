import { AlertTriangle, Gauge, ListChecks, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGameplayLiveData } from "./live-data";

export const dynamic = "force-dynamic";

export default async function GameplayPage() {
  const data = await getGameplayLiveData();

  // Widest bar in the level chart, for proportional fills.
  const maxBar = data.levels.reduce(
    (m, r) => Math.max(m, r.playersAtLevel, r.playersCompleted),
    0,
  );

  return (
    <>
      <PageHeader
        title="Gameplay"
        description="Level distribution and progression, live from player profiles."
      />

      {!data.connected ? (
        <Card className="border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t reach Firebase: {data.error}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Highest level reached" value={data.maxLevel} icon={Gauge} />
            <StatCard
              label="Avg current level"
              value={data.avgCurrentLevel}
              icon={TrendingUp}
            />
            <StatCard
              label="Avg levels completed"
              value={data.avgCompleted}
              icon={ListChecks}
            />
            <StatCard
              label="Players with progress"
              value={data.playersWithProgress}
              icon={Users}
              hint={`of ${data.sampleSize} sampled`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Level distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.levels.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No level data recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    <span>Level</span>
                    <span>Players currently here</span>
                  </div>
                  {data.levels.map((row) => (
                    <div key={row.level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground">
                          Level {row.level}
                        </span>
                        <span className="font-mono tabular-nums">
                          {row.playersAtLevel.toLocaleString()}
                          {row.playersCompleted > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({row.playersCompleted.toLocaleString()} completed)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[var(--console-violet)]"
                          style={{
                            width:
                              maxBar > 0
                                ? `${Math.round((row.playersAtLevel / maxBar) * 100)}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
