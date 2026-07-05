"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type {
  AuthenticatorTransportFuture,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { signIn } from "@/auth";
import {
  getAdminById,
  isLocked,
  registerFailedAttempt,
  registerSuccessfulLogin,
} from "@/lib/admins";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { mintLoginTicket } from "@/lib/login-tickets";
import {
  getPasskeyByCredentialId,
  updatePasskeyAfterLogin,
} from "@/lib/passkeys";
import {
  consumeChallengeCookie,
  getWebAuthnConfig,
  setChallengeCookie,
} from "@/lib/webauthn";

/**
 * Usernameless passkey sign-in. No email is ever taken, so there is nothing
 * to enumerate; the browser's own account picker decides which credential to
 * present. Failures share one generic message and feed the same
 * failed-attempt lockout as bad passwords.
 */

const GENERIC_ERROR = "That passkey isn't recognised here.";
const EXPIRED_ERROR = "That took too long — try again.";
const LOCKED_ERROR =
  "Account temporarily locked after too many attempts. Try again in 15 minutes.";

export type StartPasskeyLoginResult =
  | { ok: true; options: PublicKeyCredentialRequestOptionsJSON }
  | { ok: false; error: string };

export type FinishPasskeyLoginResult = { ok: false; error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function startPasskeyLogin(): Promise<StartPasskeyLoginResult> {
  const ip = await clientIp();
  const limit = await checkRateLimit(`passkey-login:${ip}`, 10, 5 * 60_000);
  if (!limit.allowed) {
    return { ok: false, error: "Too many attempts — wait a few minutes." };
  }

  const config = getWebAuthnConfig();
  if (!config) {
    return { ok: false, error: "Passkey sign-in isn't available right now." };
  }

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: "required",
    allowCredentials: [],
  });

  await setChallengeCookie("auth", options.challenge);
  return { ok: true, options };
}

/** On success this never returns — signIn throws the redirect to /console. */
export async function finishPasskeyLogin(
  response: AuthenticationResponseJSON,
): Promise<FinishPasskeyLoginResult> {
  const ip = await clientIp();
  const limit = await checkRateLimit(`passkey-login:${ip}`, 10, 5 * 60_000);
  if (!limit.allowed) {
    return { ok: false, error: "Too many attempts — wait a few minutes." };
  }

  const pending = await consumeChallengeCookie("auth");
  if (!pending) return { ok: false, error: EXPIRED_ERROR };

  const config = getWebAuthnConfig();
  if (!config) return { ok: false, error: GENERIC_ERROR };

  // The assertion's credential id IS our doc id.
  const passkey = await getPasskeyByCredentialId(response.id);
  if (!passkey) {
    // Mirror the password flow's constant-ish timing for unknown credentials.
    await new Promise((r) => setTimeout(r, 200));
    return { ok: false, error: GENERIC_ERROR };
  }

  const admin = await getAdminById(passkey.adminId);
  if (!admin) return { ok: false, error: GENERIC_ERROR };

  if (isLocked(admin)) {
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "auth.passkey.login.locked",
    });
    return { ok: false, error: LOCKED_ERROR };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(passkey.credentialId),
        credentialPublicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    });
  } catch (err) {
    const counterRegression =
      err instanceof Error && /counter/i.test(err.message);
    await registerFailedAttempt(admin);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: counterRegression
        ? "auth.passkey.counter_regression"
        : "auth.passkey.login.failed",
      target: passkey.credentialId.slice(0, 12),
    });
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!verification.verified) {
    await registerFailedAttempt(admin);
    await recordAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "auth.passkey.login.failed",
      target: passkey.credentialId.slice(0, 12),
    });
    return { ok: false, error: GENERIC_ERROR };
  }

  await updatePasskeyAfterLogin(
    passkey.credentialId,
    verification.authenticationInfo.newCounter,
  );
  await registerSuccessfulLogin(admin.id);
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.passkey.login.success",
    target: passkey.credentialId.slice(0, 12),
    metadata: { name: passkey.name },
  });

  // Bridge to a normal session. The single-use ticket stays server-side.
  const ticket = await mintLoginTicket(admin.id);
  try {
    await signIn("passkey", { ticket, redirectTo: "/console" });
    return { ok: false, error: GENERIC_ERROR }; // unreachable — signIn redirects
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: GENERIC_ERROR };
    }
    throw error; // success path: re-throw the redirect
  }
}
