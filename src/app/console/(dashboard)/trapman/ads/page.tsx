import { Info, MousePointerClick, SquareX, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdsData } from "@/lib/trapman/ads";
import { eventLabel, eventHint } from "@/lib/trapman/labels";
import { getGa4Snapshot } from "../ga4-data";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const [data, ga4] = await Promise.all([getAdsData(), getGa4Snapshot()]);

  return (
    <>
      <PageHeader
        title="Ads"
        description="How players interact with ads, from Google Analytics and the game's database."
      />

      {ga4.connected ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Ads clicked (last 30 days)"
              value={ga4.adClicked30d}
              icon={MousePointerClick}
              hint="Counted by Google Analytics"
            />
            <StatCard
              label="Ads closed (last 30 days)"
              value={ga4.adClosed30d}
              icon={SquareX}
              hint="Counted by Google Analytics"
            />
          </div>
          <Card className="console-glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-[var(--console-violet)]" aria-hidden="true" />
                What players did (last 30 days, Google Analytics)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Google Analytics names events for machines (`user_engagement`,
                  `session_end`). The plain-English name leads and the raw name
                  stays underneath, so this page is readable at a glance and
                  still cross-checkable against GA4 itself. */}
              <ul className="divide-y divide-border">
                {ga4.events.slice(0, 12).map((event) => {
                  const hint = eventHint(event.eventName);
                  return (
                    <li
                      key={event.eventName}
                      className="flex items-start justify-between gap-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {eventLabel(event.eventName)}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {event.eventName}
                        </p>
                        {hint && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {hint}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-sm tabular-nums">
                        {event.count.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="console-empty-state mb-6 rounded-xl border border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
          <div className="relative flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
              <Info className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">Google Analytics unavailable</p>
            <p className="max-w-md text-sm text-muted-foreground">{ga4.error}</p>
          </div>
        </div>
      )}

      {data.unavailableReason ? (
        !ga4.connected && (
          <div className="console-empty-state rounded-xl border border-dashed border-[var(--console-violet-border)] bg-[var(--console-violet-tint)]">
            <div className="relative flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
                <Info className="size-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium">Ad numbers from the game&apos;s database unavailable</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {data.unavailableReason}
              </p>
            </div>
          </div>
        )
      ) : (
        <Card className="console-glass">
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
