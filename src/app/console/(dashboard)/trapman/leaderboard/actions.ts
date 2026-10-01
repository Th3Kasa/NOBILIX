"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import {
  removeLeaderboardEntry,
  removeLeaderboardEntries,
  archiveAndReset,
  setLeaderboardScore,
} from "@/lib/leaderboard";
import type { CompetitionPeriod } from "@/types";

export interface ResetState {
  ok?: boolean;
  error?: string;
  summary?: {
    label: string;
    totalEntries: number;
    winnersCount: number;
    clearedMainBoard: boolean;
    clearedEventBoards: { eventId: string; deleted: number }[];
  };
}

const resetSchema = z.object({
  periodType: z.enum(["daily", "weekly", "monthly", "custom"]),
  label: z.string().min(1, "Give this competition a name.").max(120),
  confirm: z.string().refine((v) => v === "RESET", {
    message: 'Type "RESET" to confirm.',
  }),
});

export async function resetLeaderboardAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }

  const { periodType, label } = parsed.data;

  // Which boards to wipe. Checkboxes are absent from the payload when
  // unticked, so the main board is opt-out and event boards are opt-in.
  const includeMainBoard = formData.get("includeMainBoard") === "on";
  const eventIds = formData
    .getAll("eventIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (!includeMainBoard && eventIds.length === 0) {
    return { error: "Choose at least one leaderboard to reset." };
  }

  try {
    const result = await archiveAndReset(
      periodType as CompetitionPeriod,
      label,
      admin.email,
      { includeMainBoard, eventIds },
    );

    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "leaderboard.reset",
      target: result.archivedId,
      metadata: {
        periodType,
        label,
        totalEntries: result.totalEntries,
        winnersCount: result.winnersCount,
        clearedMainBoard: result.clearedMainBoard,
        clearedEventBoards: result.clearedEventBoards,
      },
    });

    revalidatePath("/console/trapman/leaderboard");
    return {
      ok: true,
      summary: {
        label,
        totalEntries: result.totalEntries,
        winnersCount: result.winnersCount,
        clearedMainBoard: result.clearedMainBoard,
        clearedEventBoards: result.clearedEventBoards,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Reset failed." };
  }
}

export interface RemoveState {
  ok?: boolean;
  error?: string;
  /** How many entries the last successful removal deleted. */
  removed?: number;
}

export async function removeEntryAction(
  _prev: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const uid = formData.get("uid");
  const displayName = formData.get("displayName") ?? uid;
  if (typeof uid !== "string" || !uid) {
    return { error: "Missing player UID." };
  }

  try {
    await removeLeaderboardEntry(uid);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "leaderboard.remove_entry",
      target: uid,
      metadata: { displayName },
    });
    revalidatePath("/console/trapman/leaderboard");
    return { ok: true, removed: 1 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Remove failed." };
  }
}

/** Guards a single request against wiping the board by accident. */
const MAX_BULK_REMOVE = 500;

/**
 * Remove several entries at once.
 *
 * Separate from the reset flow on purpose: reset archives winners and starts a
 * new competition, while this just deletes chosen rows (seeded placeholders,
 * cheaters, duplicates) and leaves the competition running.
 */
export async function removeEntriesAction(
  _prev: RemoveState,
  formData: FormData,
): Promise<RemoveState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const uids = formData
    .getAll("uids")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (uids.length === 0) return { error: "Select at least one entry." };
  if (uids.length > MAX_BULK_REMOVE) {
    return {
      error: `Select at most ${MAX_BULK_REMOVE} entries at a time.`,
    };
  }

  try {
    const removed = await removeLeaderboardEntries(uids);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "leaderboard.remove_entries",
      target: `${removed} entries`,
      // Store the ids: a bulk delete is the one moderation action where
      // "which rows?" cannot be reconstructed after the fact.
      metadata: { count: removed, uids },
    });
    revalidatePath("/console/trapman/leaderboard");
    return { ok: true, removed };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Remove failed." };
  }
}

export interface EditScoreState {
  ok?: boolean;
  error?: string;
}

const editScoreSchema = z.object({
  uid: z.string().min(1, "Missing player UID."),
  score: z.coerce
    .number({ error: "Enter a whole number." })
    .int("Enter a whole number.")
    .min(0, "Score can't be negative.")
    .max(1_000_000_000_000, "That score is too large."),
});

/** Set one player's score on the all-time board. */
export async function editScoreAction(
  _prev: EditScoreState,
  formData: FormData,
): Promise<EditScoreState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  // Coercion turns "" into 0, so a cleared field must be rejected first.
  const rawScore = String(formData.get("score") ?? "").trim();
  if (!rawScore) return { error: "Enter a score." };

  const parsed = editScoreSchema.safeParse({
    uid: formData.get("uid"),
    score: rawScore,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid score." };
  }
  const { uid, score } = parsed.data;

  try {
    const { previous } = await setLeaderboardScore(uid, score);
    // Console-only audit record. Players never see this.
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "leaderboard.edit_score",
      target: uid,
      metadata: {
        displayName: formData.get("displayName") ?? uid,
        from: previous,
        to: score,
      },
    });
    revalidatePath("/console/trapman/leaderboard");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save the score." };
  }
}
