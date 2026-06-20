/**
 * One-shot script that creates all 3 NOBILIX admin accounts.
 *
 * Usage (after adding real Firebase credentials to .env.local):
 *   node --env-file=.env.local scripts/create-admins.mjs
 *
 * PASSWORDS — two ways:
 *   1. Pick your own: add the matching line(s) to .env.local (gitignored, so the
 *      plaintext never gets committed). Each must be at least 8 characters:
 *        ADMIN_PW_BASEM=YourChosenPassword
 *        ADMIN_PW_ABANOUB=YourChosenPassword
 *        ADMIN_PW_RANDY=YourChosenPassword
 *   2. Leave a line out and the script generates a strong random password for
 *      that admin and prints it once.
 *
 * After running, each admin signs in at /console with their email + password and
 * is walked through authenticator (2FA) setup automatically on first login.
 */

import { randomBytes } from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

const MIN_PASSWORD_LENGTH = 8;

function resolveServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64",
    ).toString("utf8");
    const p = JSON.parse(json);
    return { projectId: p.project_id, clientEmail: p.client_email, privateKey: p.private_key };
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

// `pwEnv` names the .env.local variable that, if set, becomes this admin's
// chosen password. If unset, a strong random one is generated.
const ADMINS = [
  { email: "contact.basemmorkos@gmail.com", name: "Basem Morkos", role: "admin", pwEnv: "ADMIN_PW_BASEM" },
  { email: "abanoubsamy.93@gmail.com",      name: "Abanoub Samy", role: "admin", pwEnv: "ADMIN_PW_ABANOUB" },
  { email: "mrjointadventure@gmail.com",    name: "Randy Glazer", role: "admin", pwEnv: "ADMIN_PW_RANDY" },
];

// Validate any custom passwords up front so we fail before writing anything.
for (const admin of ADMINS) {
  const custom = process.env[admin.pwEnv];
  if (custom !== undefined && custom.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `\n❌  ${admin.pwEnv} is too short (${custom.length} chars). ` +
        `Use at least ${MIN_PASSWORD_LENGTH} characters, or remove the line to auto-generate.\n`,
    );
    process.exit(1);
  }
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(resolveServiceAccount()) });
const db = getFirestore(app);

console.log("\n🚀  Seeding NOBILIX Admin Console accounts…\n");

const results = [];

for (const admin of ADMINS) {
  const custom = process.env[admin.pwEnv];
  const chosen = custom !== undefined;
  const password = chosen ? custom : randomBytes(14).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db
    .collection("_admin")
    .where("email", "==", admin.email)
    .limit(1)
    .get();

  const payload = {
    email: admin.email,
    name: admin.name,
    role: admin.role,
    passwordHash,
    totpSecretEnc: null,
    totpEnrolled: false,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: Date.now(),
  };

  if (existing.empty) {
    const ref = await db.collection("_admin").add(payload);
    results.push({ ...admin, password, chosen, id: ref.id, action: "created" });
  } else {
    const doc = existing.docs[0];
    await doc.ref.update({
      name: admin.name,
      role: admin.role,
      passwordHash,
      totpSecretEnc: null,
      totpEnrolled: false,
      failedAttempts: 0,
      lockedUntil: null,
    });
    results.push({ ...admin, password, chosen, id: doc.id, action: "reset" });
  }
}

const anyGenerated = results.some((r) => !r.chosen);

console.log("┌──────────────────────────────────────────────────────────────────────┐");
console.log("│                       Admin accounts are ready                         │");
console.log("├──────────────────────────────────────────────────────────────────────┤");
for (const r of results) {
  const flag = r.action === "created" ? "✅ Created" : "♻️  Reset  ";
  console.log(`│ ${flag}  ${r.role.padEnd(6)}  ${r.email.padEnd(40)} │`);
  if (r.chosen) {
    console.log(`│            Password: (the one you set in ${r.pwEnv.padEnd(28)}) │`);
  } else {
    console.log(`│            Password: ${r.password.padEnd(48)} │`);
  }
  console.log("├──────────────────────────────────────────────────────────────────────┤");
}
console.log("│  Next: each admin signs in at /console and sets up their authenticator. │");
console.log("└──────────────────────────────────────────────────────────────────────┘");
if (anyGenerated) {
  console.log("\n⚠️   Generated passwords are shown only once — copy them now.");
}
console.log("");

process.exit(0);
