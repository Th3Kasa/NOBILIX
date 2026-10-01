/**
 * Parsing and aggregation for the stores' own sales reports.
 *
 * This is the authoritative view of what actually sold. The console's other
 * purchase figures are derived from what the *game* wrote into Firestore,
 * which is a claim by the client; a store's sales report is the store's own
 * accounting, already net of refunds, test purchases and promo redemptions.
 *
 * It also side-steps the iOS receipt problem completely. TrapMan stores an
 * empty `receipt` for every iPhone purchase, so no individual iOS purchase can
 * be verified — but Apple's Sales and Trends report is aggregate, keyed by
 * date and SKU rather than by transaction, so it tells us how many iPhone
 * sales there really were regardless of what the game did or didn't record.
 *
 * Pure and dependency-free on purpose: report parsing is where a subtle bug
 * silently misstates revenue, so it is unit-tested against real report shapes
 * rather than exercised only through a live API call.
 */

/** Apple publishes a day's report in arrears, so today's never exists yet. */
export const REPORT_LAG_DAYS = 1;

/**
 * ISO dates for the `days` report-days ending `lagDays` before `now`, oldest
 * first.
 *
 * Asking for today's report is always a wasted request — Apple has not
 * published it — so the window deliberately stops short. `now` is a parameter
 * rather than a clock read so the window is deterministic and testable.
 */
export function reportDateRange(
  now: number,
  days: number,
  lagDays: number = REPORT_LAG_DAYS,
): string[] {
  const dates: string[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = days; i >= 1; i--) {
    dates.push(new Date(now - (i + lagDays - 1) * dayMs).toISOString().slice(0, 10));
  }
  return dates;
}

/** One row of an Apple SALES/SUMMARY report, only the columns we use. */
export interface AppleSalesRow {
  sku: string;
  title: string;
  /** Apple's product-type code, e.g. "1F" (app) or "IA1" (in-app purchase). */
  productTypeIdentifier: string;
  /** Negative on refunds — Apple restates rather than issuing a separate row. */
  units: number;
  /** Per-unit proceeds to the developer, in `currencyOfProceeds`. */
  developerProceeds: number;
  /** Per-unit price the customer paid, in `customerCurrency`. */
  customerPrice: number;
  customerCurrency: string;
  currencyOfProceeds: string;
  countryCode: string;
  /** ISO date the row covers. */
  beginDate: string;
  device: string;
}

export type StoreSaleKind =
  /** A first-time app download or purchase. */
  | "app"
  /** An update to an already-installed app — not a new customer. */
  | "update"
  /** An in-app purchase. */
  | "iap";

/**
 * Classify Apple's product-type identifier.
 *
 * Apple publishes a long and occasionally-extended list of codes. Rather than
 * enumerate every one — and silently misfile anything new — this keys on the
 * documented prefixes: `IA…`/`FI…` are in-app purchases, `7…` are updates, and
 * everything else is an app download. A code Apple adds tomorrow lands in the
 * right bucket instead of being dropped.
 */
export function classifyProductType(identifier: string): StoreSaleKind {
  const id = identifier.trim().toUpperCase();
  if (id.startsWith("IA") || id.startsWith("FI")) return "iap";
  if (id.startsWith("7")) return "update";
  return "app";
}

/** Parse a number that Apple may render as "", "0.00" or "-1". */
function parseNum(raw: string | undefined): number {
  if (raw == null) return 0;
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Parse the tab-separated body of an Apple sales report.
 *
 * Columns are located by header name, never by index: Apple has added columns
 * over the years (Client, Order Type, Preserved Pricing…), and a positional
 * parser silently reads the wrong field the moment that happens.
 */
export function parseAppleSalesReport(tsv: string): AppleSalesRow[] {
  const lines = tsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split("\t").map((h) => h.trim());
  const col = (name: string): number => header.indexOf(name);

  const idx = {
    sku: col("SKU"),
    title: col("Title"),
    productType: col("Product Type Identifier"),
    units: col("Units"),
    proceeds: col("Developer Proceeds"),
    customerPrice: col("Customer Price"),
    customerCurrency: col("Customer Currency"),
    proceedsCurrency: col("Currency of Proceeds"),
    country: col("Country Code"),
    beginDate: col("Begin Date"),
    device: col("Device"),
  };

  // Without these the row cannot be interpreted at all.
  if (idx.units === -1 || idx.productType === -1) return [];

  const at = (cells: string[], i: number): string =>
    i === -1 ? "" : (cells[i] ?? "").trim();

  return lines.slice(1).map((line) => {
    const c = line.split("\t");
    return {
      sku: at(c, idx.sku),
      title: at(c, idx.title),
      productTypeIdentifier: at(c, idx.productType),
      units: parseNum(at(c, idx.units)),
      developerProceeds: parseNum(at(c, idx.proceeds)),
      customerPrice: parseNum(at(c, idx.customerPrice)),
      customerCurrency: at(c, idx.customerCurrency),
      currencyOfProceeds: at(c, idx.proceedsCurrency),
      countryCode: at(c, idx.country),
      beginDate: normaliseAppleDate(at(c, idx.beginDate)),
      device: at(c, idx.device),
    } satisfies AppleSalesRow;
  });
}

/**
 * Apple writes Begin Date as MM/DD/YYYY in sales reports. Normalise to ISO so
 * dates sort and compare correctly everywhere else in the console.
 */
export function normaliseAppleDate(raw: string): string {
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  return raw;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export interface StoreProductSales {
  sku: string;
  title: string;
  kind: StoreSaleKind;
  units: number;
  proceeds: number;
  currency: string;
}

export interface StoreCountrySales {
  countryCode: string;
  units: number;
}

export interface StoreDailySales {
  date: string;
  appUnits: number;
  iapUnits: number;
  proceeds: number;
}

export interface StoreSalesSummary {
  /** First-time app downloads/purchases, net of refunds. */
  appUnits: number;
  /** In-app purchase units, net of refunds. */
  iapUnits: number;
  /** App updates — reported by Apple but never counted as sales. */
  updateUnits: number;
  /** Units returned: the negative rows, as a positive number. */
  refundedUnits: number;
  /** Developer proceeds, per currency of proceeds. */
  proceedsByCurrency: { currency: string; total: number }[];
  products: StoreProductSales[];
  countries: StoreCountrySales[];
  daily: StoreDailySales[];
  /** Days of report actually included. */
  daysCovered: number;
}

/**
 * Roll report rows up into the figures the console shows.
 *
 * Units are summed rather than counted: Apple represents a refund as a
 * negative-unit row against the original SKU, so summing yields the net
 * position automatically. Refunds are also surfaced separately, because "12
 * sold, 4 refunded" and "8 sold" are the same net number but very different
 * news during a presale.
 */
export function summariseStoreSales(rows: AppleSalesRow[]): StoreSalesSummary {
  let appUnits = 0;
  let iapUnits = 0;
  let updateUnits = 0;
  let refundedUnits = 0;

  const proceedsMap = new Map<string, number>();
  const productMap = new Map<string, StoreProductSales>();
  const countryMap = new Map<string, number>();
  const dailyMap = new Map<string, StoreDailySales>();
  const dates = new Set<string>();

  for (const row of rows) {
    const kind = classifyProductType(row.productTypeIdentifier);

    if (kind === "app") appUnits += row.units;
    else if (kind === "iap") iapUnits += row.units;
    else updateUnits += row.units;

    if (row.units < 0) refundedUnits += Math.abs(row.units);

    // Updates are neither revenue nor a sale; they must not reach any total.
    if (kind === "update") continue;

    if (row.beginDate) dates.add(row.beginDate);

    const proceeds = row.units * row.developerProceeds;
    if (proceeds !== 0 && row.currencyOfProceeds) {
      proceedsMap.set(
        row.currencyOfProceeds,
        (proceedsMap.get(row.currencyOfProceeds) ?? 0) + proceeds,
      );
    }

    const key = `${row.sku}::${row.currencyOfProceeds}`;
    const product =
      productMap.get(key) ??
      ({
        sku: row.sku,
        title: row.title,
        kind,
        units: 0,
        proceeds: 0,
        currency: row.currencyOfProceeds,
      } satisfies StoreProductSales);
    product.units += row.units;
    product.proceeds += proceeds;
    productMap.set(key, product);

    if (row.countryCode) {
      countryMap.set(
        row.countryCode,
        (countryMap.get(row.countryCode) ?? 0) + row.units,
      );
    }

    if (row.beginDate) {
      const day =
        dailyMap.get(row.beginDate) ??
        ({
          date: row.beginDate,
          appUnits: 0,
          iapUnits: 0,
          proceeds: 0,
        } satisfies StoreDailySales);
      if (kind === "app") day.appUnits += row.units;
      else day.iapUnits += row.units;
      day.proceeds += proceeds;
      dailyMap.set(row.beginDate, day);
    }
  }

  return {
    appUnits,
    iapUnits,
    updateUnits,
    refundedUnits,
    proceedsByCurrency: [...proceedsMap.entries()]
      .map(([currency, total]) => ({ currency, total }))
      .sort((a, b) => b.total - a.total),
    products: [...productMap.values()].sort((a, b) => b.units - a.units),
    countries: [...countryMap.values()].length
      ? [...countryMap.entries()]
          .map(([countryCode, units]) => ({ countryCode, units }))
          .sort((a, b) => b.units - a.units)
      : [],
    daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    daysCovered: dates.size,
  };
}
