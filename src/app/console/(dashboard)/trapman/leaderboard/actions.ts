"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import {
  removeLeaderboardEntry,
  archiveAndReset,
} from "@/lib/leaderboard";
import type { CompetitionPeriod } from "@/types";

export interface ResetState {
  ok?: boolean;
  error?: string;
  summary?: {
    label: string;
    totalEntries: number;
    winnersCount: number;
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

  try {
    const result = await archiveAndReset(
      periodType as CompetitionPeriod,
      label,
      admin.email,
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
      },
    });

    revalidatePath("/console/leaderboard");
    return {
      ok: true,
      summary: {
        label,
        totalEntries: result.totalEntries,
        winnersCount: result.winnersCount,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Reset failed." };
  }
}

export interface RemoveState {
  ok?: boolean;
  error?: string;
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
    revalidatePath("/console/leaderboard");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Remove failed." };
  }
}
