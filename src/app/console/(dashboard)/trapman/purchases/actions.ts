"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { markTestAccount, unmarkTestAccount } from "@/lib/trapman/test-accounts";

/**
 * Marking a buyer as an internal tester excludes their purchases from every
 * revenue figure. It is a console-side register only — no game-owned document
 * is written or deleted, so the action is always reversible.
 */

export interface TestAccountState {
  ok?: boolean;
  error?: string;
}

const schema = z.object({
  uid: z.string().trim().min(1, "Missing player id."),
  label: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(300).optional(),
});

export async function markTestAccountAction(
  _prev: TestAccountState,
  formData: FormData,
): Promise<TestAccountState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message.includes("read-only")
          ? "Your role is read-only."
          : "Your session expired — please sign in again.",
    };
  }

  const parsed = schema.safeParse({
    uid: formData.get("uid"),
    label: formData.get("label") ?? undefined,
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    await markTestAccount(
      parsed.data.uid,
      parsed.data.label || null,
      parsed.data.reason || null,
      admin.email,
    );
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "purchases.test_account.mark",
      target: parsed.data.uid,
    });
  } catch {
    return { error: "Couldn't save that — please try again." };
  }

  // updateTag gives read-your-own-writes semantics from a Server Action, so the
  // revenue figures reflect the exclusion immediately instead of serving stale
  // numbers. revalidatePath then re-renders the affected routes.
  updateTag("trapman-console");
  revalidatePath("/console/trapman/purchases");
  revalidatePath("/console/trapman");
  return { ok: true };
}

export async function unmarkTestAccountAction(
  _prev: TestAccountState,
  formData: FormData,
): Promise<TestAccountState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message.includes("read-only")
          ? "Your role is read-only."
          : "Your session expired — please sign in again.",
    };
  }

  const uid = String(formData.get("uid") ?? "").trim();
  if (!uid) return { error: "Missing player id." };

  try {
    await unmarkTestAccount(uid);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "purchases.test_account.unmark",
      target: uid,
    });
  } catch {
    return { error: "Couldn't save that — please try again." };
  }

  updateTag("trapman-console");
  revalidatePath("/console/trapman/purchases");
  revalidatePath("/console/trapman");
  return { ok: true };
}
