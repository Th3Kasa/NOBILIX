import "server-only";
import { unstable_cache } from "next/cache";
import { getAuthAdmin } from "@/lib/firebase/auth";
import { getDb } from "@/lib/firebase/firestore";
import { GAME } from "@/lib/firebase/collections";
import type { GameUser } from "@/types";

/**
 * Player (game user) data-access against the live Firestore `users` collection.
 *
 * Field names follow the documented TrapMan schema and are confirmed in Phase 0.
 * Reads are defensive — unknown/extra fields are preserved on the GameUser object.
 */

const EDITABLE_FIELDS = [
  "displayName",
  "country",
  "character",
  "currentLevel",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];


function mapUser(
  id: string,
  data: FirebaseFirestore.DocumentData,
): GameUser {
  return {
    ...data,
    uid: id,
    displayName: data.displayName ?? data.username ?? data.name ?? null,
    email: data.email ?? null,
    country: data.country ?? null,
    character: data.character ?? null,
    level: typeof data.level === "number" ? data.level : null,
    highScore:
      typeof data.highScore === "number"
        ? data.highScore
        : typeof data.high_score === "number"
          ? data.high_score
          : null,
    fcmToken: data.fcmToken ?? data.fcm_token ?? null,
    isGuest: data.isGuest ?? data.is_guest ?? false,
    createdAt: data.createdAt ?? null,
    lastSeenAt: data.lastSeenAt ?? data.lastActiveAt ?? null,
  };
}

// NOTE: the old listUsers() lived here with where(country/isGuest) +
// orderBy(displayName|createdAt) queries. It was dead code (the players page
// uses users/data.ts, which scans and filters in memory because the game
// never writes createdAt/displayName), and each of its filter combinations
// would have thrown FAILED_PRECONDITION on first use — Firestore has no
// composite indexes declared for them. Removed rather than indexed.

/** A lookup that partly failed. Thrown so the failure is never cached. */
class PartialEmailLookup extends Error {
  constructor(readonly emails: Record<string, string>) {
    super("Player email lookup partly failed");
  }
}

async function loadPlayerEmails(
  unique: string[],
): Promise<Record<string, string>> {
  const emails: Record<string, string> = {};
  let failed = false;

  try {
    const db = getDb();
    for (let i = 0; i < unique.length; i += 100) {
      const docs = await db.getAll(
        ...unique.slice(i, i + 100).map((uid) => db.collection(GAME.users).doc(uid)),
      );
      for (const doc of docs) {
        const email = doc.data()?.email;
        if (typeof email === "string" && email.trim()) emails[doc.id] = email.trim();
      }
    }
  } catch (err) {
    failed = true;
    console.error("[users] email lookup (profiles) failed", err);
  }

  const missing = unique.filter((uid) => !emails[uid]);
  try {
    // getUsers accepts at most 100 identifiers per call.
    for (let i = 0; i < missing.length; i += 100) {
      const { users } = await getAuthAdmin().getUsers(
        missing.slice(i, i + 100).map((uid) => ({ uid })),
      );
      for (const u of users) if (u.email) emails[u.uid] = u.email;
    }
  } catch (err) {
    failed = true;
    console.error("[users] email lookup (auth) failed", err);
  }

  if (failed) throw new PartialEmailLookup(emails);
  return emails;
}

/**
 * Cached for an hour: an email address almost never changes, and without this
 * the Leaderboard's auto-refresh re-read every player profile on screen once a
 * minute — the extra reads that helped exhaust the project's daily quota.
 */
const loadPlayerEmailsCached = unstable_cache(loadPlayerEmails, ["player-emails"], {
  revalidate: 3600,
});

/**
 * Email addresses for a set of players, keyed by uid.
 *
 * The game's profile document is checked first; the Firebase Auth record is
 * the fallback, since a player who signed in with Apple or Google can have an
 * address there that the game never copied onto their profile. Players with
 * neither (guests, seeded entries) are simply absent from the result.
 * Never throws — a lookup failure only hides the email buttons.
 */
export async function getPlayerEmails(
  uids: string[],
): Promise<Record<string, string>> {
  // Sorted so the same set of players always hits the same cache entry.
  const unique = [...new Set(uids.filter(Boolean))].sort();
  if (unique.length === 0) return {};
  try {
    return await loadPlayerEmailsCached(unique);
  } catch (err) {
    return err instanceof PartialEmailLookup ? err.emails : {};
  }
}

export async function getUser(uid: string): Promise<GameUser | null> {
  const doc = await getDb().collection(GAME.users).doc(uid).get();
  if (!doc.exists) return null;
  return mapUser(doc.id, doc.data()!);
}

/** Apply a whitelisted set of profile edits (data-correction right). */
export async function updateUser(
  uid: string,
  patch: Partial<Record<EditableField, unknown>>,
): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in patch && patch[key] !== undefined) clean[key] = patch[key];
  }
  if (Object.keys(clean).length === 0) return;
  await getDb().collection(GAME.users).doc(uid).update(clean);
}

/**
 * Compliant hard delete: removes the Firestore profile AND the Firebase Auth
 * record, satisfying the "hard delete users/{uid}" data-compliance commitment.
 */
export async function deleteUserCompletely(uid: string): Promise<{
  firestoreDeleted: boolean;
  authDeleted: boolean;
}> {
  await getDb().collection(GAME.users).doc(uid).delete();
  let authDeleted = false;

  try {
    await getAuthAdmin().deleteUser(uid);
    authDeleted = true;
  } catch (err) {
    // Guest/anonymous users may not have an Auth record — that's acceptable.
    const code = (err as { code?: string })?.code;
    if (code !== "auth/user-not-found") throw err;
  }

  return { firestoreDeleted: true, authDeleted };
}

/** Full per-user data bundle for the portability right. */
export async function buildUserExport(uid: string): Promise<GameUser | null> {
  return getUser(uid);
}
