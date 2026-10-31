import type { OverviewPrefs } from "@/types";

/**
 * Registry of every widget an admin can show, hide, or reorder on the
 * TrapMan overview. Ids are a persisted contract (stored in each admin's
 * overviewPrefs) — never rename one once shipped; add new entries instead.
 *
 * Pure data + pure functions only: this module is imported by the server
 * page and the client Customize panel alike.
 */

export type OverviewWidgetKind = "stat" | "table" | "chart" | "note";

/** Which backend a widget's data comes from — used to explain why it's
 *  not currently displaying anything (see resolveOverviewLayout callers
 *  in page.tsx). Widgets fed by more than one source, or that always
 *  render something, leave this unset. */
export type OverviewWidgetSource = "firestore" | "ga4" | "fx";

export interface OverviewWidgetDef {
  id: string;
  /** Plain-English name shown in the Customize panel. */
  name: string;
  /** Visual grouping label — a hint in the panel, not a toggle unit. */
  section: string;
  kind: OverviewWidgetKind;
  /** The single backend this widget depends on, if any. */
  source?: OverviewWidgetSource;
}

export const OVERVIEW_WIDGETS: OverviewWidgetDef[] = [
  { id: "live-players", name: "Playing right now", section: "Activity", kind: "table", source: "ga4" },
  { id: "players-total", name: "Total players", section: "Players", kind: "stat", source: "firestore" },
  { id: "players-registered", name: "Signed-up players", section: "Players", kind: "stat", source: "firestore" },
  { id: "players-guests", name: "Guest players", section: "Players", kind: "stat", source: "firestore" },
  { id: "players-new-7d", name: "New app users (last 7 days)", section: "Google Analytics", kind: "stat", source: "ga4" },
  { id: "ga4-active-7d", name: "Active app users (last 7 days)", section: "Google Analytics", kind: "stat", source: "ga4" },
  { id: "ga4-avg-session", name: "Average session length", section: "Google Analytics", kind: "stat", source: "ga4" },
  { id: "ga4-engaged-sessions", name: "Meaningful play sessions (last 30 days)", section: "Google Analytics", kind: "stat", source: "ga4" },
  { id: "store-sales-launch", name: "Store sales (AUD, since launch)", section: "Store & engagement", kind: "stat" },
  { id: "push-reachable", name: "Players we can notify", section: "Store & engagement", kind: "stat", source: "firestore" },
  { id: "latest-scores", name: "Latest scores coming in", section: "Activity", kind: "table", source: "firestore" },
  { id: "revenue-note", name: "Note about the revenue figures", section: "Notes", kind: "note" },
  { id: "activity-30d", name: "Daily active app users (last 30 days)", section: "Activity", kind: "chart", source: "ga4" },
];

export const OVERVIEW_WIDGET_IDS = OVERVIEW_WIDGETS.map((w) => w.id);

const WIDGETS_BY_ID = new Map(OVERVIEW_WIDGETS.map((w) => [w.id, w]));

export function getOverviewWidget(id: string): OverviewWidgetDef | undefined {
  return WIDGETS_BY_ID.get(id);
}

/**
 * Merge saved prefs with the registry: unknown saved ids are dropped, and
 * widgets added after the prefs were saved appear, visible, at their place in
 * the registry (just after the widget that precedes them there) — so every
 * admin sees a new widget where it was designed to sit, without a migration.
 */
export function resolveOverviewLayout(prefs: OverviewPrefs | null | undefined): {
  order: string[];
  hidden: Set<string>;
} {
  const order = (prefs?.order ?? []).filter((id) => WIDGETS_BY_ID.has(id));
  const seen = new Set(order);
  OVERVIEW_WIDGET_IDS.forEach((id, index) => {
    if (seen.has(id)) return;
    const previous = OVERVIEW_WIDGET_IDS.slice(0, index).reverse().find((p) => seen.has(p));
    order.splice(previous ? order.indexOf(previous) + 1 : 0, 0, id);
    seen.add(id);
  });
  const hidden = new Set(
    (prefs?.hidden ?? []).filter((id) => WIDGETS_BY_ID.has(id)),
  );
  return { order, hidden };
}
