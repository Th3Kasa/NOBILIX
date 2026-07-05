import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

const REGISTRY_PATH = "src/app/console/(dashboard)/trapman/overview-widgets.ts";
const PAGE_PATH = "src/app/console/(dashboard)/trapman/page.tsx";
const ACTIONS_PATH =
  "src/app/console/(dashboard)/trapman/overview-prefs-actions.ts";

test("overview widget registry exists with unique kebab-case ids", () => {
  assert.ok(existsSync(resolve(root, REGISTRY_PATH)), "registry must exist");
  const src = read(REGISTRY_PATH);

  const ids = [...src.matchAll(/^\s*\{ id: "([^"]+)"/gm)].map((m) => m[1]);
  assert.ok(ids.length >= 14, `expected at least 14 widgets, found ${ids.length}`);
  assert.equal(new Set(ids).size, ids.length, "widget ids must be unique");
  for (const id of ids) {
    assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `id "${id}" must be kebab-case`);
  }
});

test("overview page renders through the registry with per-admin prefs", () => {
  const src = read(PAGE_PATH);
  assert.match(src, /resolveOverviewLayout/, "page must resolve the admin layout");
  assert.match(src, /CustomizeOverview/, "page must render the Customize control");
  assert.match(src, /getAdminById/, "page must load the signed-in admin's prefs");
  // Data fetch stays intact.
  assert.match(src, /Promise\.allSettled/, "independent sources must stay isolated");
  assert.match(src, /getTrapManOverview/, "page must call getTrapManOverview");
});

test("overview page speaks plain English, not analytics jargon", () => {
  const src = read(PAGE_PATH);
  // Old user-facing labels/hints, not code identifiers (FALLBACK_GA4 etc.
  // are fine — they never render).
  const jargon = [
    /GA4 revenue/,
    /GA4 new users/,
    // Case-sensitive: the lowercase widget id "push-reachable" is fine.
    /Push-reachable/,
    /FCM token/i,
    /ECB rate/i,
    /Non-guest/i,
    /straight from Firebase/i,
    /Engaged sessions \(30d\)/,
    /Avg session/,
  ];
  for (const pattern of jargon) {
    assert.doesNotMatch(src, pattern, `page must not contain jargon ${pattern}`);
  }
});

test("prefs actions are validated, self-scoped, and open to every role", () => {
  const src = read(ACTIONS_PATH);
  assert.match(src, /"use server"/, "must be a server-action module");
  assert.match(src, /requireAdmin\(\)/, "must authenticate the caller");
  assert.doesNotMatch(
    src,
    /requireWriteAccess\(/,
    "viewers customise their own overview — must not gate on write access",
  );
  assert.match(src, /safeParse/, "must zod-validate client input");
  assert.doesNotMatch(
    src,
    /adminId\s*[:=]\s*(input|parsed)/,
    "must never accept an adminId from the client",
  );
});

test("admin record carries overviewPrefs through the data layer", () => {
  const types = read("src/types/index.ts");
  assert.match(types, /interface OverviewPrefs/, "OverviewPrefs type must exist");
  assert.match(types, /overviewPrefs\??:/, "AdminRecord must carry overviewPrefs");

  const admins = read("src/lib/admins.ts");
  assert.match(admins, /updateOverviewPrefs/, "admins lib must persist prefs");
  assert.match(
    admins,
    /overviewPrefs: data\.overviewPrefs \?\? null/,
    "toRecord must map overviewPrefs",
  );
});

test("switch primitive exists for the customize panel", () => {
  assert.ok(
    existsSync(resolve(root, "src/components/ui/switch.tsx")),
    "switch component must exist",
  );
  const src = read("src/components/ui/switch.tsx");
  assert.match(src, /role="switch"/, "must expose the switch role");
  assert.match(src, /aria-checked/, "must expose aria-checked");
});
