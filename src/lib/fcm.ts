import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { getMessagingAdmin } from "@/lib/firebase/messaging";
import { GAME } from "@/lib/firebase/collections";
import type { CampaignAudience } from "@/types";

/** Hard cap on recipients gathered for a single send, to bound memory/cost. */
const MAX_RECIPIENTS = 10_000;
/** FCM allows up to 500 messages per multicast call. */
const FCM_BATCH = 500;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Resolve an audience definition into a de-duplicated list of FCM tokens. */
export async function resolveAudienceTokens(
  audience: CampaignAudience,
): Promise<string[]> {
  const db = getDb();
  const tokens = new Set<string>();

  if (audience.type === "single") {
    const doc = await db.collection(GAME.users).doc(audience.uid).get();
    const t = doc.data()?.fcmToken ?? doc.data()?.fcm_token;
    if (t) tokens.add(t);
    return [...tokens];
  }

  let q: FirebaseFirestore.Query = db.collection(GAME.users);

  if (audience.type === "segment") {
    const f = audience.filters;
    // Only equality filters go to Firestore: they're served by the automatic
    // single-field indexes (merged), so no composite index can ever be
    // missing here. Range filters run in memory below — the game writes
    // `currentLevel` (not the documented `level`), and optional range
    // combinations would otherwise demand a lattice of composite indexes.
    if (f.country) q = q.where("country", "==", f.country.toUpperCase());
    if (f.character) q = q.where("character", "==", f.character);
  }

  const snap = await q.limit(MAX_RECIPIENTS).get();
  for (const doc of snap.docs) {
    const data = doc.data();

    if (audience.type === "segment") {
      const f = audience.filters;
      const level =
        typeof data.currentLevel === "number"
          ? data.currentLevel
          : typeof data.level === "number"
            ? data.level
            : null;
      if (f.minLevel != null && (level == null || level < f.minLevel)) continue;
      if (f.maxLevel != null && (level == null || level > f.maxLevel)) continue;
      if (f.lastActiveDays != null) {
        const since = Date.now() - f.lastActiveDays * ONE_DAY_MS;
        const seen =
          typeof data.lastSeenAt === "number"
            ? data.lastSeenAt
            : typeof data.lastActiveAt === "number"
              ? data.lastActiveAt
              : null;
        if (seen == null || seen < since) continue;
      }
    }

    const t = data?.fcmToken ?? data?.fcm_token;
    if (t) tokens.add(t);
  }
  return [...tokens];
}

export interface SendResult {
  successCount: number;
  failureCount: number;
  /** Tokens FCM reported as unregistered/invalid — candidates for cleanup. */
  invalidTokens: string[];
}

/** Send a notification to a list of tokens, batched to FCM's 500-per-call limit. */
export async function sendToTokens(
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<SendResult> {
  const messaging = getMessagingAdmin();
  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += FCM_BATCH) {
    const batch = tokens.slice(i, i + FCM_BATCH);
    const res = await messaging.sendEachForMulticast({
      tokens: batch,
      notification,
      data,
    });
    successCount += res.successCount;
    failureCount += res.failureCount;
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          invalidTokens.push(batch[idx]);
        }
      }
    });
  }

  return { successCount, failureCount, invalidTokens };
}
