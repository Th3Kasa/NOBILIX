import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  BellOff,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { countryFlag, formatNumber } from "@/lib/utils";
import { listPlayers } from "./data";
import { UsersFilter } from "./users-filter";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  country?: string;
  guest?: string;
  offset?: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const guest =
    sp.guest === "guest" || sp.guest === "registered" ? sp.guest : "all";
  const offset = sp.offset ? Math.max(0, Number(sp.offset) || 0) : 0;
  // Sanitize free-text params before they reach Firestore queries: cap the
  // search prefix length and only accept ISO 3166-1 alpha-2 country codes.
  const search = sp.q?.trim().slice(0, 64) || undefined;
  const countryRaw = sp.country?.trim() ?? "";
  const country = /^[A-Za-z]{2}$/.test(countryRaw) ? countryRaw : undefined;
  const result = await listPlayers({
    search,
    country,
    guest,
    offset,
  });

  const buildHref = (nextOffset: number) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.country) p.set("country", sp.country);
    if (sp.guest) p.set("guest", sp.guest);
    p.set("offset", String(nextOffset));
    return `/console/trapman/users?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Players"
        description="Search, inspect, and manage TrapMan players."
      />

      <UsersFilter defaultQ={sp.q} defaultCountry={sp.country} defaultGuest={guest} />

      {!result.connected && (
        <Card className="console-empty-state mb-4 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="relative flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <span className="text-muted-foreground">
              Couldn&apos;t reach Firebase. Add service-account credentials to see
              live players.
            </span>
          </CardContent>
        </Card>
      )}

      <Card className="console-glass mt-4">
        <CardContent className="p-0">
          {result.players.length === 0 ? (
            <div className="console-empty-state">
              <p className="relative p-8 text-center text-sm text-muted-foreground">
                No players found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Levels done</th>
                    <th className="px-4 py-3 font-medium">Purchases</th>
                    <th className="px-4 py-3 font-medium">Push</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.players.map((p) => (
                    <tr
                      key={p.uid}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {p.username ?? (
                            <span className="text-muted-foreground">
                              (no name)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {p.email ?? p.uid}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.country ? (
                          <span>
                            {countryFlag(p.country)} {p.country}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {p.currentLevel != null
                          ? formatNumber(p.currentLevel)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {p.completedLevels != null
                          ? formatNumber(p.completedLevels)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {p.purchaseCount > 0 ? formatNumber(p.purchaseCount) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {p.pushReachable ? (
                          <span className="inline-flex items-center gap-1 text-[var(--console-live)]">
                            <Bell className="size-3.5" aria-hidden="true" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <BellOff className="size-3.5" aria-hidden="true" /> No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.isGuest ? (
                          <Badge variant="secondary" className="font-mono uppercase tracking-wide">
                            Guest
                          </Badge>
                        ) : (
                          <Badge variant="success" className="font-mono uppercase tracking-wide">
                            Registered
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/console/trapman/users/${p.uid}`}
                          className="inline-flex min-h-11 items-center text-primary transition-transform hover:translate-x-0.5 hover:underline"
                        >
                          View <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Showing {result.players.length === 0 ? 0 : offset + 1}–
          {offset + result.players.length} of {result.totalMatching} matching
          player{result.totalMatching === 1 ? "" : "s"}
        </p>
        {result.nextOffset != null && (
          <Link
            href={buildHref(result.nextOffset)}
            className={buttonVariants({ variant: "outline" })}
          >
            Load more
          </Link>
        )}
      </div>
    </>
  );
}
