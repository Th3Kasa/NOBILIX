import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import { resolveAudience, sendToTokens, type FailureGroup } from "@/lib/fcm";
import type { CampaignAudience, CampaignRecord } from "@/types";

export interface SendCampaignResult {
  id: string;
  /** Devices the message was actually sent to. */
  recipientCount: number;
  successCount: number;
  failureCount: number;
  /** Players who matched the audience, reachable or not. */
  matchedPlayers: number;
  /** Matched players with no device token — nothing was sent to them. */
  unreachablePlayers: number;
  /** Why deliveries failed, grouped by cause. */
  failures: FailureGroup[];
}

/**
 * Send a push campaign and persist a record of the outcome.
 *
 * The record keeps the audience arithmetic (matched vs reachable) and the
 * grouped failure reasons, not just the counts — a campaign that reached
 * nobody and a campaign that failed for everybody are very different problems,
 * and the difference is invisible from `successCount: 0` alone.
 */
export async function sendCampaign(input: {
  title: string;
  body: string;
  data?: Record<string, string> | null;
  audience: CampaignAudience;
  createdBy: string;
}): Promise<SendCampaignResult> {
  const db = getDb();
  const resolved = await resolveAudience(input.audience);
  const tokens = resolved.tokens;

  const ref = await db.collection(CRM.campaigns).add({
    title: input.title,
    body: input.body,
    data: input.data ?? null,
    audience: input.audience,
    status: "sending",
    recipientCount: tokens.length,
    matchedPlayers: resolved.matched,
    unreachablePlayers: resolved.unreachable,
    successCount: 0,
    failureCount: 0,
    failures: [],
    createdBy: input.createdBy,
    createdAt: Date.now(),
    sentAt: null,
  });

  const base = {
    id: ref.id,
    matchedPlayers: resolved.matched,
    unreachablePlayers: resolved.unreachable,
  };

  if (tokens.length === 0) {
    await ref.update({ status: "sent", sentAt: Date.now() });
    return {
      ...base,
      recipientCount: 0,
      successCount: 0,
      failureCount: 0,
      failures: [],
    };
  }

  try {
    const result = await sendToTokens(
      tokens,
      { title: input.title, body: input.body },
      input.data ?? undefined,
    );
    await ref.update({
      // A send where every delivery failed is a failed campaign, not a sent
      // one — labelling it "sent" is how a broken APNs key goes unnoticed.
      status: result.successCount === 0 ? "failed" : "sent",
      successCount: result.successCount,
      failureCount: result.failureCount,
      failures: result.failures,
      sentAt: Date.now(),
    });
    return {
      ...base,
      recipientCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      failures: result.failures,
    };
  } catch (err) {
    await ref.update({ status: "failed", sentAt: Date.now() });
    throw err;
  }
}

/** Count recipients for an audience without sending (preview). */
export async function previewAudience(audience: CampaignAudience) {
  const resolved = await resolveAudience(audience);
  return {
    count: resolved.tokens.length,
    matched: resolved.matched,
    unreachable: resolved.unreachable,
    sharedDevices: resolved.sharedDevices,
  };
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
        // Absent on campaigns sent before these were recorded — null rather
        // than 0, so the UI can omit the line instead of claiming "0 matched".
        matchedPlayers: data.matchedPlayers ?? null,
        unreachablePlayers: data.unreachablePlayers ?? null,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        failures: Array.isArray(data.failures) ? data.failures : [],
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
