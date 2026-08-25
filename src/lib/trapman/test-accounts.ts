import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";

/**
 * Console-owned register of players whose activity is internal testing rather
 * than real business.
 *
 * Deliberately console-side: the game's own documents are never mutated or
 * deleted, so marking an account as a tester is always reversible and never
 * destroys data the studio might need later.
 *
 * Editor purchases (Unity Editor sessions) are excluded automatically without
 * being registered here — they never reached a store, so they cannot be real
 * revenue under any interpretation.
 */

export interface TestAccount {
  uid: string;
  label: string | null;
  reason: string | null;
  addedBy: string;
  addedAt: number;
}

/** UIDs currently marked as internal testers. Empty set if unreachable. */
export async function getTestAccountUids(): Promise<Set<string>> {
  try {
    const snap = await getDb().collection(CRM.testAccounts).get();
    return new Set(snap.docs.map((d) => d.id));
  } catch {
    // Fail open: an unreachable exclusion list must not silently hide revenue.
    return new Set();
  }
}

export async function listTestAccounts(): Promise<TestAccount[]> {
  try {
    const snap = await getDb().collection(CRM.testAccounts).get();
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          label: typeof data.label === "string" ? data.label : null,
          reason: typeof data.reason === "string" ? data.reason : null,
          addedBy: typeof data.addedBy === "string" ? data.addedBy : "",
          addedAt: typeof data.addedAt === "number" ? data.addedAt : 0,
        } satisfies TestAccount;
      })
      .sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

export async function markTestAccount(
  uid: string,
  label: string | null,
  reason: string | null,
  addedBy: string,
): Promise<void> {
  await getDb()
    .collection(CRM.testAccounts)
    .doc(uid)
    .set({ label, reason, addedBy, addedAt: Date.now() });
}

export async function unmarkTestAccount(uid: string): Promise<void> {
  await getDb().collection(CRM.testAccounts).doc(uid).delete();
}
