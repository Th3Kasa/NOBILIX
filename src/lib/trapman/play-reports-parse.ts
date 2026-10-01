/**
 * Parsing for the Google Play reports bucket (Play Console → Download reports).
 *
 * Google does not offer downloads or revenue through an API. It writes them as
 * monthly files into a private Cloud Storage bucket instead:
 *
 *   stats/installs/installs_{package}_{YYYYMM}_overview.csv   daily installs
 *   sales/salesreport_{YYYYMM}.zip                           one row per order
 *   earnings/earnings_{YYYYMM}_*.zip                         payout lines, after
 *                                                            Google's fee and tax
 *
 * The files differ in awkward ways — the installs CSV is UTF-16 while the
 * zipped CSVs are UTF-8, and Google has renamed columns over the years — so
 * every column is found by header name, never by position, and every file is
 * decoded by sniffing its byte-order mark.
 *
 * Pure and dependency-free so it runs under `node --test` without a bucket.
 * Sales rows come out in the same shape as Apple's, so both stores share one
 * tested aggregation (`summariseStoreSales`).
 */

import type { AppleSalesRow } from "./store-reports";

// ─── Decoding ────────────────────────────────────────────────────────────────

/**
 * Bytes → text, honouring whatever encoding the file announces.
 *
 * Reading a UTF-16 file as UTF-8 yields a NUL between every character; the
 * headers then match nothing and the report silently parses as empty.
 */
export function decodeReportText(bytes: Uint8Array): string {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    return b.subarray(2).toString("utf16le");
  }
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    const swapped = Buffer.from(b.subarray(2));
    swapped.swap16();
    return swapped.toString("utf16le");
  }
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
    return b.subarray(3).toString("utf8");
  }
  // No BOM: UTF-16LE text of ASCII headers has a NUL in every odd byte.
  if (b.length >= 4 && b[1] === 0 && b[3] === 0) return b.toString("utf16le");
  return b.toString("utf8");
}

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF or LF line endings. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

/**
 * Turn a CSV into records, reading columns by (alternative) header names
 * case-insensitively. Returns null when a required column is missing, so a
 * renamed column fails loudly instead of quietly reading as zeroes.
 */
function readTable(
  text: string,
  columns: Record<string, string[]>,
  required: string[],
): Record<string, string>[] | null {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const names = header.map((h) => h.trim().toLowerCase());
  const index: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(columns)) {
    index[key] =
      aliases.map((a) => names.indexOf(a.toLowerCase())).find((i) => i >= 0) ??
      -1;
  }
  if (required.some((k) => index[k] < 0)) return null;

  return body.map((cells) => {
    const rec: Record<string, string> = {};
    for (const [key, i] of Object.entries(index)) {
      rec[key] = i >= 0 ? (cells[i] ?? "").trim() : "";
    }
    return rec;
  });
}

function num(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** "2026-09-14", "Sep 14, 2026" or "09/14/2026" → "2026-09-14"; "" if unreadable. */
export function toIsoDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Parse as UTC so the date never shifts a day with the server's timezone.
  const t = Date.parse(`${s} UTC`);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  const fallback = Date.parse(s);
  return Number.isNaN(fallback)
    ? ""
    : new Date(fallback).toISOString().slice(0, 10);
}

// ─── Which files ─────────────────────────────────────────────────────────────

/**
 * The `count` most recent calendar months as YYYYMM, oldest first.
 * `now` is a parameter so the window is deterministic in tests.
 */
export function playMonths(now: number, count: number): string[] {
  const d = new Date(now);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    months.push(
      `${m.getUTCFullYear()}${String(m.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

export type PlayReportKind = "installs" | "sales" | "earnings";

/**
 * Identify a bucket object, returning its kind and month, or null for files
 * the console does not read (other apps' stats, other report types).
 */
export function classifyPlayObject(
  name: string,
  packageName: string,
): { kind: PlayReportKind; month: string } | null {
  const installs = name.match(
    /^stats\/installs\/installs_(.+)_(\d{6})_overview\.csv$/,
  );
  if (installs) {
    return installs[1] === packageName
      ? { kind: "installs", month: installs[2] }
      : null;
  }
  const sales = name.match(/^sales\/salesreport_(\d{6})\.zip$/);
  if (sales) return { kind: "sales", month: sales[1] };
  const earnings = name.match(/^earnings\/earnings_(\d{6})[^/]*\.zip$/);
  if (earnings) return { kind: "earnings", month: earnings[1] };
  return null;
}

// ─── Installs ────────────────────────────────────────────────────────────────

export interface PlayInstallDay {
  date: string;
  /** New installs by users who had never installed before. */
  userInstalls: number;
  userUninstalls: number;
  /** Devices with the app installed at the end of the day. */
  activeDevices: number;
}

/** Parse `installs_{package}_{YYYYMM}_overview.csv`. Null if the layout is unrecognised. */
export function parsePlayInstalls(
  csv: string,
  packageName: string,
): PlayInstallDay[] | null {
  const rows = readTable(
    csv,
    {
      date: ["Date"],
      pkg: ["Package Name"],
      userInstalls: [
        "Daily User Installs",
        "Install events",
        "Daily Device Installs",
      ],
      userUninstalls: [
        "Daily User Uninstalls",
        "Uninstall events",
        "Daily Device Uninstalls",
      ],
      activeDevices: ["Active Device Installs", "Total User Installs"],
    },
    ["date", "userInstalls"],
  );
  if (!rows) return null;
  return rows
    .filter((r) => !r.pkg || r.pkg === packageName)
    .map((r) => ({
      date: toIsoDate(r.date),
      userInstalls: num(r.userInstalls),
      userUninstalls: num(r.userUninstalls),
      activeDevices: num(r.activeDevices),
    }))
    .filter((d) => d.date !== "");
}

// ─── Sales (one row per order) ───────────────────────────────────────────────

/** A sales-report status that means the money went back to the buyer. */
const REVERSED = /refund|chargeback|revers/i;
/** Orders that never charged anyone. */
const NEVER_CHARGED = /cancel|declin|pending/i;

/**
 * Parse `salesreport_{YYYYMM}.csv` into sales rows in Apple's shape.
 *
 * The sales report is account-wide, so rows for other apps are dropped. An
 * order can appear once per status it passed through, so rows are grouped by
 * order number: a charge later refunded counts as one sale and one refund (net
 * zero, refund counted) rather than two sales. Amounts are the item price the
 * buyer paid before tax — gross, before Google's fee. What actually reaches the
 * bank comes from the earnings report.
 */
export function parsePlaySales(
  csv: string,
  packageName: string,
): AppleSalesRow[] | null {
  const rows = readTable(
    csv,
    {
      order: ["Order Number"],
      date: ["Order Charged Date", "Order Date"],
      status: ["Financial Status"],
      pkg: ["Product ID"],
      type: ["Product Type"],
      sku: ["SKU ID", "Sku Id"],
      title: ["Product Title"],
      currency: ["Currency of Sale"],
      price: ["Item Price"],
      country: ["Country of Buyer", "Buyer Country"],
    },
    ["order", "date", "currency", "price"],
  );
  if (!rows) return null;

  const orders = new Map<
    string,
    { first: Record<string, string>; reversed: boolean; charged: boolean }
  >();
  for (const r of rows) {
    if (r.pkg && r.pkg !== packageName) continue;
    const entry = orders.get(r.order) ?? {
      first: r,
      reversed: false,
      charged: false,
    };
    if (REVERSED.test(r.status)) entry.reversed = true;
    else if (!NEVER_CHARGED.test(r.status)) entry.charged = true;
    orders.set(r.order, entry);
  }

  const out: AppleSalesRow[] = [];
  for (const { first: r, reversed, charged } of orders.values()) {
    // A lone refund row still implies a charge — it may sit in last month's file.
    if (!charged && !reversed) continue;
    const date = toIsoDate(r.date);
    if (!date) continue;
    const isApp = /paid/i.test(r.type);
    const price = Math.abs(num(r.price));
    const sale: AppleSalesRow = {
      sku: r.sku || r.pkg || packageName,
      title: r.title,
      // summariseStoreSales classifies by Apple's codes: "IA…" is an in-app
      // purchase and anything else is an app sale.
      productTypeIdentifier: isApp ? "PLAY_APP" : "IA_PLAY",
      units: 1,
      developerProceeds: price,
      customerPrice: price,
      customerCurrency: r.currency.toUpperCase(),
      currencyOfProceeds: r.currency.toUpperCase(),
      countryCode: r.country.toUpperCase(),
      beginDate: date,
      device: "Android",
    };
    out.push(sale);
    if (reversed) out.push({ ...sale, units: -1 });
  }
  return out;
}

// ─── Earnings (after Google's fee and tax) ───────────────────────────────────

export interface PlayMonthEarnings {
  month: string;
  /** Payout currency, set in the Play payments profile. */
  currency: string;
  /** Sum of every line — charges, Google's fee, tax, refunds. What gets paid out. */
  net: number;
  /** Charge lines only (net of charge refunds): before Google's fee and tax. */
  gross: number;
  byProduct: { sku: string; title: string; net: number }[];
}

/**
 * Parse one month's earnings CSV(s) for this app.
 *
 * Every line is signed — a sale is a positive "Charge" plus a negative "Google
 * fee" and sometimes a "Tax" line — so summing all of them gives exactly what
 * Google pays out. No fee percentage is ever assumed.
 */
export function parsePlayEarnings(
  csvs: string[],
  month: string,
  packageName: string,
): PlayMonthEarnings | null {
  let currency = "";
  let net = 0;
  let gross = 0;
  let recognised = false;
  const products = new Map<string, { sku: string; title: string; net: number }>();

  for (const csv of csvs) {
    const rows = readTable(
      csv,
      {
        type: ["Transaction Type"],
        pkg: ["Product id", "Product ID"],
        sku: ["Sku Id", "SKU ID"],
        title: ["Product Title"],
        currency: ["Merchant Currency"],
        amount: ["Amount (Merchant Currency)"],
      },
      ["currency", "amount"],
    );
    if (!rows) continue;
    recognised = true;
    for (const r of rows) {
      if (r.pkg && r.pkg !== packageName) continue;
      const amount = num(r.amount);
      currency ||= r.currency.toUpperCase();
      net += amount;
      if (/^charge/i.test(r.type)) gross += amount;
      const key = r.sku || r.pkg || packageName;
      const p = products.get(key) ?? { sku: key, title: r.title, net: 0 };
      p.net += amount;
      products.set(key, p);
    }
  }

  if (!recognised) return null;
  const cents = (n: number) => Math.round(n * 100) / 100;
  return {
    month,
    currency,
    net: cents(net),
    gross: cents(gross),
    byProduct: [...products.values()]
      .map((p) => ({ ...p, net: cents(p.net) }))
      .sort((a, b) => b.net - a.net),
  };
}
