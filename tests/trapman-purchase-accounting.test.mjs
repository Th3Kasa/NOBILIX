import assert from "node:assert/strict";
import { test } from "node:test";

import { summarise } from "../src/lib/trapman/purchase-accounting.ts";
import { resolveRange } from "../src/app/console/(dashboard)/trapman/purchases/range.ts";
import {
  eventLabel,
  eventHint,
  productLabel,
  platformLabel,
  productSku,
} from "../src/lib/trapman/labels.ts";

/**
 * These cover the arithmetic behind the presale headline: how many people
 * actually paid. Getting it wrong in either direction is expensive — inflated
 * revenue is a lie to the studio, and dropping a real sale hides a customer.
 */

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 26, 12, 0, 0); // 2026-08-26T12:00:00Z

function verification(verdict, source = "google-play") {
  return {
    verdict,
    source,
    reason: null,
    acknowledged: true,
    regionCode: "AU",
    checkedAt: NOW,
  };
}

/** A classified record, shaped as `summarise` receives it. */
function record({
  buyerUid = "buyer-1",
  productId = "com.cultshotta.trapman.hearts_tier_1",
  price = 0.99,
  currency = "AUD",
  platform = "android",
  timestamp = NOW - HOUR,
  verdict = "paid",
  source = "google-play",
  exclusion = null,
} = {}) {
  return {
    purchaseId: `${buyerUid}-${timestamp}-${productId}`,
    productId,
    price,
    currency,
    platform,
    rawPlatform: platform,
    timestamp,
    buyerUid,
    buyerName: buyerUid,
    storeOrderId: null,
    purchaseToken: null,
    packageName: "com.cultshotta.trapman",
    acknowledged: true,
    isEditorPurchase: platform === "editor",
    isVerifiable: platform === "android",
    verification: verification(verdict, source),
    exclusion,
  };
}

// ─── Revenue accounting ──────────────────────────────────────────────────────

test("counts only records with no exclusion as sales", () => {
  const s = summarise([
    record({ buyerUid: "real-1" }),
    record({ buyerUid: "tester", exclusion: "test-account" }),
    record({ buyerUid: "dev", platform: "editor", exclusion: "editor" }),
    record({ buyerUid: "licence", verdict: "test", exclusion: "store-test" }),
  ]);

  assert.equal(s.totalCount, 1);
  assert.equal(s.buyerCount, 1);
  assert.equal(s.excludedTotal, 3);
  assert.equal(s.revenueByCurrency[0].total, 0.99);
});

test("a Google licence-test purchase never reaches revenue", () => {
  const s = summarise([
    record({ buyerUid: "licence", price: 19.99, verdict: "test", exclusion: "store-test" }),
  ]);

  assert.equal(s.totalCount, 0);
  assert.equal(s.buyerCount, 0);
  assert.deepEqual(s.revenueByCurrency, []);
  assert.equal(s.exclusions["store-test"], 1);
});

test("refunded and pending purchases are excluded but still accounted for", () => {
  const s = summarise([
    record({ buyerUid: "a", verdict: "refunded", exclusion: "refunded" }),
    record({ buyerUid: "b", verdict: "pending", exclusion: "pending" }),
    record({ buyerUid: "c", verdict: "promo", exclusion: "promo" }),
  ]);

  assert.equal(s.totalCount, 0);
  assert.equal(s.excludedTotal, 3);
  assert.equal(s.exclusions.refunded, 1);
  assert.equal(s.exclusions.pending, 1);
  assert.equal(s.exclusions.promo, 1);
});

test("one person buying twice is one buyer, two sales", () => {
  const s = summarise([
    record({ buyerUid: "same", timestamp: NOW - HOUR }),
    record({ buyerUid: "same", timestamp: NOW - 2 * HOUR }),
  ]);

  assert.equal(s.totalCount, 2);
  assert.equal(s.buyerCount, 1, "the presale headline counts people, not sales");
});

test("separates store-confirmed sales from ones nobody could verify", () => {
  const s = summarise([
    record({ buyerUid: "android-buyer", verdict: "paid", source: "google-play" }),
    record({
      buyerUid: "iphone-buyer",
      platform: "ios",
      verdict: "unverified",
      source: "none",
    }),
  ]);

  // Both count as sales — an unverifiable purchase is not presumed fake.
  assert.equal(s.totalCount, 2);
  // But only one of them is proven, and the console must be able to say so.
  assert.equal(s.storeConfirmedCount, 1);
  assert.equal(s.unconfirmedCount, 1);
});

test("revenue is never summed across currencies", () => {
  const s = summarise([
    record({ buyerUid: "au", price: 19.99, currency: "AUD" }),
    record({ buyerUid: "in", price: 2250, currency: "INR" }),
  ]);

  assert.equal(s.revenueByCurrency.length, 2);
  const inr = s.revenueByCurrency.find((r) => r.currency === "INR");
  assert.equal(inr.total, 2250, "INR must not be folded into the AUD total");
});

test("the same product in two currencies stays two product rows", () => {
  const s = summarise([
    record({ buyerUid: "a", price: 19.99, currency: "AUD" }),
    record({ buyerUid: "b", price: 2250, currency: "INR" }),
  ]);
  assert.equal(s.products.length, 2);
});

// ─── Presale window ──────────────────────────────────────────────────────────

test("a date window scopes every figure to the presale period", () => {
  const records = [
    record({ buyerUid: "before", timestamp: NOW - 40 * 24 * HOUR }),
    record({ buyerUid: "during-1", timestamp: NOW - 2 * 24 * HOUR }),
    record({ buyerUid: "during-2", timestamp: NOW - 1 * 24 * HOUR }),
  ];

  const all = summarise(records);
  assert.equal(all.buyerCount, 3);

  const week = summarise(records, { fromMs: NOW - 7 * 24 * HOUR });
  assert.equal(week.buyerCount, 2, "only buyers inside the window count");
  assert.equal(week.totalCount, 2);
});

test("the window includes its boundaries", () => {
  const at = NOW - 24 * HOUR;
  const s = summarise([record({ timestamp: at })], { fromMs: at, toMs: at });
  assert.equal(s.totalCount, 1);
});

test("range presets resolve against an injected clock, not the wall clock", () => {
  const r = resolveRange({ range: "7d" }, NOW);
  assert.equal(r.key, "7d");
  assert.equal(r.fromMs, NOW - 7 * 24 * HOUR);
  assert.equal(r.toMs, undefined);
});

test("explicit dates beat the preset, and cover the whole end day", () => {
  const r = resolveRange(
    { range: "7d", from: "2026-08-01", to: "2026-08-20" },
    NOW,
  );
  assert.equal(r.key, "custom");
  assert.equal(r.fromMs, Date.parse("2026-08-01T00:00:00Z"));
  assert.equal(
    r.toMs,
    Date.parse("2026-08-20T23:59:59.999Z"),
    "a purchase at 6pm on the last day must still be inside the window",
  );
});

test("unusable dates fall back to all time rather than hiding sales", () => {
  assert.equal(resolveRange({ from: "not-a-date" }, NOW).key, "all");
  assert.equal(resolveRange({}, NOW).key, "all");
  assert.equal(resolveRange({ range: "nonsense" }, NOW).key, "all");
});

// ─── Label vocabulary ────────────────────────────────────────────────────────

test("Google Analytics event names become plain English", () => {
  assert.equal(eventLabel("user_engagement"), "Time actively playing");
  assert.equal(eventLabel("session_end"), "Play session ended");
  assert.equal(eventLabel("first_open"), "First time opening the game");
  assert.equal(eventLabel("ad_clicked"), "Ad clicked");
});

test("an unmapped event is still readable, never a raw snake_case id", () => {
  assert.equal(eventLabel("boss_defeated"), "Boss defeated");
  assert.equal(eventLabel("trap_sprung"), "Trap sprung");
  assert.equal(eventLabel(""), "");
});

test("events whose meaning is easy to misread carry an explanation", () => {
  assert.match(eventHint("user_engagement"), /not players/);
  assert.equal(eventHint("ad_clicked"), null);
});

test("store product ids become product names, with or without the prefix", () => {
  assert.equal(
    productLabel("com.cultshotta.trapman.hearts_tier_1"),
    "Hearts — Tier 1",
  );
  assert.equal(productLabel("hearts_tier_1"), "Hearts — Tier 1");
  assert.equal(
    productLabel("com.cultshotta.trapman.ad_free_play"),
    "Ad-free play",
  );
  assert.equal(productSku("com.cultshotta.trapman.ad_free_play"), "ad_free_play");
});

test("an unknown product is humanised rather than shown as an id", () => {
  assert.equal(productLabel("com.cultshotta.trapman.coin_pack_5"), "Coin pack 5");
});

test("platform buckets are named for people, and Editor is called out", () => {
  assert.equal(platformLabel("ios"), "iPhone / iPad");
  assert.equal(platformLabel("android"), "Android");
  assert.match(platformLabel("editor"), /not a real sale/);
});
