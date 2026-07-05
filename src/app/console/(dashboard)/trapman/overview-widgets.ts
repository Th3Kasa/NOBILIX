import type { OverviewPrefs } from "@/types";

/**
 * Registry of every widget an admin can show, hide, or reorder on the
 * TrapMan overview. Ids are a persisted contract (stored in each admin's
 * overviewPrefs) — never rename one once shipped; add new entries instead.
 *
 * Pure data + pure functions only: this module is imported by the server
 * page and the client Customize panel alike.
 */

export type OverviewWidgetKind = "stat" | "table" | "note";

export interface OverviewWidgetDef {
  id: string;
  /** Plain-English name shown in the Customize panel. */
  name: string;
  /** Visual grouping label — a hint in the panel, not a toggle unit. */
  section: string;
  kind: OverviewWidgetKind;
}

export const OVERVIEW_WIDGETS: OverviewWidgetDef[] = [
  { id: "players-total", name: "Total players", section: "Players", kind: "stat" },
  { id: "players-registered", name: "Signed-up players", section: "Players", kind: "stat" },
  { id: "players-guests", name: "Guest players", section: "Players", kind: "stat" },
  { id: "players-new-7d", name: "New players (last 7 days)", section: "Players", kind: "stat" },
  { id: "ga4-active-7d", name: "Active players (last 7 days)", section: "Google Analytics", kind: "stat" },
  { id: "ga4-revenue-30d", name: "Google Analytics revenue (last 30 days)", section: "Google Analytics", kind: "stat" },
  { id: "ga4-avg-session", name: "Average session length", section: "Google Analytics", kind: "stat" },
  { id: "ga4-engaged-sessions", name: "Meaningful play sessions (last 30 days)", section: "Google Analytics", kind: "stat" },
  { id: "store-purchases", name: "Store purchases", section: "Store & engagement", kind: "stat" },
  { id: "store-revenue-aud", name: "Store revenue (AUD)", section: "Store & engagement", kind: "stat" },
  { id: "push-reachable", name: "Players we can notify", section: "Store & engagement", kind: "stat" },
  { id: "top-level", name: "Highest level reached", section: "Store & engagement", kind: "stat" },
  { id: "latest-scores", name: "Latest scores coming in", section: "Activity", kind: "table" },
  { id: "revenue-note", name: "Note about the two revenue numbers", section: "Notes", kind: "note" },
];

export const OVERVIEW_WIDGET_IDS = OVERVIEW_WIDGETS.map((w) => w.id);

const WIDGETS_BY_ID = new Map(OVERVIEW_WIDGETS.map((w) => [w.id, w]));

export function getOverviewWidget(id: string): OverviewWidgetDef | undefined {
  return WIDGETS_BY_ID.get(id);
}

/**
 * Merge saved prefs with the registry: unknown saved ids are dropped,
 * widgets added after the prefs were saved appear at the end, visible —
 * so every admin sees new widgets by default without a migration.
 */
export function resolveOverviewLayout(prefs: OverviewPrefs | null | undefined): {
  order: string[];
  hidden: Set<string>;
} {
  const savedOrder = (prefs?.order ?? []).filter((id) => WIDGETS_BY_ID.has(id));
  const seen = new Set(savedOrder);
  const order = [
    ...savedOrder,
    ...OVERVIEW_WIDGET_IDS.filter((id) => !seen.has(id)),
  ];
  const hidden = new Set(
    (prefs?.hidden ?? []).filter((id) => WIDGETS_BY_ID.has(id)),
  );
  return { order, hidden };
}
