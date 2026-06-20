import { z } from "zod";

/**
 * Server-only environment configuration, validated at startup.
 *
 * The Firebase service-account credentials are provided ONE of two ways:
 *   1. FIREBASE_SERVICE_ACCOUNT_B64 — base64 of the full service-account JSON (preferred on Vercel)
 *   2. The three discrete fields: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 *
 * Never import this file from client components.
 */
const schema = z.object({
  // --- Firebase Admin credentials ---
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // --- Auth ---
  // Auth.js v5 reads AUTH_SECRET. Generate with: openssl rand -base64 32
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),

  // --- Encryption for TOTP secrets at rest (32-byte key, base64 or hex) ---
  CRM_ENCRYPTION_KEY: z
    .string()
    .min(32, "CRM_ENCRYPTION_KEY must be at least 32 chars"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  const hasB64 = !!env.FIREBASE_SERVICE_ACCOUNT_B64;
  const hasFields =
    !!env.FIREBASE_PROJECT_ID &&
    !!env.FIREBASE_CLIENT_EMAIL &&
    !!env.FIREBASE_PRIVATE_KEY;

  if (!hasB64 && !hasFields) {
    throw new Error(
      "Missing Firebase credentials. Provide FIREBASE_SERVICE_ACCOUNT_B64, " +
        "or all of FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.",
    );
  }

  return env;
}

export const env = loadEnv();
export type Env = z.infer<typeof schema>;
