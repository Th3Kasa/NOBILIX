/**
 * The time window the Purchases page reports on.
 *
 * A presale is a period, not a product, so "how many people bought in the
 * presale" is only answerable if the operator can scope the figures to when it
 * ran. The window lives in the URL so a scoped view can be linked and shared.
 *
 * Client-safe (no "server-only"): the range picker renders these options too.
 */

export type RangeKey = "all" | "7d" | "30d" | "90d" | "custom";

export interface PurchaseRange {
  key: RangeKey;
  label: string;
  fromMs?: number;
  toMs?: number;
  /** The `from` value echoed back into the custom date input. */
  fromIso?: string;
  toIso?: string;
}

export const RANGE_OPTIONS: { key: Exclude<RangeKey, "custom">; label: string }[] =
  [
    { key: "all", label: "All time" },
    { key: "7d", label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
    { key: "90d", label: "Last 90 days" },
  ];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse `YYYY-MM-DD` as a UTC instant, or null when unusable. */
function parseIsoDate(value: string | undefined, endOfDay: boolean): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Resolve the window from search params.
 *
 * `from`/`to` win over the presets, so a bookmarked presale window keeps
 * working. `now` is injected rather than read from the clock so the result is
 * deterministic for the same request and testable.
 */
export function resolveRange(
  params: { range?: string; from?: string; to?: string },
  now: number,
): PurchaseRange {
  const fromMs = parseIsoDate(params.from, false);
  const toMs = parseIsoDate(params.to, true);

  if (fromMs != null || toMs != null) {
    const label =
      fromMs != null && toMs != null
        ? `${params.from} to ${params.to}`
        : fromMs != null
          ? `Since ${params.from}`
          : `Up to ${params.to}`;
    return {
      key: "custom",
      label,
      fromMs: fromMs ?? undefined,
      toMs: toMs ?? undefined,
      fromIso: fromMs != null ? params.from : undefined,
      toIso: toMs != null ? params.to : undefined,
    };
  }

  switch (params.range) {
    case "7d":
      return { key: "7d", label: "Last 7 days", fromMs: now - 7 * DAY_MS };
    case "30d":
      return { key: "30d", label: "Last 30 days", fromMs: now - 30 * DAY_MS };
    case "90d":
      return { key: "90d", label: "Last 90 days", fromMs: now - 90 * DAY_MS };
    default:
      return { key: "all", label: "All time" };
  }
}

/**
 * Resolve the window against the current clock.
 *
 * Async on purpose: reading the clock is impure, and a component body must
 * stay pure or React may recompute it to a different answer on a re-render.
 * Awaiting it keeps the read out of the render pass, and keeps `resolveRange`
 * itself deterministic and testable.
 */
export async function resolveRangeNow(params: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<PurchaseRange> {
  return resolveRange(params, Date.now());
}
