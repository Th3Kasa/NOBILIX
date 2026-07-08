"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { updateUser, deleteUserCompletely, getUser } from "@/lib/users";
import { recordAudit } from "@/lib/audit";

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

const updateSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().max(120).optional(),
  country: z.string().max(2).optional(),
  character: z.string().max(80).optional(),
  level: z.coerce.number().int().min(0).max(1_000_000).optional(),
  highScore: z.coerce.number().int().min(0).optional(),
});

export async function updateUserAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the field values." };
  const { uid, ...patch } = parsed.data;

  try {
    await updateUser(uid, patch);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "user.update",
      target: uid,
      metadata: patch,
    });
    revalidatePath(`/console/trapman/users/${uid}`);
    revalidatePath("/console/trapman/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed." };
  }
}

const deleteSchema = z.object({
  uid: z.string().min(1),
  confirm: z.string(),
});

export async function deleteUserAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request." };
  const { uid, confirm } = parsed.data;

  // Require the operator to type the exact uid to confirm a destructive action.
  if (confirm !== uid) {
    return { error: "Confirmation text does not match the player ID." };
  }

  try {
    const target = await getUser(uid);
    const result = await deleteUserCompletely(uid);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "user.delete",
      target: uid,
      metadata: {
        email: target?.email ?? null,
        displayName: target?.displayName ?? null,
        ...result,
      },
    });
    revalidatePath("/console/trapman/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Deletion failed." };
  }
}
