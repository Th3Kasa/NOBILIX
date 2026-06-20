import { format } from "date-fns";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentCampaigns } from "@/lib/campaigns";
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
  const [{ uid }, session] = await Promise.all([searchParams, auth()]);
  const canWrite = session?.user?.role !== "viewer";
  const campaigns = await getRecentCampaigns(25);

  return (
    <>
      <PageHeader
        title="Push notifications"
        description="Contact players via Firebase Cloud Messaging."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {canWrite ? (
          <Compose prefillUid={uid} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Compose notification</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your role is read-only. You can view campaign history but cannot
              send notifications.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No campaigns sent yet.
              </p>
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
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{audienceLabel(c.audience)}</span>
                      <span>{c.recipientCount} recipients</span>
                      <span className="text-success">{c.successCount} ✓</span>
                      {c.failureCount > 0 && (
                        <span className="text-destructive">
                          {c.failureCount} ✗
                        </span>
                      )}
                      <span>
                        {c.createdAt
                          ? format(new Date(c.createdAt), "MMM d, HH:mm")
                          : ""}
                      </span>
                    </div>
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
