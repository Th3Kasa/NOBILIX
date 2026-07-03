import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import type {
  PlayerAccountSnapshot,
  PlayerAnalytics,
  PlayerPurchase,
} from "@/types/player-account";

/**
 * Purchases live embedded on the player document at `users/{uid}.purchases`
 * (a map of `purchaseId -> { productId, price, currency, platform, receipt,
 * timestamp }`) — see src/app/console/(dashboard)/trapman/purchases/data.ts
 * for the confirmed schema and the console's own reader. The standalone
 * `purchases` collection queried below no longer exists in the live
 * database, so it is kept only as a silent legacy fallback for environments
 * that still have it (or haven't migrated), never as the primary source.
 */
function isParsableEmbeddedPurchase(value: unknown): value is {
  productId: string;
  timestamp: number;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.productId === "string" && typeof v.timestamp === "number";
}

function purchasesFromEmbeddedMap(
  embedded: Record<string, unknown>,
): PlayerPurchase[] {
  const purchases: PlayerPurchase[] = [];
  for (const [purchaseId, record] of Object.entries(embedded)) {
    if (!isParsableEmbeddedPurchase(record)) continue;
    purchases.push({
      id: purchaseId,
      productId: record.productId,
      purchasedAt: record.timestamp,
    });
  }
  purchases.sort((a, b) => (b.purchasedAt ?? 0) - (a.purchasedAt ?? 0));
  return purchases.slice(0, 100);
}

/**
 * Compose a UID-scoped player account snapshot.
 *
 * Rules:
 * - uid comes from the verified session — never from request input.
 * - Analytics counters return null unless the Firestore document has an
 *   explicit numeric field. Never default to 0 for missing data.
 * - Purchases are read from the embedded `users/{uid}.purchases` map first;
 *   the standalone `purchases` collection is queried only as a silent
 *   fallback when that map is absent.
 */
export async function getPlayerAccountSnapshot(
  uid: string
): Promise<PlayerAccountSnapshot> {
  const db = getDb();

  const [userDoc, progressDoc] = await Promise.all([
    db.collection(GAME.users).doc(uid).get(),
    db.collection(GAME.progress).doc(uid).get(),
  ]);

  const user = userDoc.exists ? userDoc.data()! : null;
  const progress = progressDoc.exists ? progressDoc.data()! : null;

  // Defensive username mapping — check multiple field variants.
  const username: string | null =
    (user?.username as string | undefined) ??
    (user?.displayName as string | undefined) ??
    (user?.name as string | undefined) ??
    null;

  // competitionsWon may live on the user or progress doc.
  const competitionsWon: number | null = (() => {
    const fromUser = user?.competitionsWon;
    const fromProgress = progress?.competitionsWon;
    if (typeof fromUser === "number") return fromUser;
    if (typeof fromProgress === "number") return fromProgress;
    return null;
  })();

  // Primary source: the embedded purchases map on the user document.
  const embedded = user?.purchases;
  let purchases: PlayerPurchase[] =
    typeof embedded === "object" && embedded !== null
      ? purchasesFromEmbeddedMap(embedded as Record<string, unknown>)
      : [];

  // Silent legacy fallback: only queried when the embedded map is absent
  // (e.g. an environment that hasn't migrated off the standalone collection).
  if (purchases.length === 0 && (typeof embedded !== "object" || embedded === null)) {
    try {
      const purchasesSnap = await db
        .collection(GAME.purchases)
        .where("uid", "==", uid)
        .orderBy("purchasedAt", "desc")
        .limit(100)
        .get();

      purchases = purchasesSnap.docs.map((doc) => {
        const d = doc.data();
        const productId: string =
          (d.productId as string | undefined) ??
          (d.product_id as string | undefined) ??
          (d.itemId as string | undefined) ??
          "";
        return {
          id: doc.id,
          productId,
          purchasedAt:
            typeof d.purchasedAt === "number"
              ? d.purchasedAt
              : d.purchasedAt?.toMillis?.() ?? null,
        };
      });
    } catch {
      // Legacy collection may not exist at all in a fully-migrated
      // environment — that's expected, not an error. Keep purchases empty.
    }
  }

  // Analytics: only from explicit Firestore numeric fields.
  // Return null for any field not stored — never invent zeros.
  const analytics: PlayerAnalytics = {
    totalPlaytimeMs:
      typeof progress?.totalPlaytimeMs === "number"
        ? progress.totalPlaytimeMs
        : null,
    adsWatchedCount:
      typeof progress?.adsWatchedCount === "number"
        ? progress.adsWatchedCount
        : null,
    adsClickedCount:
      typeof progress?.adsClickedCount === "number"
        ? progress.adsClickedCount
        : null,
    updatedAt:
      typeof progress?.updatedAt === "number"
        ? progress.updatedAt
        : progress?.updatedAt?.toMillis?.() ?? null,
  };

  return {
    uid,
    username,
    email: (user?.email as string | undefined) ?? null,
    country: (user?.country as string | undefined) ?? null,
    competitionsWon,
    progress: progress ? { ...progress } : null,
    purchases,
    analytics,
  };
}
