import { AlertTriangle, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SectionPlaceholder } from "@/components/section-placeholder";
import { getPurchasesData } from "./data";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const data = await getPurchasesData();

  return (
    <>
      <PageHeader
        title="Purchases"
        description="What's selling — top and bottom performers."
      />

      {!data.connected ? (
        <Card className="border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <div>
              <p className="font-medium text-[var(--console-action)]">
                Not connected to Firebase
              </p>
              <p className="text-muted-foreground">
                {data.error ?? "Add service-account credentials to check for purchase records."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : data.totalCount === 0 ? (
        <div className="console-empty-state rounded-xl border border-dashed border-border bg-muted/20">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
              <Receipt className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">No purchase records yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              The <code className="font-mono text-xs">purchases</code> collection
              is connected and confirmed, but no transactions have been recorded
              yet in this environment. Revenue, top products, and repeat-buyer
              analytics will populate here automatically once purchases start
              flowing in — nothing to configure.
            </p>
          </div>
        </div>
      ) : (
        <SectionPlaceholder note="Purchase analytics (Phase 5) — most/least bought products, revenue, conversion, ARPU, and repeat buyers, now that live transactions exist." />
      )}
    </>
  );
}
