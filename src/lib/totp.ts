import "server-only";
import { authenticator } from "otplib";
import QRCode from "qrcode";

/**
 * TOTP (RFC 6238) helpers for admin 2FA, backed by otplib.
 * A 1-step window tolerates minor clock drift between the device and server.
 */

authenticator.options = { window: 1 };

const ISSUER = "NOBILIX Admin";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
}

export function verifyTotp(token: string, secret: string): boolean {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    return authenticator.verify({ token: clean, secret });
  } catch {
    return false;
  }
}
