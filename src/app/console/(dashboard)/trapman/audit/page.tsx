import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentAudit } from "@/lib/audit";
import { AuditFilter } from "./audit-filter";

export const dynamic = "force-dynamic";

// Raised from 150: still one Firestore query, filtered in memory below, but
// honestly disclosed as a cap rather than pretending it's the full history.
const AUDIT_SCAN_CAP = 300;

function actionVariant(action: string) {
  if (action.includes("delete")) return "destructive" as const;
  if (action.includes("bad") || action.includes("locked"))
    return "warning" as const;
  if (action.includes("success") || action.includes("enrolled"))
    return "success" as const;
  return "secondary" as const;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string }>;
}) {
  const sp = await searchParams;
  const allEntries = await getRecentAudit(AUDIT_SCAN_CAP);

  // Real, observed action values only — never an invented list.
  const actionOptions = [...new Set(allEntries.map((e) => e.action))].sort();

  const actorFilter = sp.actor?.trim().toLowerCase();
  const entries = allEntries.filter((e) => {
    if (sp.action && e.action !== sp.action) return false;
    if (actorFilter && !e.actorEmail?.toLowerCase().includes(actorFilter)) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every privileged action, with who and when."
      />
      <AuditFilter
        defaultAction={sp.action}
        defaultActor={sp.actor}
        actionOptions={actionOptions}
      />
      <p className="mb-2 text-xs text-muted-foreground">
        Showing {entries.length} of the most recent {AUDIT_SCAN_CAP} audit
        entries{sp.action || sp.actor ? " matching your filters" : ""}.
      </p>
      <Card className="console-glass">
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="console-empty-state">
              <p className="relative p-8 text-center text-sm text-muted-foreground">
                No audit entries {sp.action || sp.actor ? "match those filters" : "yet"}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">When</th>
                    <th scope="col" className="px-4 py-3 font-medium">Admin</th>
                    <th scope="col" className="px-4 py-3 font-medium">Action</th>
                    <th scope="col" className="px-4 py-3 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {e.at
                          ? format(new Date(e.at), "MMM d, HH:mm:ss")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{e.actorEmail}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={actionVariant(e.action)}
                          className="font-mono uppercase tracking-wide"
                        >
                          {e.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {e.target ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
