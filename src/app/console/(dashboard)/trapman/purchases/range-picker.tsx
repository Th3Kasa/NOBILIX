"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANGE_OPTIONS, type PurchaseRange } from "./range";

/**
 * Scopes every figure on the page to a time window — the difference between
 * "we have sold 40 things" and "40 people bought during the presale".
 *
 * State lives in the URL rather than component state so a scoped view can be
 * bookmarked and shared, and so the server does the filtering.
 */
export function RangePicker({ range }: { range: PurchaseRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <CalendarRange
          className="size-4 text-[var(--console-violet)]"
          aria-hidden="true"
        />
        Showing
      </span>

      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Purchase date range"
      >
        {RANGE_OPTIONS.map((opt) => {
          const active = range.key === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={active}
              onClick={() =>
                go({
                  range: opt.key === "all" ? null : opt.key,
                  from: null,
                  to: null,
                })
              }
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="range-from" className="text-muted-foreground">
          From
        </label>
        <input
          id="range-from"
          type="date"
          defaultValue={range.fromIso ?? ""}
          onChange={(e) => go({ from: e.target.value || null, range: null })}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <label htmlFor="range-to" className="text-muted-foreground">
          to
        </label>
        <input
          id="range-to"
          type="date"
          defaultValue={range.toIso ?? ""}
          onChange={(e) => go({ to: e.target.value || null, range: null })}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {range.key === "custom" && (
          <button
            type="button"
            onClick={() => go({ from: null, to: null, range: null })}
            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
