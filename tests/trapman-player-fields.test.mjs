import { test } from "node:test";
import assert from "node:assert/strict";
import { readPlayerFields, average, timeMs } from "../src/lib/trapman/player-fields.ts";

test("highest level is the furthest reached, not where the player sits now", () => {
  // The case from the Players tab: back at level 0 with 21 levels finished.
  const p = readPlayerFields({
    currentLevel: 0,
    completedLevels: Array.from({ length: 21 }, (_, i) => i + 1),
  });
  assert.equal(p.currentLevel, 0);
  assert.equal(p.levelsCompleted, 21);
  assert.equal(p.highestLevel, 21);
});

test("a current level beyond anything completed is the highest", () => {
  assert.equal(readPlayerFields({ currentLevel: 7, completedLevels: [1, 2, 3] }).highestLevel, 7);
});

test("duplicate completions count once; numeric strings count as levels", () => {
  const p = readPlayerFields({ completedLevels: [1, 1, "2", 2, 3] });
  assert.equal(p.levelsCompleted, 3);
  assert.deepEqual(p.completedLevels, [1, 2, 3]);
  assert.equal(p.highestLevel, 3);
});

test("levels stored by name still count as completed", () => {
  const p = readPlayerFields({ completedLevels: ["tutorial", "boss_1"] });
  assert.equal(p.levelsCompleted, 2);
  assert.equal(p.highestLevel, null);
});

test("older field names are read the same way everywhere", () => {
  const p = readPlayerFields({
    level: 4,
    fcm_token: " tok ",
    is_guest: true,
    displayName: "Vis",
    country: " au ",
  });
  assert.equal(p.currentLevel, 4);
  assert.equal(p.pushToken, "tok");
  assert.equal(p.isGuest, true);
  assert.equal(p.name, "Vis");
  assert.equal(p.country, "AU");
});

test("username wins over displayName; blanks are not names or tokens", () => {
  const p = readPlayerFields({ username: "regrutto", displayName: "Other", fcmToken: "   " });
  assert.equal(p.name, "regrutto");
  assert.equal(p.pushToken, null);
});

test("a missing guest flag means a registered player", () => {
  assert.equal(readPlayerFields({}).isGuest, false);
  assert.equal(readPlayerFields({ isGuest: "true" }).isGuest, false);
});

test("last played reads the game's sync time in any timestamp shape", () => {
  assert.equal(readPlayerFields({ lastServerSync: { _seconds: 100 } }).lastSeenMs, 100_000);
  assert.equal(readPlayerFields({ lastServerSync: { toMillis: () => 5 } }).lastSeenMs, 5);
  assert.equal(timeMs(123), 123);
  assert.equal(readPlayerFields(null).lastSeenMs, null);
});

test("averages round to one decimal and are null for nobody", () => {
  assert.equal(average([1, 2, 2]), 1.7);
  assert.equal(average([]), null);
});
