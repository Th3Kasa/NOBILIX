/**
 * One-shot script that creates all 3 NOBILIX admin accounts.
 *
 * Usage (after adding real Firebase credentials to .env.local):
 *   node --env-file=.env.local scripts/create-admins.mjs
 *
 * Each admin receives a temporary password printed once below.
 * After running, each admin visits /enroll to set up their authenticator app,
 * then signs in at /login with email + password + 6-digit TOTP code.
 */

import { randomBytes } from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

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

const ADMINS = [
  { email: "contact.basemmorkos@gmail.com", name: "Basem Morkos", role: "admin" },
  { email: "abanoubsamy.93@gmail.com",      name: "Abanoub Samy", role: "admin" },
  { email: "mrjointadventure@gmail.com",    name: "Randy Glazer", role: "admin" },
];

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(resolveServiceAccount()) });
const db = getFirestore(app);

console.log("\n🚀  Seeding NOBILIX Admin Console accounts…\n");

const results = [];

for (const admin of ADMINS) {
  const password = randomBytes(14).toString("base64url");
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
    results.push({ ...admin, password, id: ref.id, action: "created" });
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
    results.push({ ...admin, password, id: doc.id, action: "reset" });
  }
}

console.log("┌─────────────────────────────────────────────────────────────────┐");
console.log("│          Admin accounts ready — save these passwords now        │");
console.log("├─────────────────────────────────────────────────────────────────┤");
for (const r of results) {
  const flag = r.action === "created" ? "✅ Created" : "♻️  Reset  ";
  console.log(`│ ${flag}  ${r.role.padEnd(6)}  ${r.email.padEnd(35)} │`);
  console.log(`│            Password: ${r.password.padEnd(44)} │`);
  console.log("├─────────────────────────────────────────────────────────────────┤");
}
console.log("│  Next: visit /enroll on the admin console to set up 2FA.       │");
console.log("└─────────────────────────────────────────────────────────────────┘\n");

process.exit(0);
