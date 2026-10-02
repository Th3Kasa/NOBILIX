"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { markTestAccount, unmarkTestAccount } from "@/lib/trapman/test-accounts";
import { markTestPurchases, clearTestPurchases } from "@/lib/trapman/test-purchases";
import { purchaseKey } from "@/lib/trapman/purchase-accounting";
import { getPurchasesData } from "./data";

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

export interface TestPurchasesState {
  ok?: boolean;
  error?: string;
  /** How many purchases the last action marked or unmarked. */
  count?: number;
}

async function writer(): Promise<{ id: string; email: string } | { error: string }> {
  try {
    return await requireWriteAccess();
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message.includes("read-only")
          ? "Your role is read-only."
          : "Your session expired — please sign in again.",
    };
  }
}

function refreshFigures() {
  updateTag("trapman-console");
  revalidatePath("/console/trapman/purchases");
  revalidatePath("/console/trapman");
  revalidatePath("/console/trapman/users");
}

/**
 * Mark every purchase that currently counts as a real sale as a test.
 *
 * For clearing out pre-launch and QA purchases in one go. Purchases recorded
 * after this runs count normally. Console-side only — the game's records are
 * untouched — and undone by unmarkAllTestPurchasesAction.
 */
export async function markAllPurchasesAsTestAction(): Promise<TestPurchasesState> {
  const admin = await writer();
  if ("error" in admin) return { error: admin.error };
  try {
    const data = await getPurchasesData();
    if (!data.connected) return { error: data.error ?? "Couldn't read purchases." };
    const keys = data.records.filter((r) => r.exclusion === null).map(purchaseKey);
    if (keys.length === 0) return { ok: true, count: 0 };
    const count = await markTestPurchases(keys, admin.email);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "purchases.test_purchases.mark_all",
      target: `${count} purchases`,
      metadata: { count },
    });
    refreshFigures();
    return { ok: true, count };
  } catch {
    return { error: "Couldn't save that — please try again." };
  }
}

/** Count every purchase marked as a test again. */
export async function unmarkAllTestPurchasesAction(): Promise<TestPurchasesState> {
  const admin = await writer();
  if ("error" in admin) return { error: admin.error };
  try {
    const count = await clearTestPurchases();
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "purchases.test_purchases.unmark_all",
      target: `${count} purchases`,
      metadata: { count },
    });
    refreshFigures();
    return { ok: true, count };
  } catch {
    return { error: "Couldn't save that — please try again." };
  }
}
