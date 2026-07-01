import { Download, ShieldCheck, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPurchasesData } from "../purchases/data";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const purchases = await getPurchasesData();

  return (
    <>
      <PageHeader
        title="Exports"
        description="Download presentation-ready CSV snapshots of live datasets."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--console-live-tint)] text-[var(--console-live)]">
                <Users className="size-4.5" aria-hidden="true" />
              </div>
              <Badge
                variant="success"
                className="font-mono uppercase tracking-wide"
              >
                Live
              </Badge>
            </div>
            <CardTitle className="text-base">Players</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Up to 1,000 player profiles — country, level, high score, account
              type, and timestamps.
            </p>
            <a
              href="/api/console-exports/users"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </a>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--console-live-tint)] text-[var(--console-live)]">
                <Trophy className="size-4.5" aria-hidden="true" />
              </div>
              <Badge
                variant="success"
                className="font-mono uppercase tracking-wide"
              >
                Live
              </Badge>
            </div>
            <CardTitle className="text-base">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Top 1,000 competition entries — rank, player, country, character,
              and score.
            </p>
            <a
              href="/api/console-exports/leaderboard"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </a>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-dashed">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--console-violet-tint)] text-[var(--console-violet)]">
                <ShieldCheck className="size-4.5" aria-hidden="true" />
              </div>
              <Badge
                variant="info"
                className="font-mono uppercase tracking-wide"
              >
                No data
              </Badge>
            </div>
            <CardTitle className="text-base">Purchases</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
            <p className="text-sm text-muted-foreground">
              {purchases.connected
                ? "The purchases collection is connected but has no transactions recorded yet in this environment."
                : "Firebase is unreachable — connect it to check for purchase records."}
            </p>
            <button
              type="button"
              disabled
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full cursor-not-allowed opacity-50",
              )}
              aria-disabled="true"
              title="Enabled automatically once purchases exist"
            >
              <Download className="size-4" aria-hidden="true" />
              Nothing to export yet
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
