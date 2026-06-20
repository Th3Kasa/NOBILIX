import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function actionVariant(action: string) {
  if (action.includes("delete")) return "destructive" as const;
  if (action.includes("bad") || action.includes("locked"))
    return "warning" as const;
  if (action.includes("success") || action.includes("enrolled"))
    return "success" as const;
  return "secondary" as const;
}

export default async function AuditPage() {
  const entries = await getRecentAudit(150);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every privileged action, with who and when."
      />
      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No audit entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {e.at
                          ? format(new Date(e.at), "MMM d, HH:mm:ss")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{e.actorEmail}</td>
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(e.action)}>
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
