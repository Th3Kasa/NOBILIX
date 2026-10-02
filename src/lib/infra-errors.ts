/**
 * Recognise "the database is unavailable" failures and say so in plain words.
 *
 * Firestore reports these as gRPC status codes. Without this, sign-in showed
 * the framework's bare "This page couldn't load" screen, which says nothing
 * about the cause — once when the service-account key was revoked (16) and
 * once when the free daily quota ran out (8).
 *
 * Pure (no imports) so it is unit-tested.
 */

const QUOTA = 8; // RESOURCE_EXHAUSTED
const UNAUTHENTICATED = 16;
const UNAVAILABLE = 14;
const DEADLINE_EXCEEDED = 4;
const PERMISSION_DENIED = 7;

function codeOf(err: unknown): number | undefined {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "number" ? code : undefined;
}

function textOf(err: unknown): string {
  if (err instanceof Error) return `${err.message} ${(err as { details?: string }).details ?? ""}`;
  return typeof err === "string" ? err : "";
}

/**
 * An operator-facing explanation when `err` (or its `cause`, as Auth.js wraps
 * errors thrown inside `authorize`) is a database outage; otherwise null.
 */
export function describeInfraError(err: unknown, depth = 0): string | null {
  if (err == null || depth > 3) return null;
  const code = codeOf(err);
  const text = textOf(err);

  if (code === QUOTA || /RESOURCE_EXHAUSTED|quota exceeded/i.test(text)) {
    return "The game's database has used up its free daily allowance, so sign-in can't check your account. It resets at midnight US Pacific time (about 5–6 pm in Sydney), or straight away once the Firebase project is upgraded to the Blaze plan.";
  }
  if (code === UNAUTHENTICATED || code === PERMISSION_DENIED || /UNAUTHENTICATED|PERMISSION_DENIED/i.test(text)) {
    return "The console's key to the game's database was rejected. The Firebase service-account key in Vercel (FIREBASE_SERVICE_ACCOUNT_B64) needs replacing.";
  }
  if (code === UNAVAILABLE || code === DEADLINE_EXCEEDED || /\bUNAVAILABLE\b|DEADLINE_EXCEEDED/i.test(text)) {
    return "The game's database didn't respond. Wait a minute and try again.";
  }

  // Auth.js and other wrappers keep the original failure on `cause` (or `cause.err`).
  const cause = (err as { cause?: unknown }).cause;
  if (cause && typeof cause === "object" && "err" in cause) {
    const inner = describeInfraError((cause as { err?: unknown }).err, depth + 1);
    if (inner) return inner;
  }
  return describeInfraError(cause, depth + 1);
}
