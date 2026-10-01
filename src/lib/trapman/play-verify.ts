import "server-only";
import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import type {
  PurchaseVerdict,
  Verification,
} from "@/lib/trapman/purchase-accounting";

// Re-exported so callers that already reach for this module keep one import
// site, while the pure definitions stay importable without server-only.
export {
  isRevenue,
  isConfirmedSale,
  APPLE_UNVERIFIABLE_REASON,
} from "@/lib/trapman/purchase-accounting";
export type {
  PurchaseVerdict,
  Verification,
} from "@/lib/trapman/purchase-accounting";

/**
 * Asks Google Play whether a purchase is a real sale.
 *
 * The game stores whatever the client handed it, and a client cannot tell the
 * console the difference between money changing hands and a licence tester
 * tapping "buy" for free — the two records are byte-for-byte identical apart
 * from fields only Google holds. The Play Developer API is therefore the only
 * authority on the question the studio actually cares about: did someone pay?
 *
 *   purchases.products.get → purchaseType  0 = licence-test purchase (free)
 *                                          1 = redeemed a promo code (free)
 *                                          2 = granted by a rewarded ad (free)
 *                                     (absent) = a real, paid purchase
 *
 * The same response also carries the authoritative purchaseState (refunds and
 * cancellations the client never learns about) and acknowledgementState.
 *
 * Apple has no equivalent path here: TrapMan writes an EMPTY string to
 * `receipt` for every iOS purchase and keys the record by a Unity GUID rather
 * than an App Store transaction id, so there is nothing to present to Apple.
 * iOS purchases come back `unverified` with that reason attached, and the
 * console says so out loud rather than implying the figure is confirmed.
 *
 * Verdicts are cached in Firestore because they are stable — a purchase does
 * not stop being a test purchase — and because the console re-reads purchases
 * every 30 seconds while the Play API is quota'd per day.
 */

const ANDROID_PUBLISHER_SCOPE =
  "https://www.googleapis.com/auth/androidpublisher";
const API_ROOT = "https://androidpublisher.googleapis.com/androidpublisher/v3";

/** Terminal verdicts never change, so they are cached without expiry. */
const NON_TERMINAL_TTL_MS = 5 * 60 * 1000;
/** A failed lookup is retried soon — the cause is usually configuration. */
const ERROR_TTL_MS = 10 * 60 * 1000;
/** Bound the work one page render can trigger against a quota'd API. */
const MAX_LOOKUPS_PER_PASS = 50;

function unverified(reason: string): Verification {
  return {
    verdict: "unverified",
    source: "none",
    reason,
    acknowledged: null,
    regionCode: null,
    checkedAt: Date.now(),
  };
}

// ─── Credentials ─────────────────────────────────────────────────────────────

let jwtClient: JWT | null | undefined;

/**
 * The Play Developer API needs a service account that has been invited in the
 * Play Console — a different grant from Firebase, even when it is the same
 * account. A dedicated credential can be supplied; otherwise the console
 * reuses the Firebase one, which works once it is invited.
 */
function getJwtClient(): JWT | null {
  if (jwtClient !== undefined) return jwtClient;

  const b64 =
    process.env.ANDROID_PUBLISHER_SERVICE_ACCOUNT_B64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    jwtClient = null;
    return null;
  }
  try {
    const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    jwtClient = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: [ANDROID_PUBLISHER_SCOPE],
    });
  } catch {
    jwtClient = null;
  }
  return jwtClient;
}

export function isPlayVerificationConfigured(): boolean {
  return getJwtClient() !== null;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

/**
 * Purchase tokens are ~350 characters and contain `/`, which Firestore forbids
 * in a document id. Hash them: the digest is a stable, safe key and keeps the
 * raw token out of a second collection.
 */
function cacheKey(purchaseToken: string): string {
  return createHash("sha256").update(purchaseToken).digest("hex");
}

function isCacheFresh(v: Verification): boolean {
  if (v.verdict === "unverified") return Date.now() - v.checkedAt < ERROR_TTL_MS;
  if (v.verdict === "pending")
    return Date.now() - v.checkedAt < NON_TERMINAL_TTL_MS;
  // "paid" is re-checked periodically too: a sale can still be refunded later.
  if (v.verdict === "paid")
    return Date.now() - v.checkedAt < 24 * 60 * 60 * 1000;
  return true;
}

async function readCache(
  tokens: string[],
): Promise<Map<string, Verification>> {
  const found = new Map<string, Verification>();
  if (tokens.length === 0) return found;

  try {
    const db = getDb();
    const refs = tokens.map((t) =>
      db.collection(CRM.purchaseVerifications).doc(cacheKey(t)),
    );
    const docs = await db.getAll(...refs);
    docs.forEach((doc, i) => {
      if (!doc.exists) return;
      const data = doc.data() as Partial<Verification> | undefined;
      if (!data?.verdict) return;
      const v: Verification = {
        verdict: data.verdict,
        source: data.source ?? "none",
        reason: data.reason ?? null,
        acknowledged: data.acknowledged ?? null,
        regionCode: data.regionCode ?? null,
        checkedAt: data.checkedAt ?? 0,
      };
      if (isCacheFresh(v)) found.set(tokens[i], v);
    });
  } catch {
    // A cache miss is always safe — it only costs an API call.
  }
  return found;
}

async function writeCache(
  entries: { token: string; verification: Verification }[],
): Promise<void> {
  if (entries.length === 0) return;
  try {
    const db = getDb();
    const batch = db.batch();
    for (const { token, verification } of entries) {
      batch.set(
        db.collection(CRM.purchaseVerifications).doc(cacheKey(token)),
        verification,
      );
    }
    await batch.commit();
  } catch {
    // Losing the cache write only means the next pass asks Google again.
  }
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

interface ProductPurchase {
  purchaseType?: number;
  purchaseState?: number;
  acknowledgementState?: number;
  regionCode?: string;
}

/** Google's numeric codes → the verdict the console reasons about. */
function toVerdict(body: ProductPurchase): PurchaseVerdict {
  // purchaseType is only present when the purchase was NOT a normal paid one.
  if (body.purchaseType === 0) return "test";
  if (body.purchaseType === 1) return "promo";
  if (body.purchaseType === 2) return "rewarded";
  if (body.purchaseState === 1) return "refunded";
  if (body.purchaseState === 2) return "pending";
  return "paid";
}

function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/permission|forbidden|403/i.test(message)) {
    return (
      "Google Play refused the request. Invite the console's service account " +
      "in Play Console → Users and permissions and give it “View financial data”."
    );
  }
  if (/401|unauthorized|invalid_grant/i.test(message)) {
    return "Google rejected the console's credentials for the Play Developer API.";
  }
  if (/404|not found/i.test(message)) {
    return "Google Play has no record of this purchase token.";
  }
  if (/quota|429|rate/i.test(message)) {
    return "Google Play's daily quota for this check has been used up; it resets tomorrow.";
  }
  return message;
}

async function lookupOne(
  packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<Verification> {
  const client = getJwtClient();
  if (!client) {
    return unverified(
      "Google Play verification is not set up, so purchases cannot be confirmed with the store.",
    );
  }

  const url =
    `${API_ROOT}/applications/${encodeURIComponent(packageName)}` +
    `/purchases/products/${encodeURIComponent(productId)}` +
    `/tokens/${encodeURIComponent(purchaseToken)}`;

  try {
    const res = await client.request<ProductPurchase>({ url, method: "GET" });
    const body = res.data ?? {};
    return {
      verdict: toVerdict(body),
      source: "google-play",
      reason: null,
      acknowledged:
        typeof body.acknowledgementState === "number"
          ? body.acknowledgementState === 1
          : null,
      regionCode: body.regionCode ?? null,
      checkedAt: Date.now(),
    };
  } catch (err) {
    return unverified(describeError(err));
  }
}

export interface VerifiablePurchase {
  /** Play Console package name, read from the stored Google receipt. */
  packageName: string | null;
  productId: string;
  purchaseToken: string | null;
  platform: string;
}

export interface VerificationPass {
  /** Verdict per purchase token. */
  byToken: Map<string, Verification>;
  /** True when credentials for the Play Developer API are present. */
  configured: boolean;
  /** Set when every lookup failed the same way — worth showing once, not N times. */
  blockingReason: string | null;
  /** True when more purchases needed checking than one pass allows. */
  capped: boolean;
}

/**
 * Verify a batch of Google Play purchases, using the cache first and asking
 * Google only for what is missing or stale.
 *
 * Never throws: a store that cannot be reached produces `unverified` verdicts
 * and an explanation, so the console degrades to "we could not confirm this"
 * instead of going blank or, worse, quietly reporting test money as revenue.
 */
export async function verifyPlayPurchases(
  purchases: VerifiablePurchase[],
): Promise<VerificationPass> {
  const configured = isPlayVerificationConfigured();

  // With no credentials there is nothing to ask and nothing worth caching.
  // The caller reports the "not set up" state from `configured` alone, so
  // returning early avoids writing a pile of placeholder cache documents.
  if (!configured) {
    return { byToken: new Map(), configured, blockingReason: null, capped: false };
  }

  const verifiable = purchases.filter(
    (p) => p.packageName && p.purchaseToken && p.platform === "android",
  );
  const tokens = [...new Set(verifiable.map((p) => p.purchaseToken!))];

  const byToken = await readCache(tokens);
  const missing = verifiable.filter((p) => !byToken.has(p.purchaseToken!));

  // De-duplicate: several records can share a token only in malformed data,
  // but checking the same token twice would still burn quota.
  const seen = new Set<string>();
  const toCheck = missing.filter((p) => {
    if (seen.has(p.purchaseToken!)) return false;
    seen.add(p.purchaseToken!);
    return true;
  });

  const capped = toCheck.length > MAX_LOOKUPS_PER_PASS;
  const batch = toCheck.slice(0, MAX_LOOKUPS_PER_PASS);

  const results = await Promise.all(
    batch.map(async (p) => ({
      token: p.purchaseToken!,
      verification: await lookupOne(
        p.packageName!,
        p.productId,
        p.purchaseToken!,
      ),
    })),
  );

  for (const { token, verification } of results) {
    byToken.set(token, verification);
  }
  await writeCache(results);

  // If everything we asked about failed for the same reason, that reason is
  // the story — surface it once rather than as N identical row-level warnings.
  const failures = results.filter((r) => r.verification.verdict === "unverified");
  const blockingReason =
    results.length > 0 && failures.length === results.length
      ? failures[0].verification.reason
      : null;

  return { byToken, configured, blockingReason, capped };
}
