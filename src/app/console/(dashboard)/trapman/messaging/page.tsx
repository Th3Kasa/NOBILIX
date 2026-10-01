import { format } from "date-fns";
import { BellRing, Smartphone, Users } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentCampaigns } from "@/lib/campaigns";
import { getPushReach } from "@/lib/fcm";
import { Compose } from "./compose";

export const dynamic = "force-dynamic";

function audienceLabel(a: { type: string; uid?: string }): string {
  if (a.type === "single") return `Player ${a.uid?.slice(0, 8)}…`;
  if (a.type === "broadcast") return "Everyone";
  return "Segment";
}

function statusVariant(s: string) {
  if (s === "sent") return "success" as const;
  if (s === "failed") return "destructive" as const;
  return "secondary" as const;
}

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>;
}) {
  const [{ uid }, session, campaigns, reach] = await Promise.all([
    searchParams,
    auth(),
    getRecentCampaigns(25),
    getPushReach(),
  ]);
  const canWrite = session?.user?.role !== "viewer";

  const reachPct =
    reach.players > 0 ? Math.round((reach.reachable / reach.players) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Push notifications"
        description="Contact players via Firebase Cloud Messaging."
      />

      {/* How many players can receive a push at all. Without this, "sent to 0
          recipients" reads as a fault when it is almost always just the
          permission rate. */}
      {reach.connected && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Players who can be reached"
            value={reach.reachable}
            icon={BellRing}
            hint={`${reachPct}% of ${reach.players.toLocaleString()} players have allowed notifications`}
          />
          <StatCard
            label="Distinct devices"
            value={reach.devices}
            icon={Smartphone}
            hint={
              reach.reachable > reach.devices
                ? `${reach.reachable - reach.devices} player${reach.reachable - reach.devices === 1 ? " shares a device" : "s share devices"} with another account`
                : "One device per reachable player"
            }
          />
          <StatCard
            label="Players with notifications off"
            value={reach.players - reach.reachable}
            icon={Users}
            hint="No device is stored for them, so nothing can be sent"
          />
        </div>
      )}

      <div className="console-page-grid">
        <div className="console-grid-span-6">
          {canWrite ? (
            <Compose prefillUid={uid} />
          ) : (
            <Card className="console-glass">
              <CardHeader>
                <CardTitle>Compose notification</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your role is read-only. You can view campaign history but cannot
                send notifications.
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="console-glass console-grid-span-6">
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="console-empty-state">
                <p className="relative p-6 text-center text-sm text-muted-foreground">
                  No campaigns sent yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {campaigns.map((c) => (
                  <li key={c.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {c.body}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant(c.status)}
                        className="font-mono uppercase tracking-wide"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span>{audienceLabel(c.audience)}</span>
                      <span className="tabular-nums">
                        {c.recipientCount} device
                        {c.recipientCount === 1 ? "" : "s"}
                      </span>
                      <span className="tabular-nums text-[var(--console-live)]">
                        {c.successCount} ✓
                      </span>
                      {c.failureCount > 0 && (
                        <span className="tabular-nums text-[var(--console-action)]">
                          {c.failureCount} ✗
                        </span>
                      )}
                      <span>
                        {c.createdAt
                          ? format(new Date(c.createdAt), "MMM d, HH:mm")
                          : ""}
                      </span>
                    </div>

                    {/* The reason, not just the count — a campaign that failed
                        because a device was uninstalled needs no action; one
                        that failed on APNs auth means iOS push is broken. */}
                    {c.recipientCount === 0 && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {c.matchedPlayers === 0
                          ? "No players matched this audience."
                          : "Nobody in this audience had notifications turned on, so nothing was sent."}
                      </p>
                    )}
                    {c.failures.length > 0 && (
                      <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        {c.failures.map((f) => (
                          <li key={f.code}>
                            <span className="font-mono tabular-nums">
                              {f.count}×
                            </span>{" "}
                            {f.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
