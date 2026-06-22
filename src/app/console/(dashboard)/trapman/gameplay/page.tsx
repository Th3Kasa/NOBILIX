import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getGameplayData } from "@/lib/trapman/gameplay";

export const dynamic = "force-dynamic";

export default async function GameplayPage() {
  const data = await getGameplayData();

  return (
    <>
      <PageHeader
        title="Gameplay"
        description="Level distribution and player progression analytics."
      />

      {data.unavailableReason ? (
        <Card className="border-border/60">
          <CardContent className="flex items-start gap-3 p-6">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
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
                    <span className="text-muted-foreground">
                      Level {row.level}
                    </span>
                    <span className="font-medium tabular-nums">
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
