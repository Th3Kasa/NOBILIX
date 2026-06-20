"use server";

import { z } from "zod";
import {
  getAdminByEmail,
  setTotpEnrollment,
  verifyPassword,
} from "@/lib/admins";
import { getDb } from "@/lib/firebase/admin";
import { CRM } from "@/lib/firebase/collections";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  buildOtpAuthUrl,
  buildQrDataUrl,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/totp";
import { recordAudit } from "@/lib/audit";

const beginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface BeginState {
  error?: string;
  qrDataUrl?: string;
  manualKey?: string;
}

/** Step 1 — verify password, generate a (not-yet-confirmed) TOTP secret, return the QR. */
export async function beginEnrollment(
  _prev: BeginState,
  formData: FormData,
): Promise<BeginState> {
  const parsed = beginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const admin = await getAdminByEmail(parsed.data.email);
  if (!admin || !(await verifyPassword(admin, parsed.data.password))) {
    return { error: "Invalid email or password." };
  }
  if (admin.totpEnrolled) {
    return {
      error:
        "Two-factor is already configured for this account. Ask an owner to reset it if you lost your device.",
    };
  }

  const secret = generateTotpSecret();
  // Store encrypted but keep totpEnrolled=false until a code is confirmed.
  await getDb()
    .collection(CRM.admins)
    .doc(admin.id)
    .update({ totpSecretEnc: encrypt(secret), totpEnrolled: false });

  const otpauth = buildOtpAuthUrl(admin.email, secret);
  const qrDataUrl = await buildQrDataUrl(otpauth);
  return { qrDataUrl, manualKey: secret };
}

const confirmSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string().min(6).max(8),
});

export interface ConfirmState {
  error?: string;
  success?: boolean;
}

/** Step 2 — confirm the admin can produce a valid code, then activate 2FA. */
export async function confirmEnrollment(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const parsed = confirmSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Enter the 6-digit code." };

  const admin = await getAdminByEmail(parsed.data.email);
  if (!admin || !(await verifyPassword(admin, parsed.data.password))) {
    return { error: "Invalid email or password." };
  }
  if (admin.totpEnrolled) {
    return { error: "Two-factor is already configured." };
  }
  if (!admin.totpSecretEnc) {
    return { error: "Start the setup again — no pending secret found." };
  }

  const secret = decrypt(admin.totpSecretEnc);
  if (!verifyTotp(parsed.data.code, secret)) {
    return { error: "That code is incorrect. Check your authenticator app." };
  }

  await setTotpEnrollment(admin.id, admin.totpSecretEnc);
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.totp.enrolled",
  });
  return { success: true };
}
