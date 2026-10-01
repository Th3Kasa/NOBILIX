import { test } from "node:test";
import assert from "node:assert/strict";
import {
  winnerRows,
  repeatWinners,
  WINNER_PLACES,
  prizeKey,
  isPrizeStatus,
} from "../src/lib/trapman/winners.ts";

const comp = (id, label, resetAt, winners) => ({
  id,
  label,
  resetAt,
  periodType: "weekly",
  resetBy: "admin@example.com",
  totalEntries: 50,
  clearedEventBoards: [],
  winners: winners.map(([uid, displayName, score]) => ({ uid, displayName, score })),
});

const history = [
  comp("c1", "Week 1", 1_000, [["a", "Alice", 900], ["b", "Bob", 800], ["c", "Cara", 700], ["d", "Dan", 600]]),
  comp("c2", "Week 2", 2_000, [["b", "Bobby", 950], ["a", "Alice", 940], ["e", null, 100]]),
];

test("only the top 3 win — older archives that saved 10 places show just their top 3", () => {
  assert.equal(WINNER_PLACES, 3);
  const rows = winnerRows(history, {});
  assert.ok(rows.every((r) => r.place <= 3));
  assert.ok(!rows.some((r) => r.uid === "d"), "Dan finished 4th in Week 1");
});

test("winners are listed newest competition first, 1st place first", () => {
  const rows = winnerRows(history, {});
  assert.deepEqual(
    rows.map((r) => [r.competition, r.place, r.uid]),
    [
      ["Week 2", 1, "b"], ["Week 2", 2, "a"], ["Week 2", 3, "e"],
      ["Week 1", 1, "a"], ["Week 1", 2, "b"], ["Week 1", 3, "c"],
    ],
  );
});

test("prize status defaults to not contacted and follows saved records", () => {
  const rows = winnerRows(history, { [prizeKey("c2", "b")]: "sent", [prizeKey("c1", "a")]: "contacted" });
  const status = (c, u) => rows.find((r) => r.competitionId === c && r.uid === u).status;
  assert.equal(status("c2", "b"), "sent");
  assert.equal(status("c1", "a"), "contacted");
  assert.equal(status("c1", "b"), "pending");
});

test("the same player winning twice gets a separate prize record per competition", () => {
  assert.notEqual(prizeKey("c1", "a"), prizeKey("c2", "a"));
});

test("repeat winners rank by 1st places, then top-3 finishes, using the latest name", () => {
  const leaders = repeatWinners(winnerRows(history, {}));
  assert.deepEqual(
    leaders.map((l) => [l.uid, l.displayName, l.firsts, l.podiums]),
    [
      ["b", "Bobby", 1, 2],
      ["a", "Alice", 1, 2],
      ["e", null, 0, 1],
      ["c", "Cara", 0, 1],
    ],
  );
});

test("only known prize statuses are accepted", () => {
  assert.ok(isPrizeStatus("sent"));
  assert.ok(!isPrizeStatus("paid"));
  assert.ok(!isPrizeStatus(undefined));
});
