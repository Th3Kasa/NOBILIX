import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import type { AuditEntry } from "@/types";

/**
 * Append-only audit log. Every privileged action (login, edits, deletions, push
 * campaigns) records who did what, when, and to which resource.
 */
export async function recordAudit(entry: {
  actorId: string;
  actorEmail: string;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await getDb().collection(CRM.audit).add({
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      target: entry.target ?? null,
      metadata: entry.metadata ?? null,
      at: Date.now(),
    });
  } catch (err) {
    // Never let audit failure break the primary action, but make it visible.
    console.error("[audit] failed to record entry", entry.action, err);
  }
}

/** Most recent audit entries, newest first. Returns [] if the DB is unreachable. */
export async function getRecentAudit(limit = 100): Promise<AuditEntry[]> {
  try {
    const snap = await getDb()
      .collection(CRM.audit)
      .orderBy("at", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        actorId: data.actorId,
        actorEmail: data.actorEmail,
        action: data.action,
        target: data.target ?? null,
        metadata: data.metadata ?? null,
        at: data.at ?? 0,
      };
    });
  } catch (err) {
    console.error("[audit] failed to read entries", err);
    return [];
  }
}
