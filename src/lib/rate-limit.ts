import "server-only";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/firestore";

/**
 * Firestore-backed fixed-window rate limiter for the player API routes.
 *
 * Each `key` (e.g. "session-ip:1.2.3.4") gets one counter document per
 * window in the `_rate_limits` collection; the doc id embeds the window
 * start so a new window naturally starts a fresh counter. Old docs are
 * inert (they're keyed to past windows) and can be cleaned up with a
 * Firestore TTL policy on `expiresAt` if desired.
 *
 * Design constraints, deliberately:
 * - FAIL OPEN: if Firestore is unreachable the request is allowed — an
 *   infrastructure outage must never lock players out of their accounts.
 * - Fixed window (not sliding): cheap (one transaction per request) and
 *   good enough to blunt brute force / spam on these low-volume routes.
 * - Per-IP keys are best-effort: `x-forwarded-for` is spoofable in
 *   general, but on Vercel the first hop is set by the platform. Firebase
 *   Auth remains the primary client-side brute-force throttle.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const docId = `${key}:${windowStart}`;
  const retryAfterSeconds = Math.ceil((windowStart + windowMs - Date.now()) / 1000);

  try {
    const db = getDb();
    const ref = db.collection("_rate_limits").doc(docId);
    const count = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.data()?.count as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(ref, {
        count: next,
        key,
        windowStart,
        expiresAt: new Date(windowStart + windowMs * 2),
      });
      return next;
    });
    return { allowed: count <= max, retryAfterSeconds };
  } catch (err) {
    console.error("[rate-limit] fail-open:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** First hop of x-forwarded-for (set by the platform on Vercel). */
export function clientIpFrom(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

/** Standard 429 payload with Retry-After. */
export function rateLimited(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests — please wait and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(retryAfterSeconds, 1)) },
    },
  );
}
