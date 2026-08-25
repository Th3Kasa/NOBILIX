import "server-only";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import {
  buyerNameFrom,
  parsePurchaseMap,
  type NormalizedPurchase,
} from "@/lib/trapman/purchases";
import { getTestAccountUids } from "@/lib/trapman/test-accounts";

/**
 * Purchases data-access for the TrapMan console.
 *
 * Purchase records live embedded on player documents at `users/{uid}.purchases`
 * (the standalone `purchases` collection is empty in the live database). The
 * game writes two different shapes depending on the store — both are handled by
 * the shared parser in `@/lib/trapman/purchases`, which every console surface
 * now uses so the Overview, Purchases and Players pages cannot disagree.
 *
 * Revenue here counts only *countable* purchases: internal test accounts and
 * Unity Editor purchases are separated out rather than summed, so the headline
 * figure is not inflated by the studio's own testing.
 */

const MAX_SAMPLE = 1000;

/** Re-exported so pages keep a single import site for the record shape. */
export type PurchaseRecord = NormalizedPurchase;

export interface ProductBreakdown {
  productId: string;
  count: number;
  revenue: number;
  currency: string;
}

export interface PurchasesData {
  connected: boolean;
  sampleSize: number;
  /** True when the scan hit the cap and totals may be incomplete. */
  scanCapped: boolean;
  /** Countable purchases only — excludes test accounts and Editor purchases. */
  purchases: PurchaseRecord[];
  /** Everything read, including excluded records, for the forensics view. */
  allPurchases: PurchaseRecord[];
  totalCount: number;
  buyerCount: number;
  revenueByCurrency: { currency: string; total: number; count: number }[];
  products: ProductBreakdown[];
  platforms: { platform: string; count: number }[];
  unparsedRecords: number;
  /** Excluded because the buyer is a registered internal test account. */
  testAccountRecords: number;
  /** Excluded because the purchase came from a Unity Editor session. */
  editorRecords: number;
  /**
   * Google Play purchases still unacknowledged. Google automatically refunds
   * and revokes these after three days, so a non-zero count is a real revenue
   * risk that belongs in front of an operator.
   */
  unacknowledgedRecords: number;
  error?: string;
}

function emptyData(error?: string): PurchasesData {
  return {
    connected: false,
    sampleSize: 0,
    scanCapped: false,
    purchases: [],
    allPurchases: [],
    totalCount: 0,
    buyerCount: 0,
    revenueByCurrency: [],
    products: [],
    platforms: [],
    unparsedRecords: 0,
    testAccountRecords: 0,
    editorRecords: 0,
    unacknowledgedRecords: 0,
    error,
  };
}

async function fetchPurchasesData(): Promise<PurchasesData> {
  try {
    const db = getDb();
    const [snap, testUids] = await Promise.all([
      db.collection(GAME.users).limit(MAX_SAMPLE).get(),
      getTestAccountUids(),
    ]);

    const all: PurchaseRecord[] = [];
    let unparsedRecords = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const { purchases, unparsed } = parsePurchaseMap(
        doc.id,
        buyerNameFrom(data),
        data.purchases,
      );
      all.push(...purchases);
      unparsedRecords += unparsed.length;
    }

    all.sort((a, b) => b.timestamp - a.timestamp);

    const isExcluded = (p: PurchaseRecord) =>
      p.isEditorPurchase || testUids.has(p.buyerUid);

    const countable = all.filter((p) => !isExcluded(p));
    const editorRecords = all.filter((p) => p.isEditorPurchase).length;
    const testAccountRecords = all.filter(
      (p) => !p.isEditorPurchase && testUids.has(p.buyerUid),
    ).length;
    const unacknowledgedRecords = countable.filter(
      (p) => p.acknowledged === false,
    ).length;

    const revenueMap = new Map<string, { total: number; count: number }>();
    const productMap = new Map<string, ProductBreakdown>();
    const platformMap = new Map<string, number>();
    const buyers = new Set<string>();

    for (const p of countable) {
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

    return {
      connected: true,
      sampleSize: snap.size,
      scanCapped: snap.size >= MAX_SAMPLE,
      purchases: countable,
      allPurchases: all,
      totalCount: countable.length,
      buyerCount: buyers.size,
      revenueByCurrency: Array.from(revenueMap.entries())
        .map(([currency, { total, count }]) => ({ currency, total, count }))
        .sort((a, b) => b.total - a.total),
      products: Array.from(productMap.values()).sort(
        (a, b) => b.revenue - a.revenue,
      ),
      platforms: Array.from(platformMap.entries())
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count),
      unparsedRecords,
      testAccountRecords,
      editorRecords,
      unacknowledgedRecords,
    };
  } catch (err) {
    return emptyData(err instanceof Error ? err.message : "Unknown error");
  }
}

/**
 * 30s shared cache: one scan serves every admin for the whole auto-refresh
 * window instead of a scan per request.
 */
export const getPurchasesData = unstable_cache(
  fetchPurchasesData,
  ["trapman-purchases"],
  { revalidate: 30, tags: ["trapman-console"] },
);
