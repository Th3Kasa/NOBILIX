import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { getMessagingAdmin } from "@/lib/firebase/messaging";
import { GAME } from "@/lib/firebase/collections";
import type { CampaignAudience } from "@/types";

/**
 * Push delivery for the TrapMan console.
 *
 * Two things make push notifications hard to trust, and both are handled here
 * rather than left for an operator to guess at:
 *
 *  1. Most players cannot receive one. A device only has an FCM token after
 *     the player has granted notification permission, and the game writes an
 *     empty string until then. "Sent to 0 recipients" is the single most
 *     common outcome, and it means nothing was wrong — there was simply nobody
 *     to send to. `resolveAudience` therefore reports how many players it
 *     considered as well as how many it could actually reach.
 *
 *  2. When a send does fail, Firebase's reason is a code like
 *     `messaging/third-party-auth-error`, which is the difference between "the
 *     player uninstalled the game" and "the APNs key is missing, so iOS push
 *     has never worked". Codes are translated and kept on the campaign record
 *     so the failure is legible after the fact.
 *
 * Nothing here writes to the game's own documents: a token that FCM rejects is
 * reported, never deleted. The game rewrites its token on next launch, and the
 * console's rule is that it does not mutate game data.
 */

/** Hard cap on recipients gathered for a single send, to bound memory/cost. */
const MAX_RECIPIENTS = 10_000;
/** FCM allows up to 500 messages per multicast call. */
const FCM_BATCH = 500;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface ResolvedAudience {
  /** De-duplicated device tokens that can actually be sent to. */
  tokens: string[];
  /** Players who matched the audience, whether reachable or not. */
  matched: number;
  /**
   * Matched players with no usable token — they have never granted
   * notification permission, or the game has not synced one yet.
   */
  unreachable: number;
  /**
   * Matched players sharing a device with another matched player. The same
   * handset signed into a guest and a named account stores the same token
   * twice; sending once is correct, but the count needs explaining.
   */
  sharedDevices: number;
}

/** Read the device token the game may have written under either field name. */
function tokenFrom(data: FirebaseFirestore.DocumentData | undefined): string | null {
  const raw = data?.fcmToken ?? data?.fcm_token;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * When the player was last seen, in epoch milliseconds.
 *
 * The game writes `lastServerSync` as a Firestore Timestamp — not the
 * `lastSeenAt`/`lastActiveAt` numbers this filter used to look for, neither of
 * which exists on a single player document. The mismatch meant the "active
 * within N days" audience silently matched nobody, which looks identical to
 * "nobody is active" and so never got questioned. The older names are still
 * accepted in case an earlier build wrote them.
 */
function lastSeenMsFrom(
  data: FirebaseFirestore.DocumentData | undefined,
): number | null {
  const candidate =
    data?.lastServerSync ?? data?.lastSeenAt ?? data?.lastActiveAt;
  if (candidate == null) return null;
  if (typeof candidate === "number") return candidate;
  // Firestore Timestamp
  if (typeof candidate?.toMillis === "function") return candidate.toMillis();
  if (typeof candidate?._seconds === "number") return candidate._seconds * 1000;
  return null;
}

/**
 * Resolve an audience definition into device tokens, plus the counts needed to
 * explain the result.
 */
export async function resolveAudience(
  audience: CampaignAudience,
): Promise<ResolvedAudience> {
  const db = getDb();
  const tokens = new Set<string>();
  let matched = 0;
  let withToken = 0;

  if (audience.type === "single") {
    const doc = await db.collection(GAME.users).doc(audience.uid).get();
    if (doc.exists) matched = 1;
    const t = tokenFrom(doc.data());
    if (t) {
      tokens.add(t);
      withToken = 1;
    }
    return {
      tokens: [...tokens],
      matched,
      unreachable: matched - withToken,
      sharedDevices: 0,
    };
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
        const seen = lastSeenMsFrom(data);
        if (seen == null || seen < since) continue;
      }
    }

    matched += 1;
    const t = tokenFrom(data);
    if (t) {
      withToken += 1;
      tokens.add(t);
    }
  }

  return {
    tokens: [...tokens],
    matched,
    unreachable: matched - withToken,
    sharedDevices: withToken - tokens.size,
  };
}

/**
 * Back-compatible token-only resolution.
 * @deprecated Prefer `resolveAudience`, which explains an empty result.
 */
export async function resolveAudienceTokens(
  audience: CampaignAudience,
): Promise<string[]> {
  return (await resolveAudience(audience)).tokens;
}

// ─── Failure translation ─────────────────────────────────────────────────────

/**
 * Firebase error codes → what an operator should actually do about them.
 *
 * `third-party-auth-error` in particular is worth spelling out: it is the
 * signature of a missing or expired APNs key, which silently breaks push for
 * every iOS player at once while Android keeps working.
 */
const FAILURE_COPY: Record<string, string> = {
  "messaging/registration-token-not-registered":
    "The player uninstalled the game, or turned notifications off. Their saved device token is dead.",
  "messaging/invalid-registration-token":
    "The device token saved for this player is malformed and can never be delivered to.",
  "messaging/invalid-argument":
    "Firebase rejected the message or the device token as invalid.",
  "messaging/third-party-auth-error":
    "Firebase could not authenticate with Apple. Upload a valid APNs key under Firebase → Project settings → Cloud Messaging; without it, push to iPhones fails every time.",
  "messaging/mismatched-credential":
    "The device token belongs to a different Firebase project than the console is using.",
  "messaging/message-rate-exceeded":
    "Too many messages were sent to this device too quickly; Firebase throttled it.",
  "messaging/quota-exceeded":
    "The project's sending quota is exhausted. It resets automatically.",
  "messaging/server-unavailable":
    "Firebase was temporarily unavailable. Sending again usually succeeds.",
  "messaging/internal-error": "Firebase hit an internal error delivering this message.",
};

/** Codes that mean the stored token will never work again. */
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export function describeFcmFailure(code: string): string {
  return FAILURE_COPY[code] ?? `Firebase reported: ${code || "an unknown error"}.`;
}

export interface FailureGroup {
  code: string;
  /** Plain-English explanation of the code. */
  reason: string;
  count: number;
  /** True when the stored token should be considered dead. */
  deadToken: boolean;
}

export interface SendResult {
  successCount: number;
  failureCount: number;
  /** Failures grouped by cause, most common first. */
  failures: FailureGroup[];
  /** Tokens FCM reported as permanently unusable. */
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
  const byCode = new Map<string, number>();

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
      if (r.success) return;
      const code = r.error?.code ?? "";
      byCode.set(code, (byCode.get(code) ?? 0) + 1);
      if (DEAD_TOKEN_CODES.has(code)) invalidTokens.push(batch[idx]);
    });
  }

  const failures: FailureGroup[] = [...byCode.entries()]
    .map(([code, count]) => ({
      code,
      reason: describeFcmFailure(code),
      count,
      deadToken: DEAD_TOKEN_CODES.has(code),
    }))
    .sort((a, b) => b.count - a.count);

  return { successCount, failureCount, failures, invalidTokens };
}

// ─── Reachability ────────────────────────────────────────────────────────────

export interface PushReach {
  connected: boolean;
  /** Player profiles scanned. */
  players: number;
  /** Players with a usable device token. */
  reachable: number;
  /** Distinct devices behind those tokens. */
  devices: number;
  error?: string;
}

/**
 * How many players could receive a push at all.
 *
 * Shown before composing, because "will anyone see this?" is the first
 * question and the answer is usually a small fraction of the player base.
 */
export async function getPushReach(): Promise<PushReach> {
  try {
    const snap = await getDb().collection(GAME.users).limit(MAX_RECIPIENTS).get();
    const devices = new Set<string>();
    let reachable = 0;
    for (const doc of snap.docs) {
      const t = tokenFrom(doc.data());
      if (!t) continue;
      reachable += 1;
      devices.add(t);
    }
    return {
      connected: true,
      players: snap.size,
      reachable,
      devices: devices.size,
    };
  } catch (err) {
    return {
      connected: false,
      players: 0,
      reachable: 0,
      devices: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
