"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import { sendCampaign, previewAudience } from "@/lib/campaigns";
import { recordAudit } from "@/lib/audit";
import type { CampaignFailure } from "@/types";
import { composeSchema, buildAudience } from "./form";

export interface SendState {
  ok?: boolean;
  error?: string;
  summary?: {
    recipients: number;
    success: number;
    failure: number;
    matched: number;
    unreachable: number;
    failures: CampaignFailure[];
  };
}

export interface PreviewState {
  /** Devices that would actually be sent to. */
  count?: number;
  /** Players matching the audience, reachable or not. */
  matched?: number;
  /** Matched players with no device token. */
  unreachable?: number;
  /** Matched players sharing a device with another matched player. */
  sharedDevices?: number;
  error?: string;
}

export async function previewAction(
  _prev: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  try {
    await requireWriteAccess();
    const parsed = composeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Check the form fields." };
    }
    const audience = buildAudience(parsed.data);
    if (!audience) return { error: "Select a valid audience." };
    return await previewAudience(audience);
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

  const parsed = composeSchema.safeParse(Object.fromEntries(formData));
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
        matched: result.matchedPlayers,
        unreachable: result.unreachablePlayers,
        // Codes only: the audit log records what happened, and the readable
        // explanations already live on the campaign record.
        failureCodes: result.failures.map((f) => `${f.code}×${f.count}`),
      },
    });
    revalidatePath("/console/trapman/messaging");
    return {
      ok: true,
      summary: {
        recipients: result.recipientCount,
        success: result.successCount,
        failure: result.failureCount,
        matched: result.matchedPlayers,
        unreachable: result.unreachablePlayers,
        failures: result.failures,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Send failed." };
  }
}
