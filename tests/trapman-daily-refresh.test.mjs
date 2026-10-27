import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  DAILY_REFRESH_CRON,
  DAILY_REFRESH_PATH,
  DAILY_REFRESH_UTC_HOUR,
  nextDailyRefresh,
} from "../src/lib/trapman/refresh-schedule.ts";

/**
 * The console tells operators when Apple and Google data next updates. That
 * promise is only true if Vercel actually runs the job at the time the console
 * computes — so the two are pinned together here.
 */

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("vercel.json schedules the daily refresh exactly as the console reports it", () => {
  const crons = JSON.parse(read("vercel.json")).crons ?? [];
  const job = crons.find((c) => c.path === DAILY_REFRESH_PATH);
  assert.ok(job, "the daily refresh must be registered in vercel.json");
  assert.equal(job.schedule, DAILY_REFRESH_CRON);
});

test("the next refresh is later today before the hour, tomorrow after it", () => {
  const before = Date.UTC(2026, 9, 27, DAILY_REFRESH_UTC_HOUR - 1, 30);
  const after = Date.UTC(2026, 9, 27, DAILY_REFRESH_UTC_HOUR, 0, 1);
  assert.equal(nextDailyRefresh(before), Date.UTC(2026, 9, 27, DAILY_REFRESH_UTC_HOUR));
  assert.equal(nextDailyRefresh(after), Date.UTC(2026, 9, 28, DAILY_REFRESH_UTC_HOUR));
  // Exactly on the hour the run is under way, so the next one is tomorrow.
  const onTheHour = Date.UTC(2026, 9, 27, DAILY_REFRESH_UTC_HOUR);
  assert.equal(nextDailyRefresh(onTheHour), Date.UTC(2026, 9, 28, DAILY_REFRESH_UTC_HOUR));
});

test("the refresh endpoint refuses everyone unless CRON_SECRET is set and presented", () => {
  const src = read("src/app/api/cron/daily-refresh/route.ts");
  assert.match(src, /process\.env\.CRON_SECRET/);
  assert.match(src, /if \(!secret\) return false;/, "no secret configured must mean no access");
  assert.match(src, /timingSafeEqual/, "the secret is compared in constant time");
  assert.match(src, /status: 401/);
});

test("the cron route is outside the console's login wall but not public by accident", () => {
  // Vercel Cron cannot sign in, so the route must not sit under /console;
  // the bearer-secret check above is what protects it instead.
  assert.ok(DAILY_REFRESH_PATH.startsWith("/api/cron/"));
  assert.doesNotMatch(read("src/proxy.ts"), /api\/cron/);
});
