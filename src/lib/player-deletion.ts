import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { getAuthAdmin } from "@/lib/firebase/auth";
import { GAME } from "@/lib/firebase/collections";

export interface DeletionResult {
  uid: string;
  deleted: string[];
  anonymized: string[];
  alreadyAbsent: string[];
}

/**
 * Idempotent, ordered account deletion for a TrapMan player.
 *
 * Deletion order (intentional — do not reorder):
 * 1. Private profile (users/{uid}) — hard delete
 * 2. Progress data (player_progress/{uid}) — hard delete
 * 3. Leaderboard entry — anonymized (score/rank retained, identity removed)
 * 4. Purchase documents — anonymized (financial records retained per compliance)
 * 5. Firebase Auth record — hard delete (must be last)
 *
 * Idempotent: auth/user-not-found and missing documents are silently handled.
 * Compliance: uid is recorded in the result; email and username are NOT.
 */
export async function deletePlayerAccount(
  uid: string
): Promise<DeletionResult> {
  const db = getDb();
  const auth = getAuthAdmin();
  const result: DeletionResult = {
    uid,
    deleted: [],
    anonymized: [],
    alreadyAbsent: [],
  };

  // 1. Delete user profile
  const userRef = db.collection(GAME.users).doc(uid);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    await userRef.delete();
    result.deleted.push(`${GAME.users}/${uid}`);
  } else {
    result.alreadyAbsent.push(`${GAME.users}/${uid}`);
  }

  // 2. Delete progress document
  const progressRef = db.collection(GAME.progress).doc(uid);
  const progressDoc = await progressRef.get();
  if (progressDoc.exists) {
    await progressRef.delete();
    result.deleted.push(`${GAME.progress}/${uid}`);
  } else {
    result.alreadyAbsent.push(`${GAME.progress}/${uid}`);
  }

  // 3. Anonymize leaderboard entry (retain score for board integrity, remove identity)
  const leaderboardRef = db.collection(GAME.leaderboard).doc(uid);
  const leaderboardDoc = await leaderboardRef.get();
  if (leaderboardDoc.exists) {
    await leaderboardRef.update({
      username: "[deleted]",
      displayName: "[deleted]",
      name: "[deleted]",
      email: null,
      uid: uid, // retain uid for idempotency checks
    });
    result.anonymized.push(`${GAME.leaderboard}/${uid}`);
  } else {
    result.alreadyAbsent.push(`${GAME.leaderboard}/${uid}`);
  }

  // 4. Anonymize purchase documents (retain for financial compliance, remove PII)
  const purchasesSnap = await db
    .collection(GAME.purchases)
    .where("uid", "==", uid)
    .get();

  if (!purchasesSnap.empty) {
    const batch = db.batch();
    for (const doc of purchasesSnap.docs) {
      batch.update(doc.ref, {
        email: null,
        username: null,
        displayName: null,
        // uid is retained so idempotent runs don't re-process
      });
    }
    await batch.commit();
    result.anonymized.push(
      `${GAME.purchases} (${purchasesSnap.size} document(s) anonymized)`
    );
  }

  // 5. Delete Firebase Auth record (last — ensures all Firestore data is handled first)
  try {
    await auth.deleteUser(uid);
    result.deleted.push(`firebase-auth/${uid}`);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/user-not-found") {
      result.alreadyAbsent.push(`firebase-auth/${uid}`);
    } else {
      throw err;
    }
  }

  return result;
}
