import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function readAll(dir, ext = ".ts") {
  const results = [];
  function walk(d) {
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(ext) || entry.name.endsWith(".tsx")) {
          results.push(full);
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }
  walk(resolve(root, dir));
  return results;
}

// ─── Admin/player auth isolation ───────────────────────────────────────────

test("admin console modules do not import firebase client auth", () => {
  const files = readAll("src/app/console/(dashboard)");
  const violations = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (src.includes("firebase/auth") && !f.includes("/(auth)/")) {
      violations.push(f.replace(root, ""));
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Admin modules must not import Firebase client auth: ${violations.join(", ")}`,
  );
});

test("player session modules do not import @/auth", () => {
  // Player-side code lives outside the admin console.
  // This checks that player-facing routes (e.g. /trapman) don't import @/auth.
  const playerDirs = ["src/app/trapman"];
  for (const dir of playerDirs) {
    if (!existsSync(resolve(root, dir))) continue;
    const files = readAll(dir);
    const violations = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (src.includes('from "@/auth"') || src.includes("from '@/auth'")) {
        violations.push(f.replace(root, ""));
      }
    }
    assert.deepEqual(
      violations,
      [],
      `Player session modules must not import @/auth: ${violations.join(", ")}`,
    );
  }
});

test("proxy middleware still matches /console/:path*", () => {
  const src = read("src/proxy.ts");
  assert.match(
    src,
    /\/console\/:path\*/,
    "proxy matcher must include /console/:path*",
  );
});

test("console dashboard layout enforces auth check", () => {
  const src = read("src/app/console/(dashboard)/layout.tsx");
  // Must call auth() and redirect unauthorized users
  assert.match(src, /auth\(\)/, "dashboard layout must call auth()");
  assert.match(
    src,
    /redirect\(/,
    "dashboard layout must redirect unauthenticated users",
  );
});

// ─── Audit logging for destructive actions ─────────────────────────────────

test("user deletion calls recordAudit", () => {
  const src = read("src/app/console/(dashboard)/trapman/users/actions.ts");
  const deleteSection = src.slice(src.indexOf("deleteUserAction"));
  assert.match(
    deleteSection,
    /recordAudit/,
    "deleteUserAction must call recordAudit",
  );
});

test("user update calls recordAudit", () => {
  const src = read("src/app/console/(dashboard)/trapman/users/actions.ts");
  const updateSection = src.slice(src.indexOf("updateUserAction"));
  assert.match(
    updateSection,
    /recordAudit/,
    "updateUserAction must call recordAudit",
  );
});

test("leaderboard reset calls recordAudit", () => {
  const src = read("src/app/console/(dashboard)/trapman/leaderboard/actions.ts");
  assert.match(
    src,
    /recordAudit/,
    "leaderboard reset must call recordAudit",
  );
});

test("messaging send calls recordAudit", () => {
  const src = read("src/app/console/(dashboard)/trapman/messaging/actions.ts");
  assert.match(
    src,
    /recordAudit/,
    "messaging send must call recordAudit",
  );
});

test("password change calls recordAudit", () => {
  const src = read("src/app/console/(dashboard)/trapman/settings/actions.ts");
  assert.match(
    src,
    /recordAudit/,
    "password change must call recordAudit",
  );
});
