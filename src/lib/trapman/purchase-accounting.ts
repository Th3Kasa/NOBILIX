// A type-only import, which is erased at runtime — keeping this module free of
// *every* runtime dependency so the test runner can load it directly.
import type { NormalizedPurchase } from "./purchases";

/**
 * Purchase accounting: deciding what counts as a sale, and adding it up.
 *
 * Deliberately free of `server-only`, Firestore and `next/cache` imports. This
 * is the arithmetic behind the number the studio quotes — "how many people
 * bought during the presale" — and it has to be verifiable without standing up
 * a database. `purchases/data.ts` does the reading; this does the counting,
 * and `play-verify.ts` does the asking.
 */

// ─── Verification vocabulary ─────────────────────────────────────────────────

export type PurchaseVerdict =
  /** Money changed hands. */
  | "paid"
  /** Google licence-test purchase — free, and never revenue. */
  | "test"
  /** Redeemed with a promo code — real player, no money. */
  | "promo"
  /** Granted by a rewarded ad — no money. */
  | "rewarded"
  /** Cancelled or refunded by Google. */
  | "refunded"
  /** Still pending (e.g. cash payment not completed). */
  | "pending"
  /** The store could not be asked. */
  | "unverified";

export interface Verification {
  verdict: PurchaseVerdict;
  /** Which authority produced the verdict. */
  source: "google-play" | "none";
  /** Why a verdict is `unverified`, in words an operator can act on. */
  reason: string | null;
  /** Google's own acknowledgement state — outranks the client's copy. */
  acknowledged: boolean | null;
  /** Billing region Google recorded, when it supplies one. */
  regionCode: string | null;
  checkedAt: number;
}

/** Verdicts that mean "this is not a sale" and must never count as revenue. */
const NON_REVENUE: ReadonlySet<PurchaseVerdict> = new Set([
  "test",
  "promo",
  "rewarded",
  "refunded",
  "pending",
]);

/**
 * Whether this purchase counts toward revenue.
 *
 * Note that `unverified` counts. A purchase the store could not be asked about
 * is not presumed fake — every iOS purchase is unverifiable today, and
 * discarding them would understate real sales as badly as counting test
 * purchases overstates them. The console's answer is to count them and say
 * plainly how many are unconfirmed.
 */
export function isRevenue(v: Verification): boolean {
  return !NON_REVENUE.has(v.verdict);
}

/** True when the store positively confirmed this was a paid sale. */
export function isConfirmedSale(v: Verification): boolean {
  return v.verdict === "paid" && v.source === "google-play";
}

export const APPLE_UNVERIFIABLE_REASON =
  "The game stores an empty receipt for iOS purchases, so Apple cannot be asked to confirm them.";

// ─── Classification ──────────────────────────────────────────────────────────

/** Why a purchase is not counted as a real sale. `null` means it is one. */
export type ExclusionReason =
  /** Made in the Unity Editor — never reached a store. */
  | "editor"
  /** The buyer is on the console's internal-tester register. */
  | "test-account"
  /** Google Play says this was a licence-test purchase. */
  | "store-test"
  /** Redeemed with a promo code — a real player, but no money. */
  | "promo"
  /** Granted by a rewarded ad — no money. */
  | "rewarded"
  /** Google Play says this was cancelled or refunded. */
  | "refunded"
  /** Payment has not completed yet. */
  | "pending";

export interface PurchaseRecord extends NormalizedPurchase {
  verification: Verification;
  exclusion: ExclusionReason | null;
}

export interface ProductBreakdown {
  productId: string;
  count: number;
  revenue: number;
  currency: string;
}

/** Counts per exclusion reason, for the "where the numbers come from" panel. */
export type ExclusionCounts = Record<ExclusionReason, number>;

export const NO_EXCLUSIONS: ExclusionCounts = {
  editor: 0,
  "test-account": 0,
  "store-test": 0,
  promo: 0,
  rewarded: 0,
  refunded: 0,
  pending: 0,
};

export interface PurchasesSummary {
  /** Purchases counted as real sales. */
  sales: PurchaseRecord[];
  /** Every record in the window, counted or not. */
  all: PurchaseRecord[];
  totalCount: number;
  /** Distinct people who actually bought — the presale headline. */
  buyerCount: number;
  /**
   * Of `totalCount`, how many Google Play positively confirmed as paid. The
   * remainder are trusted rather than proven, and the console says which.
   */
  storeConfirmedCount: number;
  /** Counted sales that no store could confirm (all iOS, today). */
  unconfirmedCount: number;
  revenueByCurrency: { currency: string; total: number; count: number }[];
  products: ProductBreakdown[];
  platforms: { platform: string; count: number }[];
  exclusions: ExclusionCounts;
  excludedTotal: number;
}

/**
 * Decide, once, why a purchase is or is not a real sale.
 *
 * Order matters: the cheapest and most certain disqualifiers come first, so a
 * purchase an operator has already flagged never depends on a store round-trip.
 */
export function classify(
  purchase: NormalizedPurchase,
  verification: Verification,
  testUids: Set<string>,
): ExclusionReason | null {
  if (purchase.isEditorPurchase) return "editor";
  if (testUids.has(purchase.buyerUid)) return "test-account";
  if (isRevenue(verification)) return null;
  switch (verification.verdict) {
    case "test":
      return "store-test";
    case "promo":
      return "promo";
    case "rewarded":
      return "rewarded";
    case "refunded":
      return "refunded";
    case "pending":
      return "pending";
    default:
      return null;
  }
}

/**
 * Aggregate classified records, optionally within a time window.
 *
 * A date range is a filter over one scan rather than a second database pass,
 * which is what makes "just the presale" cheap to ask for.
 *
 * Revenue is never summed across currencies here: a purchase of ₹2,250 and one
 * of A$19.99 are two different amounts of money, and adding them produces a
 * number that means nothing. Conversion is the caller's job, with today's rate
 * and an honest note about what could not be converted.
 */
export function summarise(
  records: PurchaseRecord[],
  range?: { fromMs?: number; toMs?: number },
): PurchasesSummary {
  const all = records.filter((p) => {
    if (range?.fromMs != null && p.timestamp < range.fromMs) return false;
    if (range?.toMs != null && p.timestamp > range.toMs) return false;
    return true;
  });

  const sales = all.filter((p) => p.exclusion === null);

  const exclusions: ExclusionCounts = { ...NO_EXCLUSIONS };
  for (const p of all) {
    if (p.exclusion) exclusions[p.exclusion] += 1;
  }

  const revenueMap = new Map<string, { total: number; count: number }>();
  const productMap = new Map<string, ProductBreakdown>();
  const platformMap = new Map<string, number>();
  const buyers = new Set<string>();

  for (const p of sales) {
    buyers.add(p.buyerUid);

    const rev = revenueMap.get(p.currency) ?? { total: 0, count: 0 };
    rev.total += p.price;
    rev.count += 1;
    revenueMap.set(p.currency, rev);

    const productKey = `${p.productId}::${p.currency}`;
    const product =
      productMap.get(productKey) ??
      ({
        productId: p.productId,
        count: 0,
        revenue: 0,
        currency: p.currency,
      } satisfies ProductBreakdown);
    product.count += 1;
    product.revenue += p.price;
    productMap.set(productKey, product);

    platformMap.set(p.platform, (platformMap.get(p.platform) ?? 0) + 1);
  }

  const storeConfirmedCount = sales.filter((p) =>
    isConfirmedSale(p.verification),
  ).length;

  return {
    sales,
    all,
    totalCount: sales.length,
    buyerCount: buyers.size,
    storeConfirmedCount,
    unconfirmedCount: sales.length - storeConfirmedCount,
    revenueByCurrency: Array.from(revenueMap.entries())
      .map(([currency, { total, count }]) => ({ currency, total, count }))
      .sort((a, b) => b.total - a.total),
    products: Array.from(productMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    ),
    platforms: Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count),
    exclusions,
    excludedTotal: all.length - sales.length,
  };
}
