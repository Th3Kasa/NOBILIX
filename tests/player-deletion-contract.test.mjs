/**
 * Player account deletion contract tests.
 * Verify that the deletion implementation:
 * - covers all required data locations
 * - handles idempotent auth/user-not-found
 * - requires recent auth (auth_time within 5 minutes)
 * - requires typed confirmation
 * - does not write email or username into compliance receipt
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

// ── player-deletion.ts existence ───────────────────────────────────────────

test("player-deletion.ts must exist", () => {
  assert.equal(
    existsSync(resolve(root, "src/lib/player-deletion.ts")),
    true,
    "src/lib/player-deletion.ts must exist"
  );
});

test("DeletionResult interface is exported from player-deletion.ts", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(source, /DeletionResult/);
  assert.match(source, /deleted:/);
  assert.match(source, /anonymized:/);
  assert.match(source, /alreadyAbsent:/);
});

// ── Data coverage (all required collections) ───────────────────────────────

test("deletion covers users/{uid}", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /GAME\.users|users\//,
    "must delete from users/{uid}"
  );
});

test("deletion covers player_progress/{uid}", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /GAME\.progress|player_progress/,
    "must delete from player_progress/{uid}"
  );
});

test("deletion covers leaderboard/{uid}", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /GAME\.leaderboard|leaderboard/,
    "must handle leaderboard entry removal or anonymization"
  );
});

test("deletion queries purchases by uid", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /GAME\.purchases|purchases/,
    "must query purchase documents by uid"
  );
  assert.match(
    source,
    /where.*uid|uid.*where/,
    "must filter purchases by uid field"
  );
});

test("deletion deletes Firebase Auth user", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /deleteUser/,
    "must call deleteUser to remove the Firebase Auth record"
  );
});

// ── Idempotency ─────────────────────────────────────────────────────────────

test("deletion handles auth/user-not-found idempotently", () => {
  const source = read("src/lib/player-deletion.ts");
  assert.match(
    source,
    /user-not-found/,
    "must handle auth/user-not-found error without throwing"
  );
});

// ── Compliance receipt safety ───────────────────────────────────────────────

test("DeletionResult must not include email or username fields", () => {
  const source = read("src/lib/player-deletion.ts");
  // The DeletionResult interface should only have uid, deleted, anonymized, alreadyAbsent
  // Verify no email/username field is added to the interface or returned object
  const interfaceMatch = source.match(
    /interface DeletionResult\s*\{([^}]+)\}/
  );
  if (interfaceMatch) {
    const interfaceBody = interfaceMatch[1];
    assert.doesNotMatch(
      interfaceBody,
      /email/,
      "DeletionResult must not contain email"
    );
    assert.doesNotMatch(
      interfaceBody,
      /username/,
      "DeletionResult must not contain username"
    );
    assert.doesNotMatch(
      interfaceBody,
      /displayName/,
      "DeletionResult must not contain displayName"
    );
  }
});

// ── API route: recent auth + typed confirmation ─────────────────────────────

test("delete route must exist", () => {
  assert.equal(
    existsSync(resolve(root, "src/app/api/player/delete/route.ts")),
    true,
    "src/app/api/player/delete/route.ts must exist"
  );
});

test("delete route requires auth_time check (recent auth within 5 minutes)", () => {
  const source = read("src/app/api/player/delete/route.ts");
  assert.match(
    source,
    /auth_time/,
    "delete route must verify auth_time is within 5 minutes"
  );
});

test("delete route requires typed confirmation 'DELETE TRAPMAN'", () => {
  const source = read("src/app/api/player/delete/route.ts");
  assert.match(
    source,
    /DELETE TRAPMAN/,
    "delete route must require confirmation string 'DELETE TRAPMAN'"
  );
});

test("delete route uses revocation-checked session verification", () => {
  const source = read("src/app/api/player/delete/route.ts");
  // verifySessionCookie must be called with checkRevoked=true
  assert.match(
    source,
    /verifySessionCookie.*true|true.*verifySessionCookie/,
    "delete route must use revocation-checked verifySessionCookie(cookie, true)"
  );
});

test("delete route does not read uid from query params or request body", () => {
  const source = read("src/app/api/player/delete/route.ts");
  // uid must come from the decoded session cookie only
  assert.doesNotMatch(source, /searchParams.*uid/);
  assert.doesNotMatch(source, /params\.uid/);
  assert.doesNotMatch(source, /body\.uid|\.uid.*body/);
});
