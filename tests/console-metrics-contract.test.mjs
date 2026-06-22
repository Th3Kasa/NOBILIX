import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

test("getTrapManOverview module exists", () => {
  const overviewPath = resolve(root, "src/lib/trapman/overview.ts");
  assert.ok(existsSync(overviewPath), "src/lib/trapman/overview.ts must exist");
});

test("TrapMan overview page reads from getTrapManOverview, not hard-coded numbers", () => {
  const pagePath = "src/app/console/(dashboard)/trapman/page.tsx";
  assert.ok(
    existsSync(resolve(root, pagePath)),
    "TrapMan overview page must exist",
  );
  const src = read(pagePath);

  // Must call getTrapManOverview
  assert.match(
    src,
    /getTrapManOverview/,
    "page must call getTrapManOverview",
  );

  // Must not contain fake literal player/revenue figures
  // (large numbers embedded as string or JSX literals)
  assert.doesNotMatch(
    src,
    /\b\d{4,}\b/,
    "page must not contain hard-coded numeric literals with 4+ digits",
  );

  // Must not contain example revenue figures
  const fakePatterns = [
    /\$[\d,]+/,   // $1,234
    /revenue.*\d{4}/i,
    /players.*=.*\d{4}/i,
  ];
  for (const pattern of fakePatterns) {
    assert.doesNotMatch(
      src,
      pattern,
      `page must not contain fake value matching ${pattern}`,
    );
  }
});

test("TrapManOverview interface uses null for unverified metrics", () => {
  const overviewPath = "src/lib/trapman/overview.ts";
  const src = read(overviewPath);

  // Interface fields for potentially-unavailable metrics should be null-able
  assert.match(
    src,
    /purchases24h.*null/,
    "purchases24h must be nullable",
  );
  assert.match(
    src,
    /revenue24h.*null/,
    "revenue24h must be nullable",
  );
  assert.match(
    src,
    /unavailable.*string\[\]/,
    "unavailable field must be string[]",
  );
});

test("no-fake-values: overview renders honest unavailable states", () => {
  const pagePath = "src/app/console/(dashboard)/trapman/page.tsx";
  const src = read(pagePath);

  // Must handle connected: false with an honest message
  assert.match(
    src,
    /connected/,
    "page must handle the connected status",
  );

  // Must render unavailable metrics with honest state (not placeholder numbers)
  assert.match(
    src,
    /unavailable/,
    "page must reference unavailable metrics",
  );
});
