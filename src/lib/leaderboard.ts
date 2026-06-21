import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { GAME, CRM } from "@/lib/firebase/collections";
import type {
  LeaderboardEntry,
  CompetitionPeriod,
  CompetitionRecord,
} from "@/types";

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
    // We'll try "score" first; Phase 0 will confirm the real field name.
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

/** Remove a single player from the leaderboard (moderation). */
export async function removeLeaderboardEntry(uid: string): Promise<void> {
  await getDb().collection(GAME.leaderboard).doc(uid).delete();
}

/** Batch-delete every document in the leaderboard collection, 500 at a time. */
async function clearLeaderboard(): Promise<number> {
  const db = getDb();
  let totalDeleted = 0;

  for (;;) {
    const snap = await db.collection(GAME.leaderboard).limit(500).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snap.docs.length;
    if (snap.docs.length < 500) break;
  }

  return totalDeleted;
}

export interface ArchiveResult {
  archivedId: string;
  totalEntries: number;
  winnersCount: number;
}

/**
 * Save the top-10 winners to _crm_competitions, then wipe the leaderboard
 * so the next competition period starts fresh.
 */
export async function archiveAndReset(
  periodType: CompetitionPeriod,
  label: string,
  resetBy: string,
): Promise<ArchiveResult> {
  const db = getDb();
  const col = db.collection(GAME.leaderboard);

  // Capture winners (top 10) before clearing.
  const topSnap = await col
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .catch(() => col.orderBy("highScore", "desc").limit(10).get());

  const countSnap = await col.count().get();
  const totalEntries = countSnap.data().count;

  const winners: LeaderboardEntry[] = topSnap.docs.map((d, i) =>
    mapEntry(d.id, d.data(), i + 1),
  );

  // Write archive document.
  const archiveRef = db.collection(CRM.competitions).doc();
  await archiveRef.set({
    periodType,
    label,
    resetAt: Date.now(),
    resetBy,
    totalEntries,
    winners,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Wipe the leaderboard.
  await clearLeaderboard();

  return {
    archivedId: archiveRef.id,
    totalEntries,
    winnersCount: winners.length,
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
      } satisfies CompetitionRecord;
    });
  } catch {
    return [];
  }
}
