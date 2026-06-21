import "server-only";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/firebase/admin";
import { CRM } from "@/lib/firebase/collections";
import type { AdminRecord } from "@/types";

/**
 * Data-access for the 3 admin accounts. Admins live in the `_admin` collection,
 * fully isolated from game users — a player can never become an admin.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function toRecord(id: string, data: FirebaseFirestore.DocumentData): AdminRecord {
  return {
    id,
    email: data.email,
    name: data.name,
    role: data.role,
    passwordHash: data.passwordHash,
    totpSecretEnc: data.totpSecretEnc ?? null,
    totpEnrolled: !!data.totpEnrolled,
    failedAttempts: data.failedAttempts ?? 0,
    lockedUntil: data.lockedUntil ?? null,
    lastLoginAt: data.lastLoginAt ?? null,
    createdAt: data.createdAt ?? 0,
  };
}

export async function getAdminByEmail(
  email: string,
): Promise<AdminRecord | null> {
  const snap = await getDb()
    .collection(CRM.admins)
    .where("email", "==", email.toLowerCase().trim())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return toRecord(doc.id, doc.data());
}

export async function getAdminById(id: string): Promise<AdminRecord | null> {
  const doc = await getDb().collection(CRM.admins).doc(id).get();
  if (!doc.exists) return null;
  return toRecord(doc.id, doc.data()!);
}

export async function verifyPassword(
  admin: AdminRecord,
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, admin.passwordHash);
}

export function isLocked(admin: AdminRecord): boolean {
  return !!admin.lockedUntil && admin.lockedUntil > Date.now();
}

export async function registerFailedAttempt(admin: AdminRecord): Promise<void> {
  const attempts = (admin.failedAttempts ?? 0) + 1;
  const update: Partial<AdminRecord> = { failedAttempts: attempts };
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    update.lockedUntil = Date.now() + LOCK_DURATION_MS;
    update.failedAttempts = 0;
  }
  await getDb().collection(CRM.admins).doc(admin.id).update(update);
}

export async function registerSuccessfulLogin(adminId: string): Promise<void> {
  await getDb().collection(CRM.admins).doc(adminId).update({
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: Date.now(),
  });
}

export async function setTotpEnrollment(
  adminId: string,
  totpSecretEnc: string,
): Promise<void> {
  await getDb().collection(CRM.admins).doc(adminId).update({
    totpSecretEnc,
    totpEnrolled: true,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Replace an admin's password (used by the self-service change-password flow). */
export async function updatePassword(
  adminId: string,
  newPassword: string,
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await getDb().collection(CRM.admins).doc(adminId).update({ passwordHash });
}
