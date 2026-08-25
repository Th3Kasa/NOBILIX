import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parsePurchaseMap,
  normalisePlatform,
  buyerNameFrom,
} from "../src/lib/trapman/purchases.ts";

/**
 * Shapes below are copied from the live TrapMan database. Both stores are
 * represented because the game writes them differently and the console read
 * only one of them correctly before this parser existed.
 */

const APPLE_FLAT = {
  productId: "com.cultshotta.trapman.hearts_tier_1",
  price: 0.99,
  currency: "USD",
  platform: "IPhonePlayer",
  timestamp: 1787229096225,
  receipt: "appleopaquereceiptstring",
};

const EDITOR_FLAT = {
  productId: "com.cultshotta.trapman.ad_free_play",
  price: 0.01,
  currency: "usd",
  platform: "OSXEditor",
  timestamp: 1786964370236,
  receipt: "{}",
};

// Google wraps the same shape one level deeper, keyed by the full token.
const GOOGLE_TOKEN =
  "AO-J1Oz6XQmsr0w3LRQfICOlExJN8livrTz0RSLMwHajpz1QZivmj3deaGwF_9kq";
const GOOGLE_NESTED = {
  [GOOGLE_TOKEN]: {
    productId: "com.cultshotta.trapman.ad_free_play",
    price: 2250,
    currency: "INR",
    platform: "Android",
    timestamp: 1782317973644,
    receipt: JSON.stringify({
      json: JSON.stringify({
        orderId: "GPA.3332-0270-4211-98618",
        packageName: "com.cultshotta.trapman",
        productId: "com.cultshotta.trapman.ad_free_play",
        purchaseTime: 1782317950065,
        purchaseState: 0,
        purchaseToken: GOOGLE_TOKEN,
        quantity: 1,
        acknowledged: false,
      }),
      signature: "abc",
      skuDetails: [],
    }),
  },
};

test("reads the flat Apple shape", () => {
  const { purchases, unparsed } = parsePurchaseMap("uid1", "Aba300", {
    "00cb8ebd-4551": APPLE_FLAT,
  });
  assert.equal(unparsed.length, 0);
  assert.equal(purchases.length, 1);
  const p = purchases[0];
  assert.equal(p.productId, "com.cultshotta.trapman.hearts_tier_1");
  assert.equal(p.price, 0.99);
  assert.equal(p.currency, "USD");
  assert.equal(p.platform, "ios");
  assert.equal(p.buyerName, "Aba300");
  assert.equal(p.isEditorPurchase, false);
});

test("unwraps the nested Google shape rather than discarding it", () => {
  const { purchases, unparsed } = parsePurchaseMap("uid2", "Kasa", {
    ldfbchlcgfolckfmddbphjip: GOOGLE_NESTED,
  });
  // This is the regression that mattered: these used to land in `unparsed`
  // and were excluded from every revenue figure.
  assert.equal(unparsed.length, 0);
  assert.equal(purchases.length, 1);
  const p = purchases[0];
  assert.equal(p.price, 2250);
  assert.equal(p.currency, "INR", "INR must not be silently treated as USD");
  assert.equal(p.platform, "android");
});

test("recovers order id, token and acknowledgement from a Google receipt", () => {
  const { purchases } = parsePurchaseMap("uid2", "Kasa", {
    ldfbchlcgfolckfmddbphjip: GOOGLE_NESTED,
  });
  const p = purchases[0];
  assert.equal(p.storeOrderId, "GPA.3332-0270-4211-98618");
  assert.equal(p.purchaseToken, GOOGLE_TOKEN);
  // Google auto-refunds purchases left unacknowledged for three days.
  assert.equal(p.acknowledged, false);
  // Store order id becomes the stable identity for dedup across accounts.
  assert.equal(p.purchaseId, "GPA.3332-0270-4211-98618");
});

test("flags Unity Editor purchases, which never touched a store", () => {
  const { purchases } = parsePurchaseMap("uid3", "Guest", { k: EDITOR_FLAT });
  assert.equal(purchases[0].isEditorPurchase, true);
  assert.equal(purchases[0].platform, "editor");
  assert.equal(purchases[0].rawPlatform, "OSXEditor");
  // Currency is normalised even when the client wrote it lower-case.
  assert.equal(purchases[0].currency, "USD");
});

test("both stores parse together and agree on shape", () => {
  const { purchases, unparsed } = parsePurchaseMap("uid4", "Mixed", {
    apple: APPLE_FLAT,
    ldfbchlcgfolckfmddbphjip: GOOGLE_NESTED,
    editor: EDITOR_FLAT,
  });
  assert.equal(unparsed.length, 0);
  assert.equal(purchases.length, 3);
  assert.deepEqual(
    [...new Set(purchases.map((p) => p.platform))].sort(),
    ["android", "editor", "ios"],
  );
});

test("genuinely unreadable records are reported, never silently dropped", () => {
  const { purchases, unparsed } = parsePurchaseMap("uid5", null, {
    broken: { productId: "x" }, // missing price/currency/platform/timestamp
    nonsense: "a string",
  });
  assert.equal(purchases.length, 0);
  assert.equal(unparsed.length, 2);
  assert.match(unparsed[0].reason, /missing required fields/);
  assert.match(unparsed[1].reason, /not an object/);
  assert.equal(unparsed[0].buyerUid, "uid5");
});

test("a malformed receipt never discards an otherwise valid purchase", () => {
  const { purchases, unparsed } = parsePurchaseMap("uid6", "X", {
    k: { ...APPLE_FLAT, receipt: "{not json" },
  });
  assert.equal(unparsed.length, 0);
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].storeOrderId, null);
  assert.equal(purchases[0].purchaseId, "k", "falls back to the map key");
});

test("platform normalisation covers the strings the game emits", () => {
  assert.equal(normalisePlatform("IPhonePlayer"), "ios");
  assert.equal(normalisePlatform("Android"), "android");
  assert.equal(normalisePlatform("OSXEditor"), "editor");
  assert.equal(normalisePlatform("WindowsEditor"), "editor");
  // Casing variants must not fragment the platform breakdown.
  assert.equal(normalisePlatform("android"), normalisePlatform("Android"));
});

test("buyer name falls back across the field names in use", () => {
  assert.equal(buyerNameFrom({ username: "a", displayName: "b" }), "a");
  assert.equal(buyerNameFrom({ displayName: "b" }), "b");
  assert.equal(buyerNameFrom({ name: "c" }), "c");
  assert.equal(buyerNameFrom({ username: "   " }), null);
  assert.equal(buyerNameFrom({}), null);
});
