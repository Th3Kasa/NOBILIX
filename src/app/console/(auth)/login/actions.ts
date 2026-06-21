"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import {
  getAdminByEmail,
  verifyPassword,
  isLocked,
  registerFailedAttempt,
  setTotpEnrollment,
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

export type LoginStep = "credentials" | "enroll" | "code";

export interface LoginState {
  step?: LoginStep;
  error?: string;
  /** Present only during first-time setup (step === "enroll"). */
  qrDataUrl?: string;
  manualKey?: string;
}

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * One server action drives the whole sign-in flow across three phases,
 * selected by the hidden `phase` field:
 *
 *   1. "credentials" — verify email + password. If the admin has 2FA already,
 *      advance to "code"; otherwise begin enrollment and advance to "enroll".
 *   2. "enroll"      — first-time setup: confirm a code from the QR, activate
 *      2FA, then sign in.
 *   3. "code"        — returning admin: verify the 6-digit code and sign in.
 *
 * On success `signIn` throws a redirect to /console (re-thrown so Next handles it).
 */
export async function loginAction(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const phase = String(formData.get("phase") ?? "credentials");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");

  // ── Phase 1: email + password ──────────────────────────────────────────
  if (phase === "credentials") {
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      return { step: "credentials", error: "Enter a valid email and password." };
    }

    try {
    const admin = await getAdminByEmail(email);
    if (!admin) {
      // Constant-ish timing to avoid trivial user enumeration.
      await new Promise((r) => setTimeout(r, 200));
      return { step: "credentials", error: "Invalid email or password." };
    }
    if (isLocked(admin)) {
      return {
        step: "credentials",
        error:
          "Account temporarily locked after too many attempts. Try again in 15 minutes.",
      };
    }
    if (!(await verifyPassword(admin, password))) {
      await registerFailedAttempt(admin);
      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "auth.login.bad_password",
      });
      return { step: "credentials", error: "Invalid email or password." };
    }

    // Password is correct. Returning admin with 2FA → ask for a code.
    if (admin.totpEnrolled && admin.totpSecretEnc) {
      return { step: "code" };
    }

    // First time → generate a pending secret and show the QR for setup.
    const secret = generateTotpSecret();
    await getDb()
      .collection(CRM.admins)
      .doc(admin.id)
      .update({ totpSecretEnc: encrypt(secret), totpEnrolled: false });

    const qrDataUrl = await buildQrDataUrl(buildOtpAuthUrl(admin.email, secret));
    return { step: "enroll", qrDataUrl, manualKey: secret };
    } catch (e) {
      // TEMP DEBUG: surface the real runtime error to diagnose the 500.
      return {
        step: "credentials",
        error: "DEBUG: " + (e instanceof Error ? e.message : String(e)),
      };
    }
  }

  // ── Phase 2: first-time enrollment — confirm a code, then activate 2FA ──
  if (phase === "enroll") {
    const admin = await getAdminByEmail(email);
    if (!admin || !(await verifyPassword(admin, password))) {
      return { step: "credentials", error: "Session expired — please start again." };
    }
    if (!admin.totpSecretEnc) {
      return { step: "credentials", error: "Setup expired — please start again." };
    }
    const secret = decrypt(admin.totpSecretEnc);
    if (!verifyTotp(code, secret)) {
      return {
        step: "enroll",
        qrDataUrl: prev.qrDataUrl,
        manualKey: prev.manualKey,
        error: "That code is incorrect. Check your authenticator app and try again.",
      };
    }
    await setTotpEnrollment(admin.id, admin.totpSecretEnc);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "auth.totp.enrolled",
    });
    // Fall through to sign in with the code they just confirmed.
  }

  // ── Sign in (returning "code" phase, or right after enrollment) ─────────
  try {
    await signIn("credentials", {
      email,
      password,
      totp: code,
      redirectTo: "/console",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        step: phase === "enroll" ? "enroll" : "code",
        qrDataUrl: prev.qrDataUrl,
        manualKey: prev.manualKey,
        error: "That code is incorrect. Try again.",
      };
    }
    throw error; // success path: re-throw the redirect
  }
}
