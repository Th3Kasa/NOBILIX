import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  OVERVIEW_WIDGET_IDS,
  resolveOverviewLayout,
} from "../src/app/console/(dashboard)/trapman/overview-widgets.ts";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");

test("a new widget slots in at its registry place for admins with saved layouts", () => {
  // A layout saved before "live-players" existed, with two widgets swapped.
  const saved = OVERVIEW_WIDGET_IDS.filter((id) => id !== "live-players");
  [saved[0], saved[1]] = [saved[1], saved[0]];
  const { order } = resolveOverviewLayout({ order: saved, hidden: [] });
  assert.equal(order[0], "live-players", "first in the registry → first on the page");
  assert.deepEqual(order.slice(1), saved, "the admin's own arrangement is kept");
});

test("layout merge drops unknown ids, keeps hidden ones hidden, and covers every widget", () => {
  const { order, hidden } = resolveOverviewLayout({
    order: ["gone-widget", "activity-30d", "players-total"],
    hidden: ["players-guests", "gone-widget"],
  });
  assert.equal(new Set(order).size, OVERVIEW_WIDGET_IDS.length);
  assert.ok(!order.includes("gone-widget"));
  assert.ok(order.indexOf("activity-30d") < order.indexOf("players-total"), "saved order wins");
  assert.deepEqual([...hidden], ["players-guests"]);
  assert.deepEqual(resolveOverviewLayout(null).order, OVERVIEW_WIDGET_IDS);
});

test("the live-players endpoint requires a signed-in admin and is never cached", () => {
  const src = read("src/app/api/trapman/live-players/route.ts");
  assert.match(src, /await requireAdmin\(\)/);
  assert.match(src, /status: 401/);
  assert.match(src, /no-store/);
});

test("live players come from GA4 Realtime with a shared server cache", () => {
  const src = read("src/app/console/(dashboard)/trapman/live-players.ts");
  assert.match(src, /:runRealtimeReport/);
  assert.match(src, /revalidate: 30/);
  const card = read("src/app/console/(dashboard)/trapman/live-players-card.tsx");
  assert.match(card, /visibilityState/, "polling pauses in background tabs");
});
