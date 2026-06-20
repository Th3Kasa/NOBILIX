import "server-only";
import { getDb, getAuthAdmin } from "@/lib/firebase/admin";
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

// Firestore prefix-search upper bound: highest BMP private-use codepoint.
const HIGH_SENTINEL = "";

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

export interface ListUsersParams {
  search?: string;
  country?: string;
  guest?: "all" | "guest" | "registered";
  limit?: number;
  cursor?: number | null; // createdAt of last item for pagination
}

export interface ListUsersResult {
  users: GameUser[];
  nextCursor: number | null;
  connected: boolean;
  error?: string;
}

export async function listUsers(
  params: ListUsersParams = {},
): Promise<ListUsersResult> {
  const { search, country, guest = "all", limit = 50, cursor } = params;
  try {
    const db = getDb();
    let q: FirebaseFirestore.Query = db.collection(GAME.users);

    // Exact email lookup short-circuits everything else.
    if (search && search.includes("@")) {
      const snap = await q
        .where("email", "==", search.toLowerCase())
        .limit(limit)
        .get();
      return {
        users: snap.docs.map((d) => mapUser(d.id, d.data())),
        nextCursor: null,
        connected: true,
      };
    }

    if (country) q = q.where("country", "==", country.toUpperCase());
    if (guest === "guest") q = q.where("isGuest", "==", true);
    if (guest === "registered") q = q.where("isGuest", "==", false);

    if (search) {
      // Prefix search on displayName (Firestore range trick).
      q = q.orderBy("displayName").startAt(search).endAt(search + HIGH_SENTINEL);
    } else {
      q = q.orderBy("createdAt", "desc");
      if (cursor) q = q.startAfter(cursor);
    }

    const snap = await q.limit(limit).get();
    const users = snap.docs.map((d) => mapUser(d.id, d.data()));
    const last = users[users.length - 1];
    const nextCursor =
      !search && users.length === limit && last?.createdAt
        ? (last.createdAt as number)
        : null;

    return { users, nextCursor, connected: true };
  } catch (err) {
    return {
      users: [],
      nextCursor: null,
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
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
