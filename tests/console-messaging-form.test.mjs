import { test } from "node:test";
import assert from "node:assert/strict";
import {
  composeSchema,
  buildAudience,
} from "../src/app/console/(dashboard)/trapman/messaging/form.ts";

const base = { title: "Hi", body: "New levels are live", audienceType: "segment" };

test("blank level and day boxes mean no filter, not zero", () => {
  const d = composeSchema.parse({
    ...base, country: "au", minLevel: "", maxLevel: "", lastActiveDays: "  ",
  });
  assert.equal(d.minLevel, undefined);
  assert.equal(d.maxLevel, undefined);
  assert.equal(d.lastActiveDays, undefined);
  assert.deepEqual(buildAudience(d), {
    type: "segment",
    filters: { country: "au", minLevel: undefined, maxLevel: undefined, lastActiveDays: undefined },
  });
});

test("filled boxes become numbers, and an explicit 0 is kept", () => {
  const d = composeSchema.parse({ ...base, minLevel: "0", maxLevel: "12", lastActiveDays: "7" });
  assert.equal(d.minLevel, 0);
  assert.equal(d.maxLevel, 12);
  assert.equal(d.lastActiveDays, 7);
});

test("negative or fractional values are rejected with a readable message", () => {
  assert.equal(composeSchema.safeParse({ ...base, maxLevel: "-1" }).success, false);
  const r = composeSchema.safeParse({ ...base, lastActiveDays: "1.5" });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /whole numbers/);
});

test("a blank country is no filter", () => {
  const a = buildAudience(composeSchema.parse({ ...base, country: "" }));
  assert.equal(a.filters.country, undefined);
});

test("single-player sends need a player ID; broadcast needs nothing", () => {
  assert.equal(buildAudience(composeSchema.parse({ ...base, audienceType: "single", uid: "  " })), null);
  assert.deepEqual(
    buildAudience(composeSchema.parse({ ...base, audienceType: "single", uid: " abc " })),
    { type: "single", uid: "abc" },
  );
  assert.deepEqual(buildAudience(composeSchema.parse({ ...base, audienceType: "broadcast" })), { type: "broadcast" });
});
