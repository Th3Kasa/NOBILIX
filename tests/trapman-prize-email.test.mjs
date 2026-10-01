import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrizeEmail, mailtoLink } from "../src/lib/trapman/prize-email.ts";

test("a past competition's winner is told where they placed and in what", () => {
  const { subject, body } = buildPrizeEmail({
    displayName: "Vis",
    rank: 1,
    score: 12345,
    competition: "September Showdown",
  });
  assert.equal(subject, "You placed 1st in September Showdown — your Trap-Man prize");
  assert.match(body, /^Hi Vis,/);
  assert.match(body, /You finished 1st in September Showdown with a score of 12,345\./);
  assert.match(body, /reply to this email/);
});

test("the live board wording is used when there is no competition name", () => {
  const { subject, body } = buildPrizeEmail({ displayName: null, rank: 3, score: 900, competition: null });
  assert.equal(subject, "You're 3rd on the Trap-Man leaderboard — your prize");
  assert.match(body, /^Hi there,/);
  assert.match(body, /3rd on the Trap-Man leaderboard/);
});

test("ordinals are right, including the teens", () => {
  const placed = (rank) =>
    buildPrizeEmail({ displayName: "x", rank, score: 1, competition: "C" }).subject.match(/placed (\S+)/)[1];
  assert.deepEqual(
    [1, 2, 3, 4, 10, 11, 12, 13, 21, 22, 23, 101, 111].map(placed),
    ["1st", "2nd", "3rd", "4th", "10th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th"],
  );
});

test("the mailto link keeps spaces, line breaks and symbols intact", () => {
  const link = mailtoLink("vis@example.com", "You won & more", "Hi Vis,\n\nLine two");
  assert.equal(
    link,
    "mailto:vis@example.com?subject=You%20won%20%26%20more&body=Hi%20Vis%2C%0A%0ALine%20two",
  );
  assert.ok(!link.includes("+"), "spaces must not become + (mail apps show it literally)");
});

test("an unknown rank still produces a sensible message", () => {
  const { subject, body } = buildPrizeEmail({ displayName: "Vis", rank: null, score: 50, competition: null });
  assert.equal(subject, "Your Trap-Man leaderboard prize");
  assert.match(body, /You scored 50 on the Trap-Man leaderboard\./);
  assert.doesNotMatch(body, /0th|undefined|null/);
});
