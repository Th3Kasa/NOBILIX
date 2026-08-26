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
import { countryFlag, formatNumber, cn } from "@/lib/utils";
import { classifyPlayerEmail } from "@/lib/trapman/player-email";
import { listPlayers, type SortField } from "./data";
import { UsersFilter } from "./users-filter";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  country?: string;
  guest?: string;
  offset?: string;
  sort?: string;
};

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "name", label: "Player" },
  { field: "country", label: "Country" },
  { field: "level", label: "Level" },
  { field: "levelsDone", label: "Levels done" },
  { field: "purchases", label: "Purchases" },
];

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
    sort: sp.sort,
  });

  const buildHref = (overrides: { offset?: number; sort?: string }) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.country) p.set("country", sp.country);
    if (sp.guest) p.set("guest", sp.guest);
    const sort = overrides.sort ?? sp.sort;
    if (sort) p.set("sort", sort);
    p.set("offset", String(overrides.offset ?? 0));
    return `/console/trapman/users?${p.toString()}`;
  };

  const sortHref = (field: SortField) => {
    const isActive = result.sortField === field;
    const nextSort =
      isActive && result.sortDirection === "asc" ? `-${field}` : field;
    // Changing sort re-ranks the whole matching set, so restart paging.
    return buildHref({ offset: 0, sort: nextSort });
  };

  const ariaSortFor = (field: SortField): "ascending" | "descending" | "none" => {
    if (result.sortField !== field) return "none";
    return result.sortDirection === "asc" ? "ascending" : "descending";
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
              Couldn&apos;t reach the game&apos;s database. Live players will
              appear once the connection details are added.
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
                    {COLUMNS.map((col) => (
                      <th
                        key={col.field}
                        scope="col"
                        className="px-4 py-3 font-medium"
                        aria-sort={ariaSortFor(col.field)}
                      >
                        <Link
                          href={sortHref(col.field)}
                          className={cn(
                            "inline-flex min-h-11 items-center gap-1 hover:text-foreground focus-visible:text-foreground",
                            result.sortField === col.field && "text-foreground",
                          )}
                        >
                          {col.label}
                          {result.sortField === col.field && (
                            <span aria-hidden="true">
                              {result.sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Link>
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 font-medium">Push</th>
                    <th scope="col" className="px-4 py-3 font-medium">Type</th>
                    <th scope="col" className="px-4 py-3" />
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
                          {(() => {
                            const id = classifyPlayerEmail(p.email);
                            // Apple's Hide My Email alias is a real, deliverable
                            // address — label it so it doesn't read as junk data.
                            if (id.kind === "apple-relay") {
                              return (
                                <span title={id.note}>
                                  {id.address}{" "}
                                  <span className="not-italic">
                                    · Apple private relay
                                  </span>
                                </span>
                              );
                            }
                            return id.address ?? p.uid;
                          })()}
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
          Showing {result.players.length} of {result.totalMatching} matching
          player{result.totalMatching === 1 ? "" : "s"}
          {result.scanCapped
            ? ` (of the first ${formatNumber(result.sampleCap)} scanned players)`
            : ""}
        </p>
        {result.nextOffset != null && (
          <Link
            href={buildHref({ offset: result.nextOffset })}
            className={buttonVariants({ variant: "outline" })}
          >
            Load more
          </Link>
        )}
      </div>
    </>
  );
}
