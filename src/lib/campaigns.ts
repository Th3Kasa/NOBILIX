import "server-only";
import { getDb } from "@/lib/firebase/admin";
import { CRM } from "@/lib/firebase/collections";
import { resolveAudienceTokens, sendToTokens } from "@/lib/fcm";
import type { CampaignAudience, CampaignRecord } from "@/types";

/**
 * Send a push campaign and persist a record of the outcome.
 * Returns the created campaign id and the delivery counts.
 */
export async function sendCampaign(input: {
  title: string;
  body: string;
  data?: Record<string, string> | null;
  audience: CampaignAudience;
  createdBy: string;
}): Promise<{ id: string; recipientCount: number; successCount: number; failureCount: number }> {
  const db = getDb();
  const tokens = await resolveAudienceTokens(input.audience);

  const ref = await db.collection(CRM.campaigns).add({
    title: input.title,
    body: input.body,
    data: input.data ?? null,
    audience: input.audience,
    status: "sending",
    recipientCount: tokens.length,
    successCount: 0,
    failureCount: 0,
    createdBy: input.createdBy,
    createdAt: Date.now(),
    sentAt: null,
  });

  if (tokens.length === 0) {
    await ref.update({ status: "sent", sentAt: Date.now() });
    return { id: ref.id, recipientCount: 0, successCount: 0, failureCount: 0 };
  }

  try {
    const result = await sendToTokens(
      tokens,
      { title: input.title, body: input.body },
      input.data ?? undefined,
    );
    await ref.update({
      status: "sent",
      successCount: result.successCount,
      failureCount: result.failureCount,
      sentAt: Date.now(),
    });
    return {
      id: ref.id,
      recipientCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  } catch (err) {
    await ref.update({ status: "failed", sentAt: Date.now() });
    throw err;
  }
}

/** Count recipients for an audience without sending (preview). */
export async function previewAudience(
  audience: CampaignAudience,
): Promise<number> {
  const tokens = await resolveAudienceTokens(audience);
  return tokens.length;
}

export async function getRecentCampaigns(limit = 25): Promise<CampaignRecord[]> {
  try {
    const snap = await getDb()
      .collection(CRM.campaigns)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        body: data.body,
        data: data.data ?? null,
        audience: data.audience,
        status: data.status,
        recipientCount: data.recipientCount ?? 0,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt ?? 0,
        sentAt: data.sentAt ?? null,
      };
    });
  } catch (err) {
    console.error("[campaigns] failed to read", err);
    return [];
  }
}
