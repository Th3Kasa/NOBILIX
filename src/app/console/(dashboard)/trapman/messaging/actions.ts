"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWriteAccess } from "@/lib/authz";
import { sendCampaign, previewAudience } from "@/lib/campaigns";
import { recordAudit } from "@/lib/audit";
import type { CampaignAudience } from "@/types";

export interface SendState {
  ok?: boolean;
  error?: string;
  summary?: { recipients: number; success: number; failure: number };
}

const baseSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  body: z.string().min(1, "Message is required").max(1000),
  audienceType: z.enum(["single", "segment", "broadcast"]),
  uid: z.string().optional(),
  country: z.string().max(2).optional(),
  character: z.string().max(80).optional(),
  minLevel: z.coerce.number().int().min(0).optional(),
  maxLevel: z.coerce.number().int().min(0).optional(),
  lastActiveDays: z.coerce.number().int().min(0).optional(),
});

function buildAudience(d: z.infer<typeof baseSchema>): CampaignAudience | null {
  if (d.audienceType === "single") {
    if (!d.uid) return null;
    return { type: "single", uid: d.uid };
  }
  if (d.audienceType === "broadcast") return { type: "broadcast" };
  return {
    type: "segment",
    filters: {
      country: d.country || undefined,
      character: d.character || undefined,
      minLevel: d.minLevel,
      maxLevel: d.maxLevel,
      lastActiveDays: d.lastActiveDays,
    },
  };
}

export async function previewAction(
  _prev: { count?: number; error?: string },
  formData: FormData,
): Promise<{ count?: number; error?: string }> {
  try {
    await requireWriteAccess();
    const parsed = baseSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Check the form fields." };
    const audience = buildAudience(parsed.data);
    if (!audience) return { error: "Select a valid audience." };
    const count = await previewAudience(audience);
    return { count };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Preview failed." };
  }
}

export async function sendCampaignAction(
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  let admin;
  try {
    admin = await requireWriteAccess();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  const parsed = baseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form." };
  }
  const audience = buildAudience(parsed.data);
  if (!audience) return { error: "Select a valid audience." };

  try {
    const result = await sendCampaign({
      title: parsed.data.title,
      body: parsed.data.body,
      audience,
      createdBy: admin.email,
    });
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "push.send",
      target: result.id,
      metadata: {
        audience,
        recipients: result.recipientCount,
        success: result.successCount,
        failure: result.failureCount,
      },
    });
    revalidatePath("/console/messaging");
    return {
      ok: true,
      summary: {
        recipients: result.recipientCount,
        success: result.successCount,
        failure: result.failureCount,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Send failed." };
  }
}
