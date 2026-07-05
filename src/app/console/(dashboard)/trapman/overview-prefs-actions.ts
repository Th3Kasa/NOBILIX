"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { updateOverviewPrefs, resetOverviewPrefs } from "@/lib/admins";
import { OVERVIEW_WIDGET_IDS } from "./overview-widgets";

// Deliberately requireAdmin (not requireWriteAccess): viewers customise
// their own overview too — the write is scoped to the caller's own doc.

const prefsSchema = z.object({
  order: z.array(z.string().max(64)).max(32),
  hidden: z.array(z.string().max(64)).max(32),
});

export type OverviewPrefsResult = { ok: true } | { ok: false; error: string };

const KNOWN_IDS = new Set(OVERVIEW_WIDGET_IDS);

function sanitize(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => KNOWN_IDS.has(id)))];
}

export async function saveOverviewPrefs(
  input: unknown,
): Promise<OverviewPrefsResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That layout could not be saved." };
  }

  await updateOverviewPrefs(admin.id, {
    order: sanitize(parsed.data.order),
    hidden: sanitize(parsed.data.hidden),
  });
  revalidatePath("/console/trapman");
  return { ok: true };
}

export async function resetOverviewPrefsAction(): Promise<OverviewPrefsResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  await resetOverviewPrefs(admin.id);
  revalidatePath("/console/trapman");
  return { ok: true };
}
