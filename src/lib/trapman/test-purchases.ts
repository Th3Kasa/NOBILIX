import "server-only";
import { createHash } from "node:crypto";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";

/**
 * Console-owned register of individual purchases an operator has marked as
 * tests. Like the test-account register, it never touches the game's own
 * documents: marking is a console-side exclusion and is always reversible.
 *
 * Keys are `purchaseKey` values ("{buyerUid}::{purchaseId}"). Document ids are
 * a hash of the key, because purchase ids can contain characters Firestore
 * does not allow in a document id.
 */

const BATCH_LIMIT = 500;

const docId = (key: string) => createHash("sha1").update(key).digest("hex");

/** Every purchase marked as a test. Empty if unreachable (fail open). */
export async function getTestPurchaseKeys(): Promise<Set<string>> {
  try {
    const snap = await getDb().collection(CRM.testPurchases).get();
    return new Set(
      snap.docs
        .map((d) => d.data().key)
        .filter((k): k is string => typeof k === "string"),
    );
  } catch {
    // An unreachable register must not silently hide revenue.
    return new Set();
  }
}

/** Mark purchases as tests. Returns how many were written. */
export async function markTestPurchases(keys: string[], markedBy: string): Promise<number> {
  const db = getDb();
  const unique = [...new Set(keys)];
  const markedAt = Date.now();
  for (let i = 0; i < unique.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const key of unique.slice(i, i + BATCH_LIMIT)) {
      batch.set(db.collection(CRM.testPurchases).doc(docId(key)), { key, markedBy, markedAt });
    }
    await batch.commit();
  }
  return unique.length;
}

/** Remove every test-purchase mark. Returns how many were removed. */
export async function clearTestPurchases(): Promise<number> {
  const db = getDb();
  let removed = 0;
  for (;;) {
    const snap = await db.collection(CRM.testPurchases).limit(BATCH_LIMIT).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    if (snap.size < BATCH_LIMIT) break;
  }
  return removed;
}
