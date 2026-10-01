import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { GAME, CRM } from "@/lib/firebase/collections";
import type {
  LeaderboardEntry,
  CompetitionPeriod,
  CompetitionRecord,
} from "@/types";
import { WINNER_PLACES } from "@/lib/trapman/winners";

/**
 * Leaderboard reads and moderation.
 *
 * TrapMan keeps scores in two places, and a reset that only knows about one of
 * them leaves a competition half-running:
 *
 *   leaderboard/{uid}                             — the all-time board
 *   eventLeaderboards/{eventId}/players/{uid}     — one board per timed event
 *
 * The {eventId} documents do not exist as documents — they are implicit
 * parents holding only a subcollection — so a plain `.get()` on
 * `eventLeaderboards` returns nothing and the boards look empty. They are
 * discovered with `listDocuments()`, which returns implicit parents too.
 */

/** Firestore's hard limit on operations in one batched write. */
const BATCH_LIMIT = 500;

function mapEntry(
  id: string,
  data: FirebaseFirestore.DocumentData,
  rank: number,
): LeaderboardEntry {
  return {
    uid: id,
    displayName: data.displayName ?? data.username ?? data.name ?? null,
    score:
      typeof data.score === "number"
        ? data.score
        : typeof data.highScore === "number"
          ? data.highScore
          : typeof data.high_score === "number"
            ? data.high_score
            : 0,
    rank,
    country: data.country ?? null,
    character: data.character ?? null,
    updatedAt: data.updatedAt ?? data.lastSeenAt ?? null,
  };
}

export interface ListLeaderboardResult {
  entries: LeaderboardEntry[];
  totalCount: number;
  connected: boolean;
  error?: string;
}

export async function listLeaderboard(
  limit = 100,
  offset = 0,
): Promise<ListLeaderboardResult> {
  try {
    const db = getDb();
    const col = db.collection(GAME.leaderboard);

    // Score field: try "score", fall back to "highScore" ordering.
    const [snap, countSnap] = await Promise.all([
      col
        .orderBy("score", "desc")
        .offset(offset)
        .limit(limit)
        .get()
        .catch(() =>
          col.orderBy("highScore", "desc").offset(offset).limit(limit).get(),
        ),
      col.count().get(),
    ]);

    const totalCount = countSnap.data().count;
    const entries = snap.docs.map((d, i) =>
      mapEntry(d.id, d.data(), offset + i + 1),
    );

    return { entries, totalCount, connected: true };
  } catch (err) {
    return {
      entries: [],
      totalCount: 0,
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Event boards ────────────────────────────────────────────────────────────

export interface EventBoard {
  eventId: string;
  /** Subcollection holding the entries, e.g. "players". */
  subcollection: string;
  entryCount: number;
  /** True when config/currentEvent points at this event. */
  isCurrent: boolean;
  /** Friendly name from config/currentEvent, when this is the current event. */
  eventName: string | null;
}

/** Which event the game is currently running, from `config/currentEvent`. */
async function readCurrentEvent(): Promise<{
  eventId: string | null;
  eventName: string | null;
}> {
  try {
    const doc = await getDb().collection(GAME.config).doc("currentEvent").get();
    const data = doc.data();
    return {
      eventId: typeof data?.eventId === "string" ? data.eventId : null,
      eventName: typeof data?.eventName === "string" ? data.eventName : null,
    };
  } catch {
    return { eventId: null, eventName: null };
  }
}

/**
 * Every per-event board, with how many entries each holds.
 *
 * Surfaces boards the console previously could not see at all, which is why
 * "Reset competition" appeared to work while leaving the event board intact.
 */
export async function listEventBoards(): Promise<EventBoard[]> {
  try {
    const db = getDb();
    const [refs, current] = await Promise.all([
      db.collection(GAME.eventLeaderboards).listDocuments(),
      readCurrentEvent(),
    ]);

    const boards = await Promise.all(
      refs.map(async (ref) => {
        const subs = await ref.listCollections();
        const counts = await Promise.all(
          subs.map(async (sub) => ({
            name: sub.id,
            count: (await sub.count().get()).data().count,
          })),
        );
        // An event board is one subcollection in practice; if a build ever
        // adds another, report the one that actually holds entries.
        const primary =
          counts.sort((a, b) => b.count - a.count)[0] ??
          ({ name: "players", count: 0 } as const);
        return {
          eventId: ref.id,
          subcollection: primary.name,
          entryCount: primary.count,
          isCurrent: ref.id === current.eventId,
          eventName: ref.id === current.eventId ? current.eventName : null,
        } satisfies EventBoard;
      }),
    );

    // Current event first, then biggest boards.
    return boards.sort(
      (a, b) =>
        Number(b.isCurrent) - Number(a.isCurrent) || b.entryCount - a.entryCount,
    );
  } catch {
    return [];
  }
}

// ─── Moderation ──────────────────────────────────────────────────────────────

/** Remove a single player from the all-time leaderboard. */
export async function removeLeaderboardEntry(uid: string): Promise<void> {
  await getDb().collection(GAME.leaderboard).doc(uid).delete();
}

/**
 * Remove several players from the all-time leaderboard in one go.
 *
 * Chunked to Firestore's 500-operation batch limit so clearing a large block
 * of seeded or bot entries is one action rather than a hundred confirmations.
 * Returns how many deletes were issued.
 */
export async function removeLeaderboardEntries(
  uids: string[],
): Promise<number> {
  const db = getDb();
  const unique = [...new Set(uids.filter(Boolean))];

  for (let i = 0; i < unique.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const uid of unique.slice(i, i + BATCH_LIMIT)) {
      batch.delete(db.collection(GAME.leaderboard).doc(uid));
    }
    await batch.commit();
  }

  return unique.length;
}

/** Score fields a board entry may carry, in the order mapEntry reads them. */
const SCORE_FIELDS = ["score", "highScore", "high_score"] as const;

/**
 * Overwrite one player's score on the all-time board.
 *
 * Writes every score field the entry already uses (falling back to `score`),
 * so the board's ordering and mapEntry agree on the new value. Nothing else on
 * the entry changes — no marker fields — so the game shows it like any score.
 * Returns the score it replaced.
 */
export async function setLeaderboardScore(
  uid: string,
  score: number,
): Promise<{ previous: number }> {
  const db = getDb();
  const ref = db.collection(GAME.leaderboard).doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error("That player is no longer on the leaderboard.");
    }
    const data = snap.data() ?? {};
    const present = SCORE_FIELDS.filter((f) => typeof data[f] === "number");
    const fields = present.length > 0 ? present : (["score"] as const);

    tx.update(ref, Object.fromEntries(fields.map((f) => [f, score])));
    return { previous: mapEntry(uid, data, 0).score };
  });
}

/** Delete every document in a collection, a batch at a time. */
async function clearCollection(
  col: FirebaseFirestore.CollectionReference,
): Promise<number> {
  const db = getDb();
  let totalDeleted = 0;

  for (;;) {
    const snap = await col.limit(BATCH_LIMIT).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snap.docs.length;
    if (snap.docs.length < BATCH_LIMIT) break;
  }

  return totalDeleted;
}

export interface ArchiveResult {
  archivedId: string;
  /** Entries on the all-time board at archive time. */
  totalEntries: number;
  winnersCount: number;
  /** Whether the all-time board was wiped. */
  clearedMainBoard: boolean;
  /** Per-event boards wiped, with how many entries each lost. */
  clearedEventBoards: { eventId: string; deleted: number }[];
}

export interface ResetOptions {
  /** Wipe `leaderboard` (the all-time board). */
  includeMainBoard: boolean;
  /** Event ids whose boards should also be wiped. */
  eventIds: string[];
}

/**
 * Archive the top WINNER_PLACES winners, then wipe the boards the operator
 * selected.
 *
 * Winners are always captured from the all-time board before anything is
 * deleted, so the archive is written even for an event-only reset.
 */
export async function archiveAndReset(
  periodType: CompetitionPeriod,
  label: string,
  resetBy: string,
  options: ResetOptions,
): Promise<ArchiveResult> {
  const db = getDb();
  const col = db.collection(GAME.leaderboard);

  // Capture winners before clearing anything.
  const topSnap = await col
    .orderBy("score", "desc")
    .limit(WINNER_PLACES)
    .get()
    .catch(() => col.orderBy("highScore", "desc").limit(WINNER_PLACES).get());

  const countSnap = await col.count().get();
  const totalEntries = countSnap.data().count;

  const winners: LeaderboardEntry[] = topSnap.docs.map((d, i) =>
    mapEntry(d.id, d.data(), i + 1),
  );

  // Resolve the event boards to clear before deleting, so the archive can
  // record exactly what was wiped.
  const allBoards = await listEventBoards();
  const targeted = allBoards.filter((b) => options.eventIds.includes(b.eventId));

  const clearedEventBoards: { eventId: string; deleted: number }[] = [];
  for (const board of targeted) {
    const deleted = await clearCollection(
      db
        .collection(GAME.eventLeaderboards)
        .doc(board.eventId)
        .collection(board.subcollection),
    );
    clearedEventBoards.push({ eventId: board.eventId, deleted });
  }

  if (options.includeMainBoard) {
    await clearCollection(col);
  }

  const archiveRef = db.collection(CRM.competitions).doc();
  await archiveRef.set({
    periodType,
    label,
    resetAt: Date.now(),
    resetBy,
    totalEntries,
    winners,
    clearedMainBoard: options.includeMainBoard,
    clearedEventBoards,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    archivedId: archiveRef.id,
    totalEntries,
    winnersCount: winners.length,
    clearedMainBoard: options.includeMainBoard,
    clearedEventBoards,
  };
}

/** Return past competition archives, newest first. */
export async function getCompetitionHistory(
  limit = 20,
): Promise<CompetitionRecord[]> {
  try {
    const snap = await getDb()
      .collection(CRM.competitions)
      .orderBy("resetAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        periodType: data.periodType ?? "custom",
        label: data.label ?? "",
        resetAt: data.resetAt ?? 0,
        resetBy: data.resetBy ?? "",
        totalEntries: data.totalEntries ?? 0,
        winners: (data.winners ?? []) as LeaderboardEntry[],
        clearedEventBoards: Array.isArray(data.clearedEventBoards)
          ? data.clearedEventBoards
          : [],
      } satisfies CompetitionRecord;
    });
  } catch {
    return [];
  }
}
