import "server-only";
import { getDb } from "@/lib/firebase/firestore";
import { CRM } from "@/lib/firebase/collections";
import type { PasskeyRecord } from "@/types";

/**
 * Data access for admin passkeys (`_admin_passkeys`). Doc id = base64url
 * credentialId, which is exactly what the browser sends at login — one doc
 * read, no index. Mutations that act on someone's passkey take the owning
 * adminId and verify it, so a caller can never touch another admin's keys.
 */

function toRecord(id: string, data: FirebaseFirestore.DocumentData): PasskeyRecord {
  return {
    id,
    credentialId: data.credentialId ?? id,
    adminId: data.adminId,
    publicKey: data.publicKey,
    counter: data.counter ?? 0,
    transports: data.transports ?? [],
    deviceType: data.deviceType ?? "singleDevice",
    backedUp: !!data.backedUp,
    name: data.name ?? "Passkey",
    createdAt: data.createdAt ?? 0,
    lastUsedAt: data.lastUsedAt ?? null,
  };
}

export async function getPasskeyByCredentialId(
  credentialId: string,
): Promise<PasskeyRecord | null> {
  const doc = await getDb().collection(CRM.passkeys).doc(credentialId).get();
  if (!doc.exists) return null;
  return toRecord(doc.id, doc.data()!);
}

export async function listPasskeysForAdmin(
  adminId: string,
): Promise<PasskeyRecord[]> {
  const snap = await getDb()
    .collection(CRM.passkeys)
    .where("adminId", "==", adminId)
    .get();
  return snap.docs
    .map((d) => toRecord(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** `.create()` (not set) so a colliding credentialId fails loudly. */
export async function createPasskey(
  record: Omit<PasskeyRecord, "id">,
): Promise<void> {
  await getDb()
    .collection(CRM.passkeys)
    .doc(record.credentialId)
    .create(record);
}

export async function renamePasskey(
  adminId: string,
  credentialId: string,
  name: string,
): Promise<boolean> {
  const existing = await getPasskeyByCredentialId(credentialId);
  if (!existing || existing.adminId !== adminId) return false;
  await getDb().collection(CRM.passkeys).doc(credentialId).update({ name });
  return true;
}

export async function deletePasskey(
  adminId: string,
  credentialId: string,
): Promise<boolean> {
  const existing = await getPasskeyByCredentialId(credentialId);
  if (!existing || existing.adminId !== adminId) return false;
  await getDb().collection(CRM.passkeys).doc(credentialId).delete();
  return true;
}

export async function updatePasskeyAfterLogin(
  credentialId: string,
  counter: number,
): Promise<void> {
  await getDb()
    .collection(CRM.passkeys)
    .doc(credentialId)
    .update({ counter, lastUsedAt: Date.now() });
}
