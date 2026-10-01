import { test } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  decodeReportText,
  parseCsv,
  toIsoDate,
  playMonths,
  classifyPlayObject,
  parsePlayInstalls,
  parsePlaySales,
  parsePlayEarnings,
} from "../src/lib/trapman/play-reports-parse.ts";
import { summariseStoreSales } from "../src/lib/trapman/store-reports.ts";
import { readZipCsvs } from "../src/lib/trapman/zip.ts";

const PKG = "com.cultshotta.trapman";

// ─── Decoding ────────────────────────────────────────────────────────────────

test("UTF-16LE installs files (with a byte-order mark) decode to plain text", () => {
  const text = "Date,Package Name\n2026-09-01,com.cultshotta.trapman\n";
  const bytes = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
  assert.equal(decodeReportText(bytes), text);
});

test("UTF-16 without a byte-order mark is still detected", () => {
  const text = "Date,Package Name\n";
  assert.equal(decodeReportText(Buffer.from(text, "utf16le")), text);
});

test("UTF-8 with and without a byte-order mark decodes", () => {
  const text = "Order Number,Item Price\n";
  assert.equal(decodeReportText(Buffer.from(text, "utf8")), text);
  assert.equal(
    decodeReportText(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)])),
    text,
  );
});

test("CSV handles quoted commas, escaped quotes, CRLF and a trailing newline", () => {
  assert.deepEqual(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3\r\n'), [
    ["a", "b, c", 'say "hi"'],
    ["1", "2", "3"],
  ]);
});

test("dates in Google's formats normalise without shifting a day", () => {
  assert.equal(toIsoDate("2026-09-14"), "2026-09-14");
  assert.equal(toIsoDate("Sep 14, 2026"), "2026-09-14");
  assert.equal(toIsoDate("nonsense"), "");
});

// ─── Which files ─────────────────────────────────────────────────────────────

test("the month window crosses a year boundary", () => {
  assert.deepEqual(playMonths(Date.UTC(2027, 0, 15), 3), ["202611", "202612", "202701"]);
});

test("bucket objects are classified, and other apps' stats are ignored", () => {
  assert.deepEqual(
    classifyPlayObject(`stats/installs/installs_${PKG}_202609_overview.csv`, PKG),
    { kind: "installs", month: "202609" },
  );
  assert.equal(
    classifyPlayObject("stats/installs/installs_com.other.app_202609_overview.csv", PKG),
    null,
  );
  assert.equal(classifyPlayObject(`stats/installs/installs_${PKG}_202609_country.csv`, PKG), null);
  assert.deepEqual(classifyPlayObject("sales/salesreport_202609.zip", PKG), {
    kind: "sales",
    month: "202609",
  });
  assert.deepEqual(classifyPlayObject("earnings/earnings_202609_4978181013-0.zip", PKG), {
    kind: "earnings",
    month: "202609",
  });
});

// ─── Installs ────────────────────────────────────────────────────────────────

const INSTALLS_HEADER =
  "Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Daily Device Upgrades,Total User Installs,Daily User Installs,Daily User Uninstalls,Active Device Installs,Install events,Update events,Uninstall events";

test("installs parse by column name and keep only this app", () => {
  const csv = [
    INSTALLS_HEADER,
    `2026-09-01,${PKG},12,2,0,500,10,1,480,13,0,2`,
    `2026-09-02,${PKG},"1,204",3,0,1700,"1,100",2,1600,9,0,3`,
    `2026-09-02,com.other.app,99,0,0,0,99,0,0,0,0,0`,
  ].join("\n");
  assert.deepEqual(parsePlayInstalls(csv, PKG), [
    { date: "2026-09-01", userInstalls: 10, userUninstalls: 1, activeDevices: 480 },
    { date: "2026-09-02", userInstalls: 1100, userUninstalls: 2, activeDevices: 1600 },
  ]);
});

test("an installs file with unrecognised columns reports null, not zeroes", () => {
  assert.equal(parsePlayInstalls("Day,Something\n2026-09-01,4", PKG), null);
});

// ─── Sales ───────────────────────────────────────────────────────────────────

const SALES_HEADER =
  "Order Number,Order Charged Date,Order Charged Timestamp,Financial Status,Device Model,Product Title,Product ID,Product Type,SKU ID,Currency of Sale,Item Price,Taxes Collected,Charged Amount,City of Buyer,State of Buyer,Postal Code of Buyer,Country of Buyer";

const sale = (order, date, status, sku, currency, price, country, type = "inapp", pkg = PKG) =>
  `${order},${date},0,${status},pixel,"Hearts (Trap-Man)",${pkg},${type},${sku},${currency},${price},0,${price},,,,${country}`;

test("sales become one row per order, at the price before tax", () => {
  const rows = parsePlaySales(
    [
      SALES_HEADER,
      sale("GPA.1", "2026-09-10", "Charged", "hearts_tier_1", "AUD", "1.99", "AU"),
      sale("GPA.2", "2026-09-11", "Charged", "hearts_tier_2", "USD", "4.99", "US"),
    ].join("\n"),
    PKG,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(
    { ...rows[0] },
    {
      sku: "hearts_tier_1",
      title: "Hearts (Trap-Man)",
      productTypeIdentifier: "IA_PLAY",
      units: 1,
      developerProceeds: 1.99,
      customerPrice: 1.99,
      customerCurrency: "AUD",
      currencyOfProceeds: "AUD",
      countryCode: "AU",
      beginDate: "2026-09-10",
      device: "Android",
    },
  );
});

test("a charged-then-refunded order nets to zero and counts as one refund", () => {
  const rows = parsePlaySales(
    [
      SALES_HEADER,
      sale("GPA.1", "2026-09-10", "Charged", "hearts_tier_1", "AUD", "1.99", "AU"),
      sale("GPA.1", "2026-09-10", "Refund", "hearts_tier_1", "AUD", "1.99", "AU"),
      sale("GPA.2", "2026-09-12", "Charged", "hearts_tier_1", "AUD", "1.99", "AU"),
    ].join("\n"),
    PKG,
  );
  const s = summariseStoreSales(rows);
  assert.equal(s.iapUnits, 1);
  assert.equal(s.refundedUnits, 1);
  assert.deepEqual(s.proceedsByCurrency, [{ currency: "AUD", total: 1.99 }]);
});

test("cancelled orders and other apps' orders are not sales", () => {
  const rows = parsePlaySales(
    [
      SALES_HEADER,
      sale("GPA.1", "2026-09-10", "Cancelled", "hearts_tier_1", "AUD", "1.99", "AU"),
      sale("GPA.2", "2026-09-10", "Charged", "gems", "AUD", "9.99", "AU", "inapp", "com.other.app"),
    ].join("\n"),
    PKG,
  );
  assert.deepEqual(rows, []);
});

test("paid downloads are counted as app sales, not in-app purchases", () => {
  const rows = parsePlaySales(
    [SALES_HEADER, sale("GPA.9", "2026-09-10", "Charged", PKG, "AUD", "2.99", "AU", "paidapp")].join("\n"),
    PKG,
  );
  const s = summariseStoreSales(rows);
  assert.equal(s.appUnits, 1);
  assert.equal(s.iapUnits, 0);
});

test("a sales file with unrecognised columns reports null", () => {
  assert.equal(parsePlaySales("Foo,Bar\n1,2", PKG), null);
});

// ─── Earnings ────────────────────────────────────────────────────────────────

const EARNINGS_HEADER =
  "Description,Transaction Date,Transaction Time,Tax Type,Transaction Type,Refund Type,Product Title,Product id,Product Type,Sku Id,Hardware,Buyer Country,Buyer State,Buyer Postal Code,Buyer Currency,Amount (Buyer Currency),Currency Conversion Rate,Merchant Currency,Amount (Merchant Currency)";

const line = (type, sku, amount, pkg = PKG) =>
  `GPA.1,"Sep 10, 2026",1:00:00 AM PDT,,${type},,Hearts,${pkg},1,${sku},phone,AU,,,AUD,0,1,AUD,${amount}`;

test("earnings net out Google's fee and tax, and keep the gross separately", () => {
  const e = parsePlayEarnings(
    [
      [
        EARNINGS_HEADER,
        line("Charge", "hearts_tier_1", "1.81"),
        line("Google fee", "hearts_tier_1", "-0.27"),
        line("Charge", "hearts_tier_2", "4.54"),
        line("Google fee", "hearts_tier_2", "-0.68"),
        line("Charge", "gems", "100", "com.other.app"),
      ].join("\n"),
    ],
    "202609",
    PKG,
  );
  assert.equal(e.currency, "AUD");
  assert.equal(e.net, 5.4);
  assert.equal(e.gross, 6.35);
  assert.deepEqual(
    e.byProduct.map((p) => [p.sku, p.net]),
    [["hearts_tier_2", 3.86], ["hearts_tier_1", 1.54]],
  );
});

test("earnings split across several files in one month add together", () => {
  const e = parsePlayEarnings(
    [
      [EARNINGS_HEADER, line("Charge", "hearts_tier_1", "1.81")].join("\n"),
      [EARNINGS_HEADER, line("Google fee", "hearts_tier_1", "-0.27")].join("\n"),
    ],
    "202609",
    PKG,
  );
  assert.equal(e.net, 1.54);
});

test("earnings with unrecognised columns report null", () => {
  assert.equal(parsePlayEarnings(["Foo\n1"], "202609", PKG), null);
});

// ─── Zip ─────────────────────────────────────────────────────────────────────

test("CSV files come out of a zip; anything else is skipped", () => {
  const zip = zipSync({
    "salesreport_202609.csv": strToU8(`${SALES_HEADER}\n`),
    "readme.txt": strToU8("ignore me"),
  });
  const files = readZipCsvs(zip);
  assert.deepEqual(files.map((f) => f.name), ["salesreport_202609.csv"]);
  assert.equal(decodeReportText(files[0].bytes), `${SALES_HEADER}\n`);
});
