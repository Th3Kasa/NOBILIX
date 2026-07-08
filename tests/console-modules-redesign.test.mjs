import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const modulePages = [
  "src/app/console/(dashboard)/page.tsx",
  "src/app/console/(dashboard)/trapman/page.tsx",
  "src/app/console/(dashboard)/trapman/users/page.tsx",
  "src/app/console/(dashboard)/trapman/leaderboard/page.tsx",
  "src/app/console/(dashboard)/trapman/messaging/page.tsx",
  "src/app/console/(dashboard)/trapman/settings/page.tsx",
  "src/app/console/(dashboard)/trapman/analytics/page.tsx",
  "src/app/console/(dashboard)/trapman/purchases/page.tsx",
  "src/app/console/(dashboard)/trapman/gameplay/page.tsx",
  "src/app/console/(dashboard)/trapman/ads/page.tsx",
  "src/app/console/(dashboard)/trapman/exports/page.tsx",
  "src/app/console/(dashboard)/trapman/audit/page.tsx",
];

test("console modules expose consistent page headers", () => {
  for (const path of modulePages) {
    const source = read(path);
    assert.match(source, /PageHeader/, `${path} needs PageHeader`);
  }
});

test("shared console components carry redesigned operational classes", () => {
  const components = [
    ["src/components/console/project-tile.tsx", /console-project-tile/],
    ["src/components/console/live-status.tsx", /console-live-status/],
    ["src/components/console/attention-panel.tsx", /console-attention-panel/],
    ["src/components/stat-card.tsx", /console-stat-card/],
  ];

  for (const [path, pattern] of components) {
    assert.match(read(path), pattern, `${path} missing redesigned class`);
  }
});

test("dead console components stay deleted", () => {
  // metric-panel.tsx, nav/sidebar.tsx, and section-placeholder.tsx were
  // verified unimported anywhere in src/ and removed, along with the
  // orphaned .console-metric-panel CSS that only styled metric-panel.tsx.
  for (const path of [
    "src/components/console/metric-panel.tsx",
    "src/components/nav/sidebar.tsx",
    "src/components/section-placeholder.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), false, `${path} should stay deleted`);
  }
  assert.doesNotMatch(
    read("src/app/globals.css"),
    /\.console-metric-panel/,
    "orphaned .console-metric-panel CSS should be removed",
  );
});

test("data module pages preserve honest empty and unavailable states", () => {
  const overview = read("src/app/console/(dashboard)/trapman/page.tsx");
  const ads = read("src/app/console/(dashboard)/trapman/ads/page.tsx");
  const gameplay = read("src/app/console/(dashboard)/trapman/gameplay/page.tsx");
  const analytics = read("src/app/console/(dashboard)/trapman/analytics/page.tsx");
  const purchases = read("src/app/console/(dashboard)/trapman/purchases/page.tsx");
  const exports_ = read("src/app/console/(dashboard)/trapman/exports/page.tsx");

  assert.match(overview, /unavailable/);
  assert.match(overview, /connect the game&apos;s database first/);
  assert.match(ads, /unavailableReason/);
  assert.match(ads, /No ad analytics available yet/);
  // Gameplay is a live-data module now — keeps honest connection-error and
  // zero-data states instead of a schema-pending placeholder.
  assert.match(gameplay, /Couldn&apos;t reach the game&apos;s database/);
  assert.match(gameplay, /No level data recorded yet/);

  // Analytics/Purchases/Exports are live-data modules now — they must keep
  // honest connection-error and zero-data states instead of placeholders.
  assert.match(analytics, /Not connected to the game&apos;s database/);
  assert.match(purchases, /Not connected to the game&apos;s database/);
  assert.match(purchases, /No purchase records yet/);
  assert.match(exports_, /Nothing to export yet/);

  assert.doesNotMatch(
    `${overview}\n${ads}\n${gameplay}\n${analytics}\n${purchases}\n${exports_}`,
    /99\.99|fake live/i,
  );
});

test("table-heavy modules remain responsive", () => {
  for (const path of [
    "src/app/console/(dashboard)/trapman/users/page.tsx",
    "src/app/console/(dashboard)/trapman/leaderboard/page.tsx",
    "src/app/console/(dashboard)/trapman/audit/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /overflow-x-auto/, `${path} needs horizontal overflow wrapper`);
    assert.match(source, /<table/, `${path} needs a table`);
  }
});
