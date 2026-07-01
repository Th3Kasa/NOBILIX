import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAdsData } from "@/lib/trapman/ads";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const data = await getAdsData();

  return (
    <>
      <PageHeader
        title="Ads"
        description="Ad impression and click analytics."
      />

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
                No ad analytics available yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                <div className="grid grid-cols-3 pb-2 font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Hour</span>
                  <span className="text-right">Closed</span>
                  <span className="text-right">Clicked</span>
                </div>
                {data.rows.map((row) => (
                  <div
                    key={row.hour}
                    className="grid grid-cols-3 py-2 font-mono text-sm"
                  >
                    <span className="text-muted-foreground">{row.hour}</span>
                    <span className="text-right tabular-nums">
                      {row.adsClosed.toLocaleString()}
                    </span>
                    <span className="text-right tabular-nums">
                      {row.adsClicked.toLocaleString()}
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
