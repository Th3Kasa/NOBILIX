import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

test("login loads Firestore without loading Firebase Auth", () => {
  const firestorePath = resolve(root, "src/lib/firebase/firestore.ts");
  const authPath = resolve(root, "src/lib/firebase/auth.ts");

  assert.equal(
    existsSync(firestorePath),
    true,
    "Firestore must live in a service-specific module",
  );
  assert.equal(
    existsSync(authPath),
    true,
    "Firebase Auth must live in a service-specific module",
  );

  const firestoreSource = read("src/lib/firebase/firestore.ts");
  const authSource = read("src/lib/firebase/auth.ts");
  const loginSource = read("src/app/console/(auth)/login/actions.ts");

  assert.doesNotMatch(firestoreSource, /firebase-admin\/auth/);
  assert.doesNotMatch(firestoreSource, /firebase-admin\/messaging/);
  assert.match(authSource, /firebase-admin\/auth/);
  assert.match(loginSource, /@\/lib\/firebase\/firestore/);
  assert.doesNotMatch(loginSource, /@\/lib\/firebase\/admin/);
});

test("jwks-rsa uses a CommonJS-compatible jose release", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(packageJson.overrides?.["jwks-rsa"]?.jose, "4.15.9");
});
