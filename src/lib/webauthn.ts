import "server-only";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * WebAuthn relying-party configuration and challenge transport.
 *
 * Challenges are carried in a short-lived HttpOnly cookie encrypted with the
 * same AES-256-GCM util that protects TOTP seeds — stateless across
 * serverless instances, tamper-proof, and pinned to the browser that started
 * the ceremony. The payload is kind-tagged so a registration challenge can
 * never finish an authentication ceremony (or vice versa).
 */

export interface WebAuthnConfig {
  rpID: string;
  rpName: string;
  origin: string;
}

const RP_NAME = "NOBILIX Console";

/**
 * Resolves the relying-party config. Fails closed in production: without
 * explicit WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN the feature is disabled rather
 * than half-working against the wrong origin.
 *
 * Reads process.env directly (NOT the validating env proxy): the login page
 * is statically prerendered, and touching the proxy there would force
 * full-schema validation during builds that legitimately have no secrets.
 */
export function getWebAuthnConfig(): WebAuthnConfig | null {
  const rpID = process.env.WEBAUTHN_RP_ID?.trim();
  const origin = process.env.WEBAUTHN_ORIGIN?.trim();
  const validOrigin =
    !!origin &&
    (origin.startsWith("https://") || origin.startsWith("http://localhost"));
  if (rpID && validOrigin) return { rpID, rpName: RP_NAME, origin };
  if (process.env.NODE_ENV !== "production") {
    return {
      rpID: "localhost",
      rpName: RP_NAME,
      origin: "http://localhost:3000",
    };
  }
  return null;
}

const CHALLENGE_COOKIE = "console.webauthn";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export type ChallengeKind = "reg" | "auth";

interface ChallengePayload {
  k: ChallengeKind;
  c: string;
  /** Registration only: the admin the ceremony was started for. */
  a?: string;
  exp: number;
}

/** Store a ceremony challenge (call from a Server Function only). */
export async function setChallengeCookie(
  kind: ChallengeKind,
  challenge: string,
  adminId?: string,
): Promise<void> {
  const payload: ChallengePayload = {
    k: kind,
    c: challenge,
    ...(adminId ? { a: adminId } : {}),
    exp: Date.now() + CHALLENGE_TTL_MS,
  };
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, encrypt(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

/**
 * Read-and-delete the pending challenge. Returns null when missing, expired,
 * tampered with, or of the wrong kind — one generic failure path for all.
 */
export async function consumeChallengeCookie(
  kind: ChallengeKind,
): Promise<{ challenge: string; adminId?: string } | null> {
  const store = await cookies();
  const raw = store.get(CHALLENGE_COOKIE)?.value;
  store.delete(CHALLENGE_COOKIE);
  if (!raw) return null;
  try {
    const payload = JSON.parse(decrypt(raw)) as ChallengePayload;
    if (payload.k !== kind) return null;
    if (!payload.c || payload.exp < Date.now()) return null;
    return { challenge: payload.c, adminId: payload.a };
  } catch {
    return null; // tampered or stale ciphertext
  }
}
