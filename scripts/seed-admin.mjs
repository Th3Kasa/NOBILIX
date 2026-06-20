// Seed / update an admin account for the NOBILIX Admin Console.
//
// Usage (Node 24+, loads env natively):
//   node --env-file=.env.local scripts/seed-admin.mjs --email you@nobilix.com --name "Your Name" --role owner
//   node --env-file=.env.local scripts/seed-admin.mjs --email you@nobilix.com --name "Your Name" --role admin --password "S3cret!"
//
// Roles: owner | admin | viewer
// If --password is omitted, a strong one is generated and printed ONCE.
// The admin then completes 2FA setup at /enroll on first sign-in.

import { randomBytes } from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const email = arg("email")?.toLowerCase().trim();
const name = arg("name");
const role = arg("role") ?? "admin";
let password = arg("password");

if (!email || !name) {
  console.error("Missing --email or --name. See header of this file for usage.");
  process.exit(1);
}
if (!["owner", "admin", "viewer"].includes(role)) {
  console.error(`Invalid --role "${role}". Use owner | admin | viewer.`);
  process.exit(1);
}

function resolveServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64",
    ).toString("utf8");
    const p = JSON.parse(json);
    return {
      projectId: p.project_id,
      clientEmail: p.client_email,
      privateKey: p.private_key,
    };
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(resolveServiceAccount()) });
const db = getFirestore(app);

if (!password) {
  // 18 url-safe chars
  password = randomBytes(14).toString("base64url");
}

const passwordHash = await bcrypt.hash(password, 12);

const existing = await db
  .collection("_admin")
  .where("email", "==", email)
  .limit(1)
  .get();

const payload = {
  email,
  name,
  role,
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
  console.log(`\n✅ Created admin ${email} (${role}) — id ${ref.id}`);
} else {
  const doc = existing.docs[0];
  // Reset password + role + clear 2FA so they re-enroll.
  await doc.ref.update({
    name,
    role,
    passwordHash,
    totpSecretEnc: null,
    totpEnrolled: false,
    failedAttempts: 0,
    lockedUntil: null,
  });
  console.log(`\n♻️  Updated existing admin ${email} (${role}) — id ${doc.id}`);
}

if (!arg("password")) {
  console.log(`\n   Temporary password (store securely, shown once):`);
  console.log(`   ${password}\n`);
}
console.log("   Next: sign in at /enroll to set up the authenticator app.\n");
process.exit(0);
