import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

/**
 * Purchases data-access for the TrapMan console.
 *
 * Engineering schema review confirmed that live purchase records are stored
 * EMBEDDED on player documents at `users/{uid}.purchases` as a map of
 * `purchaseId → { productId, price, currency, platform, receipt, timestamp }`.
 * (The standalone `purchases` collection no longer exists in the live
 * database.) This module aggregates those embedded records.
 *
 * Some documents carry raw store-receipt blobs in a different shape (keyed by
 * store purchase tokens). Those are counted honestly as `unparsedRecords`
 * rather than being guessed at or silently dropped.
 */

const MAX_SAMPLE = 1000;

export interface PurchaseRecord {
  purchaseId: string;
  productId: string;
  price: number;
  currency: string;
  platform: string;
  timestamp: number;
  buyerUid: string;
  buyerName: string | null;
}

export interface ProductBreakdown {
  productId: string;
  count: number;
  revenue: number;
  currency: string;
}

export interface PurchasesData {
  connected: boolean;
  sampleSize: number;
  purchases: PurchaseRecord[];
  totalCount: number;
  buyerCount: number;
  revenueByCurrency: { currency: string; total: number; count: number }[];
  products: ProductBreakdown[];
  platforms: { platform: string; count: number }[];
  unparsedRecords: number;
  error?: string;
}

function isParsablePurchase(value: unknown): value is {
  productId: string;
  price: number;
  currency: string;
  platform: string;
  timestamp: number;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.price === "number" &&
    typeof v.currency === "string" &&
    typeof v.platform === "string" &&
    typeof v.timestamp === "number"
  );
}

export async function getPurchasesData(): Promise<PurchasesData> {
  try {
    const db = getDb();
    const snap = await db.collection(GAME.users).limit(MAX_SAMPLE).get();

    const purchases: PurchaseRecord[] = [];
    const buyers = new Set<string>();
    let unparsedRecords = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const embedded = data.purchases;
      if (typeof embedded !== "object" || embedded === null) continue;

      const buyerName =
        typeof data.username === "string" && data.username.trim()
          ? data.username.trim()
          : null;

      for (const [purchaseId, record] of Object.entries(
        embedded as Record<string, unknown>,
      )) {
        if (isParsablePurchase(record)) {
          purchases.push({
            purchaseId,
            productId: record.productId,
            price: record.price,
            currency: record.currency.toUpperCase(),
            platform: record.platform,
            timestamp: record.timestamp,
            buyerUid: doc.id,
            buyerName,
          });
          buyers.add(doc.id);
        } else {
          unparsedRecords += 1;
        }
      }
    }

    purchases.sort((a, b) => b.timestamp - a.timestamp);

    const revenueMap = new Map<string, { total: number; count: number }>();
    const productMap = new Map<string, ProductBreakdown>();
    const platformMap = new Map<string, number>();

    for (const p of purchases) {
      const rev = revenueMap.get(p.currency) ?? { total: 0, count: 0 };
      rev.total += p.price;
      rev.count += 1;
      revenueMap.set(p.currency, rev);

      const productKey = `${p.productId}::${p.currency}`;
      const product =
        productMap.get(productKey) ??
        ({ productId: p.productId, count: 0, revenue: 0, currency: p.currency } satisfies ProductBreakdown);
      product.count += 1;
      product.revenue += p.price;
      productMap.set(productKey, product);

      platformMap.set(p.platform, (platformMap.get(p.platform) ?? 0) + 1);
    }

    return {
      connected: true,
      sampleSize: snap.size,
      purchases,
      totalCount: purchases.length,
      buyerCount: buyers.size,
      revenueByCurrency: Array.from(revenueMap.entries())
        .map(([currency, { total, count }]) => ({ currency, total, count }))
        .sort((a, b) => b.total - a.total),
      products: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
      platforms: Array.from(platformMap.entries())
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count),
      unparsedRecords,
    };
  } catch (err) {
    return {
      connected: false,
      sampleSize: 0,
      purchases: [],
      totalCount: 0,
      buyerCount: 0,
      revenueByCurrency: [],
      products: [],
      platforms: [],
      unparsedRecords: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
