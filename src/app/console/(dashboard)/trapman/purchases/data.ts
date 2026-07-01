import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";

/**
 * Purchases data-access for the TrapMan console.
 *
 * The dedicated `purchases/{purchaseId}` collection is confirmed to exist in
 * the live database but currently holds zero documents (Phase 0 discovery).
 * This is a "not populated yet" state, not a schema guess — so this module
 * only ever reports a live document count, never fabricated transaction rows
 * or revenue figures.
 */
export interface PurchasesData {
  connected: boolean;
  totalCount: number;
  error?: string;
}

export async function getPurchasesData(): Promise<PurchasesData> {
  try {
    const db = getDb();
    const countSnap = await db.collection(GAME.purchases).count().get();
    return { connected: true, totalCount: countSnap.data().count };
  } catch (err) {
    return {
      connected: false,
      totalCount: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
