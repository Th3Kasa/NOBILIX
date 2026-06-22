"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import {
  getAdminById,
  verifyPassword,
  updatePassword,
} from "@/lib/admins";
import { recordAudit } from "@/lib/audit";

export interface ChangePasswordState {
  ok?: boolean;
  error?: string;
}

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current one.",
    path: ["newPassword"],
  });

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Your session expired — please sign in again." };
  }

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const admin = await getAdminById(session.id);
  if (!admin) return { error: "Account not found." };

  const ok = await verifyPassword(admin, parsed.data.currentPassword);
  if (!ok) {
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "auth.password.change_failed",
    });
    return { error: "Your current password is incorrect." };
  }

  await updatePassword(admin.id, parsed.data.newPassword);
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.password.changed",
  });

  return { ok: true };
}
