import "server-only";
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
  "level",
  "highScore",
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
