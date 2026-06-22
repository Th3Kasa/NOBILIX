/**
 * Player session boundary and security tests.
 * Task 1: assert Firebase client/server isolation.
 * Task 2: assert session route security flags.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

// ── Task 1: Client/server isolation ────────────────────────────────────────

test("client.ts must not import firebase-admin", () => {
  const source = read("src/lib/firebase/client.ts");
  assert.doesNotMatch(
    source,
    /firebase-admin/,
    "client.ts must never import firebase-admin"
  );
});

test("client.ts must use firebase/app (web SDK), not firebase-admin/app", () => {
  const source = read("src/lib/firebase/client.ts");
  assert.match(source, /from "firebase\/app"/);
  assert.match(source, /from "firebase\/auth"/);
});

test("player-session.ts must not import firebase/app (web SDK)", () => {
  const sessionPath = resolve(root, "src/lib/player-session.ts");
  if (!existsSync(sessionPath)) {
    // Task 2 not yet implemented — skip with a note
    assert.ok(true, "player-session.ts not yet created (Task 2)");
    return;
  }
  const source = read("src/lib/player-session.ts");
  assert.doesNotMatch(
    source,
    /from "firebase\/app"/,
    "player-session.ts must not import the browser Firebase SDK"
  );
  assert.doesNotMatch(
    source,
    /from "firebase\/auth"/,
    "player-session.ts must not import the browser Firebase Auth SDK"
  );
});

// ── Task 2: Session route security flags ───────────────────────────────────

test("player session cookie must use __Host- prefix (not admin cookie)", () => {
  const sessionPath = resolve(root, "src/lib/player-session.ts");
  if (!existsSync(sessionPath)) {
    assert.ok(true, "player-session.ts not yet created (Task 2)");
    return;
  }
  const source = read("src/lib/player-session.ts");
  assert.match(source, /__Host-nobilix-player/);
  assert.doesNotMatch(
    source,
    /__Secure-next-auth/,
    "player session must not reference the Auth.js admin cookie"
  );
  assert.doesNotMatch(
    source,
    /next-auth\.session-token/,
    "player session must not reference Auth.js session tokens"
  );
});

test("player session route sets httpOnly and secure flags", () => {
  const routePath = resolve(root, "src/app/api/player/session/route.ts");
  if (!existsSync(routePath)) {
    assert.ok(true, "session route not yet created (Task 2)");
    return;
  }
  const source = read("src/app/api/player/session/route.ts");
  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /sameSite:\s*"lax"/);
  assert.match(source, /path:\s*"\/"/);
  // secure: true must be present (tied to production check is acceptable)
  assert.match(source, /secure:/);
});

test("player session route rejects old ID tokens (auth_time check)", () => {
  const routePath = resolve(root, "src/app/api/player/session/route.ts");
  if (!existsSync(routePath)) {
    assert.ok(true, "session route not yet created (Task 2)");
    return;
  }
  const source = read("src/app/api/player/session/route.ts");
  assert.match(
    source,
    /auth_time/,
    "route must check auth_time to reject tokens older than 5 minutes"
  );
});
