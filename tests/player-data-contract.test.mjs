/**
 * Player data contract tests.
 * Verify that player-account.ts accepts uid, reads uid-scoped paths,
 * and never invents metrics.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

test("player-account.ts must exist", () => {
  assert.equal(
    existsSync(resolve(root, "src/lib/player-account.ts")),
    true,
    "src/lib/player-account.ts must exist"
  );
});

test("player-account.ts accepts uid parameter (not from request body or query params)", () => {
  const source = read("src/lib/player-account.ts");
  // must accept uid as a direct function parameter
  assert.match(
    source,
    /getPlayerAccountSnapshot\s*\(\s*uid\s*:/,
    "getPlayerAccountSnapshot must accept uid as a typed parameter"
  );
  // must NOT read uid from searchParams or req.query
  assert.doesNotMatch(source, /searchParams/);
  assert.doesNotMatch(source, /req\.query/);
  assert.doesNotMatch(source, /params\.uid/);
});

test("player-account.ts reads from GAME.users collection scoped by uid", () => {
  const source = read("src/lib/player-account.ts");
  // The implementation uses GAME.users constant + .doc(uid) — verify both references exist.
  assert.match(
    source,
    /GAME\.users/,
    "must reference GAME.users collection (maps to users/{uid})"
  );
  assert.match(
    source,
    /\.doc\(uid\)/,
    "must read a document by uid (doc(uid))"
  );
});

test("player-account.ts reads from GAME.progress collection scoped by uid", () => {
  const source = read("src/lib/player-account.ts");
  // GAME.progress maps to player_progress/{uid}
  assert.match(
    source,
    /GAME\.progress/,
    "must reference GAME.progress collection (maps to player_progress/{uid})"
  );
});

test("player-account.ts filters purchases by uid", () => {
  const source = read("src/lib/player-account.ts");
  assert.match(
    source,
    /uid/,
    "must filter purchase documents by uid"
  );
  // must use where/query filtering for purchases (not just top-level collection)
  assert.match(
    source,
    /where|query|==.*uid|uid.*==/,
    "must filter purchases collection by uid field"
  );
});

test("player-account.ts returns null for missing analytics counters (not zero)", () => {
  const source = read("src/lib/player-account.ts");
  // must use nullish checks that allow null return, not default to 0
  assert.doesNotMatch(
    source,
    /totalPlaytimeMs:\s*0[^,\n]/,
    "totalPlaytimeMs must not default to literal 0"
  );
  assert.doesNotMatch(
    source,
    /adsWatchedCount:\s*0[^,\n]/,
    "adsWatchedCount must not default to literal 0"
  );
  assert.doesNotMatch(
    source,
    /adsClickedCount:\s*0[^,\n]/,
    "adsClickedCount must not default to literal 0"
  );
  // null is the correct sentinel
  assert.match(source, /null/);
});

test("player types define PlayerAccountSnapshot with nullable analytics", () => {
  const typesPath = resolve(root, "src/types/player-account.ts");
  assert.equal(existsSync(typesPath), true, "src/types/player-account.ts must exist");
  const source = read("src/types/player-account.ts");
  assert.match(source, /PlayerAccountSnapshot/);
  assert.match(source, /totalPlaytimeMs:\s*number \| null/);
  assert.match(source, /adsWatchedCount:\s*number \| null/);
  assert.match(source, /adsClickedCount:\s*number \| null/);
});

test("GAME collections include purchases and progress", () => {
  const source = read("src/lib/firebase/collections.ts");
  assert.match(source, /purchases/);
  assert.match(source, /player_progress/);
});
