import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { env } from "@/lib/env";

/**
 * AES-256-GCM encryption for secrets at rest (TOTP seeds).
 *
 * The key is derived from CRM_ENCRYPTION_KEY via SHA-256 so any sufficiently long
 * passphrase produces a valid 32-byte key. Output format: base64(iv).base64(tag).base64(ciphertext)
 */

let _key: Buffer | undefined;
function key(): Buffer {
  if (!_key) {
    _key = createHash("sha256").update(env.CRM_ENCRYPTION_KEY).digest();
  }
  return _key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed ciphertext");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
