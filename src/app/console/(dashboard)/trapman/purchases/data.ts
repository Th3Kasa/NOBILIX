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
import {
  verifyPlayPurchases,
  APPLE_UNVERIFIABLE_REASON,
  type Verification,
} from "@/lib/trapman/play-verify";
import { classify, type PurchaseRecord } from "@/lib/trapman/purchase-accounting";

/**
 * Purchases data-access for the TrapMan console.
 *
 * Purchase records live embedded on player documents at `users/{uid}.purchases`
 * (the standalone `purchases` collection is empty in the live database). The
 * game writes two different shapes depending on the store — both are handled by
 * the shared parser in `@/lib/trapman/purchases`.
 *
 * A stored purchase record is a claim, not proof of a sale. Three different
 * things look identical in Firestore: a real payment, a Google licence tester
 * tapping "buy" for free, and a purchase Google later refunded. This module
 * therefore asks Google Play to adjudicate every Android purchase (see
 * `play-verify`) and classifies each record into exactly one bucket, so the
 * headline "real sales" figure is defensible rather than a hopeful sum.
 *
 * Reading is kept apart from counting: the arithmetic lives in
 * `@/lib/trapman/purchase-accounting`, which has no database or framework
 * imports and can be tested directly.
 */

const MAX_SAMPLE = 1000;

// Re-exported so pages keep a single import site for the purchase shape.
export type {
  PurchaseRecord,
  PurchasesSummary,
  ProductBreakdown,
  ExclusionReason,
  ExclusionCounts,
} from "@/lib/trapman/purchase-accounting";
export { summarise } from "@/lib/trapman/purchase-accounting";

export interface PurchasesData {
  connected: boolean;
  sampleSize: number;
  /** True when the scan hit the cap and totals may be incomplete. */
  scanCapped: boolean;
  /** Every readable record, classified. Aggregate with `summarise()`. */
  records: PurchaseRecord[];
  unparsedRecords: number;
  /** True when credentials for the Play Developer API are present. */
  verificationConfigured: boolean;
  /** Set when every Play lookup failed the same way — show it once. */
  verificationBlockedReason: string | null;
  /** True when more purchases needed checking than one pass allows. */
  verificationCapped: boolean;
  /** iOS purchases, which carry no receipt and so can never be verified. */
  appleUnverifiableCount: number;
  error?: string;
}

function emptyData(error?: string): PurchasesData {
  return {
    connected: false,
    sampleSize: 0,
    scanCapped: false,
    records: [],
    unparsedRecords: 0,
    verificationConfigured: false,
    verificationBlockedReason: null,
    verificationCapped: false,
    appleUnverifiableCount: 0,
    error,
  };
}

/** The verdict for a purchase the store was never asked about, and why. */
function notChecked(purchase: NormalizedPurchase): Verification {
  return {
    verdict: "unverified",
    source: "none",
    reason: purchase.isVerifiable
      ? "Not checked with Google Play."
      : purchase.platform === "ios"
        ? APPLE_UNVERIFIABLE_REASON
        : "This record carries no store receipt to check.",
    acknowledged: purchase.acknowledged,
    regionCode: null,
    checkedAt: 0,
  };
}

async function fetchPurchasesData(): Promise<PurchasesData> {
  try {
    const db = getDb();
    const [snap, testUids] = await Promise.all([
      db.collection(GAME.users).limit(MAX_SAMPLE).get(),
      getTestAccountUids(),
    ]);

    const parsed: NormalizedPurchase[] = [];
    let unparsedRecords = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const { purchases, unparsed } = parsePurchaseMap(
        doc.id,
        buyerNameFrom(data),
        data.purchases,
      );
      parsed.push(...purchases);
      unparsedRecords += unparsed.length;
    }

    parsed.sort((a, b) => b.timestamp - a.timestamp);

    // Only ask the store about purchases that could still count. Editor
    // purchases and known testers are already settled, and spending quota to
    // confirm what an operator has already excluded would be waste.
    const worthVerifying = parsed.filter(
      (p) => !p.isEditorPurchase && !testUids.has(p.buyerUid),
    );
    const pass = await verifyPlayPurchases(
      worthVerifying.map((p) => ({
        packageName: p.packageName,
        productId: p.productId,
        purchaseToken: p.purchaseToken,
        platform: p.platform,
      })),
    );

    const records: PurchaseRecord[] = parsed.map((p) => {
      const verification =
        (p.purchaseToken ? pass.byToken.get(p.purchaseToken) : undefined) ??
        notChecked(p);
      return {
        ...p,
        verification,
        exclusion: classify(p, verification, testUids),
      };
    });

    return {
      connected: true,
      sampleSize: snap.size,
      scanCapped: snap.size >= MAX_SAMPLE,
      records,
      unparsedRecords,
      verificationConfigured: pass.configured,
      verificationBlockedReason: pass.blockingReason,
      verificationCapped: pass.capped,
      appleUnverifiableCount: records.filter(
        (p) => p.platform === "ios" && !p.isVerifiable,
      ).length,
    };
  } catch (err) {
    return emptyData(err instanceof Error ? err.message : "Unknown error");
  }
}

/**
 * 2-minute shared cache: one scan serves every admin across several
 * auto-refreshes instead of a scan per request. The scan reads up to 1,000
 * player documents, and at 30s it alone could spend the project's free daily
 * Firestore quota (shared with the game) in well under an hour of viewing.
 * Marking a test account uses updateTag, so that change still shows at once.
 * Store verdicts have their own, much longer cache in Firestore, so this does
 * not re-hit the Play API.
 */
export const getPurchasesData = unstable_cache(
  fetchPurchasesData,
  ["trapman-purchases"],
  { revalidate: 120, tags: ["trapman-console"] },
);
