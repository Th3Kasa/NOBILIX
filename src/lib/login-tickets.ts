import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";

/**
 * Single-use login tickets bridge a verified passkey assertion to a NextAuth
 * session. The ticket itself never leaves the server: `finishPasskeyLogin`
 * mints it and immediately spends it via signIn("passkey", ...).
 *
 * Only the SHA-256 of the ticket is stored (as the doc id), so a database
 * leak exposes nothing replayable, and lookup needs no timing-sensitive
 * comparison. Consumption runs in a transaction — the NextAuth callback
 * route is HTTP-reachable, so atomic single-use is load-bearing.
 */

const TICKET_TTL_MS = 60_000;

function ticketHash(ticket: string): string {
  return createHash("sha256").update(ticket).digest("hex");
}

export async function mintLoginTicket(adminId: string): Promise<string> {
  const ticket = randomBytes(32).toString("base64url");
  const now = Date.now();
  await getDb()
    .collection(CRM.loginTickets)
    .doc(ticketHash(ticket))
    .set({
      adminId,
      createdAt: now,
      expiresAtMs: now + TICKET_TTL_MS,
      // Date form so a Firestore TTL policy can sweep stale docs.
      expiresAt: new Date(now + TICKET_TTL_MS),
    });
  return ticket;
}

/** Returns the adminId and deletes the ticket, or null (missing/expired/reused). */
export async function consumeLoginTicket(
  ticket: string,
): Promise<string | null> {
  try {
    const db = getDb();
    const ref = db.collection(CRM.loginTickets).doc(ticketHash(ticket));
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      tx.delete(ref);
      const data = snap.data()!;
      if ((data.expiresAtMs ?? 0) < Date.now()) return null;
      return (data.adminId as string) || null;
    });
  } catch (err) {
    console.error("[login-tickets] consume failed:", err);
    return null;
  }
}
