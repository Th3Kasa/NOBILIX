import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listUsers } from "@/lib/users";
import { countryFlag, formatNumber } from "@/lib/utils";
import { UsersFilter } from "./users-filter";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  country?: string;
  guest?: string;
  cursor?: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const guest =
    sp.guest === "guest" || sp.guest === "registered" ? sp.guest : "all";
  const result = await listUsers({
    search: sp.q?.trim() || undefined,
    country: sp.country?.trim() || undefined,
    guest,
    cursor: sp.cursor ? Number(sp.cursor) : null,
  });

  const buildHref = (cursor: number) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.country) p.set("country", sp.country);
    if (sp.guest) p.set("guest", sp.guest);
    p.set("cursor", String(cursor));
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
        <Card className="mb-4 border-[var(--console-action-border)] bg-[var(--console-action-tint)]">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--console-action)]" />
            <span className="text-muted-foreground">
              Couldn&apos;t reach Firebase. Add service-account credentials to see
              live players.
            </span>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardContent className="p-0">
          {result.users.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No players found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">High score</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.users.map((u) => (
                    <tr
                      key={u.uid}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {u.displayName ?? (
                            <span className="text-muted-foreground">
                              (no name)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {u.email ?? u.uid}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.country ? (
                          <span>
                            {countryFlag(u.country)} {u.country}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {u.level != null ? formatNumber(u.level) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {u.highScore != null ? formatNumber(u.highScore) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.isGuest ? (
                          <Badge variant="secondary" className="font-mono uppercase tracking-wide">
                            Guest
                          </Badge>
                        ) : (
                          <Badge variant="success" className="font-mono uppercase tracking-wide">
                            Registered
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.createdAt
                          ? format(new Date(u.createdAt as number), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/console/users/${u.uid}`}
                          className="inline-flex items-center text-primary hover:underline"
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

      {result.nextCursor && (
        <div className="mt-4 flex justify-center">
          <Link
            href={buildHref(result.nextCursor)}
            className={buttonVariants({ variant: "outline" })}
          >
            Load more
          </Link>
        </div>
      )}
    </>
  );
}
