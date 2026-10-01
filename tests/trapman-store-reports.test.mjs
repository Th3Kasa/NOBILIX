import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseAppleSalesReport,
  summariseStoreSales,
  classifyProductType,
  normaliseAppleDate,
  reportDateRange,
} from "../src/lib/trapman/store-reports.ts";


/**
 * Apple's Sales and Trends report is the authoritative account of what sold on
 * iOS — the only one we have, since the game stores no usable iOS receipt. A
 * parsing bug here misstates revenue silently, so the real column layout and
 * the awkward cases (refunds, updates, added columns) are all pinned down.
 */

const HEADER = [
  "Provider",
  "Provider Country",
  "SKU",
  "Developer",
  "Title",
  "Version",
  "Product Type Identifier",
  "Units",
  "Developer Proceeds",
  "Begin Date",
  "End Date",
  "Customer Currency",
  "Country Code",
  "Currency of Proceeds",
  "Apple Identifier",
  "Customer Price",
  "Promo Code",
  "Parent Identifier",
  "Subscription",
  "Period",
  "Category",
  "CMB",
  "Device",
  "Supported Platforms",
  "Proceeds Reason",
  "Preserved Pricing",
  "Client",
  "Order Type",
].join("\t");

/** Build a report row in Apple's column order. */
function row({
  sku = "hearts_tier_1",
  title = "TrapMan",
  productType = "IA1",
  units = "1",
  proceeds = "0.70",
  beginDate = "08/20/2026",
  customerCurrency = "AUD",
  country = "AU",
  proceedsCurrency = "AUD",
  customerPrice = "0.99",
  device = "iPhone",
} = {}) {
  return [
    "APPLE", "AU", sku, "Cult Shotta", title, "1.0", productType, units,
    proceeds, beginDate, beginDate, customerCurrency, country,
    proceedsCurrency, "1234567890", customerPrice, "", "", "", "", "Games",
    "", device, "iOS", "", "", "", "PURCHASE",
  ].join("\t");
}

const report = (...rows) => [HEADER, ...rows].join("\n");

// ─── Parsing ─────────────────────────────────────────────────────────────────

test("reads the columns we depend on out of a real report layout", () => {
  const rows = parseAppleSalesReport(report(row()));
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.sku, "hearts_tier_1");
  assert.equal(r.productTypeIdentifier, "IA1");
  assert.equal(r.units, 1);
  assert.equal(r.developerProceeds, 0.7);
  assert.equal(r.customerPrice, 0.99);
  assert.equal(r.currencyOfProceeds, "AUD");
  assert.equal(r.countryCode, "AU");
  assert.equal(r.beginDate, "2026-08-20", "dates are normalised to ISO");
});

test("columns are found by name, so an added column shifts nothing", () => {
  // Apple has repeatedly appended columns. A positional parser would silently
  // read the wrong field the day that happens again.
  const shuffled = ["Units", "SKU", "Product Type Identifier", "Developer Proceeds", "Currency of Proceeds"].join("\t");
  const rows = parseAppleSalesReport(`${shuffled}\n3\tad_free_play\tIA9\t13.99\tAUD`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].units, 3);
  assert.equal(rows[0].sku, "ad_free_play");
  assert.equal(rows[0].developerProceeds, 13.99);
});

test("an empty or header-only report yields no rows, not a crash", () => {
  assert.deepEqual(parseAppleSalesReport(""), []);
  assert.deepEqual(parseAppleSalesReport(HEADER), []);
  assert.deepEqual(parseAppleSalesReport("garbage\nwithout\tunits"), []);
});

test("Apple's MM/DD/YYYY dates normalise, and anything else passes through", () => {
  assert.equal(normaliseAppleDate("08/20/2026"), "2026-08-20");
  assert.equal(normaliseAppleDate("2026-08-20"), "2026-08-20");
  assert.equal(normaliseAppleDate(""), "");
});

// ─── Product classification ──────────────────────────────────────────────────

test("in-app purchases, downloads and updates are told apart", () => {
  assert.equal(classifyProductType("IA1"), "iap");
  assert.equal(classifyProductType("IA9"), "iap");
  assert.equal(classifyProductType("IAY"), "iap");
  assert.equal(classifyProductType("FI1"), "iap");
  assert.equal(classifyProductType("1"), "app");
  assert.equal(classifyProductType("1F"), "app");
  assert.equal(classifyProductType("1T"), "app");
  assert.equal(classifyProductType("7"), "update");
  assert.equal(classifyProductType("7F"), "update");
});

test("an unfamiliar product code lands in a bucket rather than vanishing", () => {
  // Apple extends this list; a new app-type code must still count as a sale.
  assert.equal(classifyProductType("1Z"), "app");
  assert.equal(classifyProductType("iaX"), "iap", "matching is case-insensitive");
});

// ─── Aggregation ─────────────────────────────────────────────────────────────

test("sums units and proceeds per product", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ sku: "hearts_tier_1", units: "3", proceeds: "0.70" }),
        row({ sku: "ad_free_play", units: "2", proceeds: "13.99", productType: "IA9" }),
      ),
    ),
  );

  assert.equal(s.iapUnits, 5);
  assert.equal(s.appUnits, 0);
  assert.equal(s.products.length, 2);

  const total = s.proceedsByCurrency.find((p) => p.currency === "AUD").total;
  assert.ok(
    Math.abs(total - (3 * 0.7 + 2 * 13.99)) < 1e-9,
    "proceeds are per-unit and must be multiplied by units",
  );
});

test("a refund is a negative-unit row and nets off automatically", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ sku: "ad_free_play", units: "5", proceeds: "13.99", productType: "IA9" }),
        row({ sku: "ad_free_play", units: "-2", proceeds: "13.99", productType: "IA9" }),
      ),
    ),
  );

  assert.equal(s.iapUnits, 3, "5 sold minus 2 refunded");
  // Net revenue, not gross — the refunded proceeds are given back.
  const total = s.proceedsByCurrency.find((p) => p.currency === "AUD").total;
  assert.ok(Math.abs(total - 3 * 13.99) < 1e-9);
  // But the refunds stay visible: "5 sold, 2 refunded" is different news.
  assert.equal(s.refundedUnits, 2);
});

test("app updates are reported by Apple but never counted as sales", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ productType: "1F", units: "10", proceeds: "0" }),
        row({ productType: "7F", units: "400", proceeds: "0" }),
      ),
    ),
  );

  assert.equal(s.appUnits, 10);
  assert.equal(s.updateUnits, 400);
  assert.equal(
    s.products.length,
    1,
    "updates must not appear as a product that sold",
  );
  assert.equal(s.daily.reduce((n, d) => n + d.appUnits, 0), 10);
});

test("downloads and in-app purchases are counted separately", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ productType: "1F", sku: "trapman", units: "40", proceeds: "0" }),
        row({ productType: "IA1", sku: "hearts_tier_1", units: "6" }),
      ),
    ),
  );
  assert.equal(s.appUnits, 40);
  assert.equal(s.iapUnits, 6);
});

test("units are grouped by country and by day", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ country: "AU", units: "3", beginDate: "08/20/2026" }),
        row({ country: "US", units: "5", beginDate: "08/20/2026" }),
        row({ country: "AU", units: "2", beginDate: "08/21/2026" }),
      ),
    ),
  );

  assert.deepEqual(s.countries, [
    { countryCode: "AU", units: 5 },
    { countryCode: "US", units: 5 },
  ].sort((a, b) => b.units - a.units));

  assert.equal(s.daily.length, 2);
  assert.equal(s.daily[0].date, "2026-08-20", "days come back oldest first");
  assert.equal(s.daily[0].iapUnits, 8);
  assert.equal(s.daily[1].iapUnits, 2);
  assert.equal(s.daysCovered, 2);
});

test("proceeds in different currencies are never added together", () => {
  const s = summariseStoreSales(
    parseAppleSalesReport(
      report(
        row({ proceedsCurrency: "AUD", units: "1", proceeds: "13.99" }),
        row({ proceedsCurrency: "USD", units: "1", proceeds: "13.99" }),
      ),
    ),
  );
  assert.equal(s.proceedsByCurrency.length, 2);
});

test("an empty report summarises to zeroes rather than nulls", () => {
  const s = summariseStoreSales([]);
  assert.equal(s.appUnits, 0);
  assert.equal(s.iapUnits, 0);
  assert.deepEqual(s.proceedsByCurrency, []);
  assert.deepEqual(s.products, []);
  assert.deepEqual(s.countries, []);
  assert.equal(s.daysCovered, 0);
});

// ─── Report date window ──────────────────────────────────────────────────────

test("report dates stop short of today, which Apple has not published yet", () => {
  const now = Date.UTC(2026, 7, 26, 12, 0, 0); // 2026-08-26
  const dates = reportDateRange(now, 3);
  assert.deepEqual(dates, ["2026-08-23", "2026-08-24", "2026-08-25"]);
  assert.ok(!dates.includes("2026-08-26"), "today's report does not exist yet");
});
