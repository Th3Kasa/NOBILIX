import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import type {
  PlayerAccountSnapshot,
  PlayerAnalytics,
  PlayerPurchase,
} from "@/types/player-account";

/**
 * Compose a UID-scoped player account snapshot.
 *
 * Rules:
 * - uid comes from the verified session — never from request input.
 * - Analytics counters return null unless the Firestore document has an
 *   explicit numeric field. Never default to 0 for missing data.
 * - Purchase documents are queried by uid (where uid == uid).
 */
export async function getPlayerAccountSnapshot(
  uid: string
): Promise<PlayerAccountSnapshot> {
  const db = getDb();

  const [userDoc, progressDoc, purchasesSnap] = await Promise.all([
    db.collection(GAME.users).doc(uid).get(),
    db.collection(GAME.progress).doc(uid).get(),
    db
      .collection(GAME.purchases)
      .where("uid", "==", uid)
      .orderBy("purchasedAt", "desc")
      .limit(100)
      .get(),
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

  // Map purchase documents — defensive product ID field variants.
  const purchases: PlayerPurchase[] = purchasesSnap.docs.map((doc) => {
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
