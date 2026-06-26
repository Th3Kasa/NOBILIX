import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    ["src/components/console/metric-panel.tsx", /console-metric-panel/],
    ["src/components/console/live-status.tsx", /console-live-status/],
    ["src/components/console/attention-panel.tsx", /console-attention-panel/],
    ["src/components/stat-card.tsx", /console-stat-card/],
    ["src/components/section-placeholder.tsx", /console-empty-state/],
  ];

  for (const [path, pattern] of components) {
    assert.match(read(path), pattern, `${path} missing redesigned class`);
  }
});

test("data module pages preserve honest empty and unavailable states", () => {
  const overview = read("src/app/console/(dashboard)/trapman/page.tsx");
  const ads = read("src/app/console/(dashboard)/trapman/ads/page.tsx");
  const gameplay = read("src/app/console/(dashboard)/trapman/gameplay/page.tsx");
  const placeholders = `${read("src/app/console/(dashboard)/trapman/analytics/page.tsx")}\n${read("src/app/console/(dashboard)/trapman/purchases/page.tsx")}\n${read("src/app/console/(dashboard)/trapman/exports/page.tsx")}`;

  assert.match(overview, /unavailable/);
  assert.match(overview, /Firebase connection required/);
  assert.match(ads, /unavailableReason/);
  assert.match(ads, /No ad analytics available yet/);
  assert.match(gameplay, /unavailableReason/);
  assert.match(gameplay, /No gameplay data available yet/);
  assert.match(placeholders, /SectionPlaceholder/);
  assert.doesNotMatch(`${overview}\n${ads}\n${gameplay}`, /99\.99|100%|fake live/i);
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
