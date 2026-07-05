"use server";

import { revalidatePath } from "next/cache";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type {
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createPasskey,
  deletePasskey,
  listPasskeysForAdmin,
  renamePasskey,
} from "@/lib/passkeys";
import {
  consumeChallengeCookie,
  getWebAuthnConfig,
  setChallengeCookie,
} from "@/lib/webauthn";

const GENERIC_ERROR = "Something went wrong. Try again.";
const SETTINGS_PATH = "/console/trapman/settings";

export type StartRegistrationResult =
  | { ok: true; options: PublicKeyCredentialCreationOptionsJSON }
  | { ok: false; error: string };

export type PasskeyActionResult = { ok: true } | { ok: false; error: string };

export async function startPasskeyRegistration(): Promise<StartRegistrationResult> {
  const admin = await requireAdmin();

  const limit = await checkRateLimit(`passkey-reg:${admin.id}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return { ok: false, error: "Too many attempts — wait a few minutes." };
  }

  const config = getWebAuthnConfig();
  if (!config) {
    return {
      ok: false,
      error: "Passkeys aren't set up for this deployment yet.",
    };
  }

  const existing = await listPasskeysForAdmin(admin.id);
  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: admin.id,
    userName: admin.email,
    userDisplayName: admin.name,
    attestationType: "none",
    excludeCredentials: existing.map((pk) => ({
      id: isoBase64URL.toBuffer(pk.credentialId),
      type: "public-key",
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      // Discoverable + verified: the passkey alone carries possession AND
      // user presence (biometric/PIN), which is why it can stand in for
      // password + TOTP.
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
  });

  await setChallengeCookie("reg", options.challenge, admin.id);
  return { ok: true, options };
}

export async function finishPasskeyRegistration(
  response: RegistrationResponseJSON,
  label?: string,
): Promise<PasskeyActionResult> {
  const admin = await requireAdmin();

  const pending = await consumeChallengeCookie("reg");
  // The challenge must exist, be fresh, and belong to this exact admin.
  if (!pending || pending.adminId !== admin.id) {
    return { ok: false, error: "That took too long — try again." };
  }

  const config = getWebAuthnConfig();
  if (!config) return { ok: false, error: GENERIC_ERROR };

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error("[passkeys] registration verify failed:", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const info = verification.registrationInfo;
  const credentialId = isoBase64URL.fromBuffer(info.credentialID);
  const name =
    label?.trim().slice(0, 60) ||
    `Passkey added ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;

  try {
    await createPasskey({
      credentialId,
      adminId: admin.id,
      publicKey: isoBase64URL.fromBuffer(info.credentialPublicKey),
      counter: info.counter,
      transports: response.response.transports ?? [],
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      name,
      createdAt: Date.now(),
      lastUsedAt: null,
    });
  } catch (err) {
    // .create() throws if this credential id already exists anywhere.
    console.error("[passkeys] store failed:", err);
    return { ok: false, error: "That passkey is already registered." };
  }

  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.passkey.registered",
    target: credentialId.slice(0, 12),
    metadata: { name },
  });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

const renameSchema = z.object({
  credentialId: z.string().min(1).max(1200),
  name: z.string().min(1).max(60),
});

export async function renamePasskeyAction(
  input: unknown,
): Promise<PasskeyActionResult> {
  const admin = await requireAdmin();
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const renamed = await renamePasskey(
    admin.id,
    parsed.data.credentialId,
    parsed.data.name.trim(),
  );
  if (!renamed) return { ok: false, error: GENERIC_ERROR };

  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.passkey.renamed",
    target: parsed.data.credentialId.slice(0, 12),
    metadata: { name: parsed.data.name.trim() },
  });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

const removeSchema = z.object({
  credentialId: z.string().min(1).max(1200),
});

export async function removePasskeyAction(
  input: unknown,
): Promise<PasskeyActionResult> {
  const admin = await requireAdmin();
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  // Always allowed, even for the last passkey — password + TOTP remains the
  // permanent recovery path.
  const removed = await deletePasskey(admin.id, parsed.data.credentialId);
  if (!removed) return { ok: false, error: GENERIC_ERROR };

  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "auth.passkey.removed",
    target: parsed.data.credentialId.slice(0, 12),
  });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}
