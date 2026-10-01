import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import { isPrizeStatus, prizeKey, type PrizeStatus } from "@/lib/trapman/winners";

/**
 * Whether each competition winner has been contacted and paid.
 *
 * Console-owned (`_crm_prizes`): the game never reads it, and no game document
 * is touched. A winner with no record is "pending".
 */

/** Every recorded prize status, keyed by `prizeKey`. Returns {} if unreachable. */
export async function getPrizeStatuses(): Promise<Record<string, PrizeStatus>> {
  try {
    const snap = await getDb().collection(CRM.prizes).limit(5000).get();
    const out: Record<string, PrizeStatus> = {};
    for (const doc of snap.docs) {
      const status = doc.data().status;
      if (isPrizeStatus(status)) out[doc.id] = status;
    }
    return out;
  } catch (err) {
    console.error("[prizes] failed to read statuses", err);
    return {};
  }
}

export async function setPrizeStatus(
  competitionId: string,
  uid: string,
  status: PrizeStatus,
  updatedBy: string,
): Promise<void> {
  await getDb()
    .collection(CRM.prizes)
    .doc(prizeKey(competitionId, uid))
    .set({ competitionId, uid, status, updatedBy, updatedAt: Date.now() });
}
