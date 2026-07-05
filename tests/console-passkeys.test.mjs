import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

const LOGIN_ACTIONS = "src/app/console/(auth)/login/passkey-actions.ts";
const REG_ACTIONS =
  "src/app/console/(dashboard)/trapman/settings/passkey-actions.ts";

test("passkey libraries exist and follow the CRM collection convention", () => {
  for (const path of [
    "src/lib/webauthn.ts",
    "src/lib/passkeys.ts",
    "src/lib/login-tickets.ts",
  ]) {
    assert.ok(existsSync(resolve(root, path)), `${path} must exist`);
    assert.match(read(path), /^import "server-only";/m, `${path} must be server-only`);
  }
  const collections = read("src/lib/firebase/collections.ts");
  assert.match(collections, /passkeys: "_admin_passkeys"/);
  assert.match(collections, /loginTickets: "_admin_login_tickets"/);
});

test("both ceremonies demand user verification", () => {
  const reg = read(REG_ACTIONS);
  const login = read(LOGIN_ACTIONS);
  assert.match(reg, /userVerification: "required"/);
  assert.match(reg, /requireUserVerification: true/);
  assert.match(login, /userVerification: "required"/);
  assert.match(login, /requireUserVerification: true/);
  // Discoverable-credential registration, usernameless login.
  assert.match(reg, /residentKey: "required"/);
  assert.match(login, /allowCredentials: \[\]/);
});

test("RP identity comes from config, never from request headers", () => {
  const login = read(LOGIN_ACTIONS);
  const reg = read(REG_ACTIONS);
  for (const src of [login, reg]) {
    assert.match(src, /getWebAuthnConfig\(\)/);
    assert.match(src, /expectedOrigin: config\.origin/);
    assert.match(src, /expectedRPID: config\.rpID/);
  }
  const webauthn = read("src/lib/webauthn.ts");
  // Production must fail closed when the env vars are missing.
  assert.match(webauthn, /return null/);
  assert.match(webauthn, /NODE_ENV !== "production"/);
});

test("login failures feed the shared lockout and audit trail", () => {
  const login = read(LOGIN_ACTIONS);
  assert.match(login, /isLocked\(admin\)/);
  assert.match(login, /registerFailedAttempt\(admin\)/);
  assert.match(login, /auth\.passkey\.login\.success/);
  assert.match(login, /auth\.passkey\.login\.failed/);
  assert.match(login, /auth\.passkey\.counter_regression/);
  assert.match(login, /checkRateLimit/);
});

test("session bridge is a single-use server-side ticket", () => {
  const login = read(LOGIN_ACTIONS);
  // The ticket is minted and spent inside the same server action.
  assert.match(login, /mintLoginTicket\(admin\.id\)/);
  assert.match(login, /signIn\("passkey"/);

  const tickets = read("src/lib/login-tickets.ts");
  // Only the hash is stored, consumption is transactional.
  assert.match(tickets, /createHash\("sha256"\)/);
  assert.match(tickets, /runTransaction/);
  assert.match(tickets, /tx\.delete\(ref\)/);

  const auth = read("src/auth.ts");
  assert.match(auth, /id: "passkey"/);
  assert.match(auth, /consumeLoginTicket/);
  // The password+TOTP provider keeps its default id — renaming it would
  // break signIn("credentials") in the login action.
  assert.match(read("src/app/console/(auth)/login/actions.ts"), /signIn\("credentials"/);
});

test("challenge cookie is kind-tagged, encrypted, and consumed on read", () => {
  const webauthn = read("src/lib/webauthn.ts");
  assert.match(webauthn, /httpOnly: true/);
  assert.match(webauthn, /encrypt\(JSON\.stringify\(payload\)\)/);
  assert.match(webauthn, /payload\.k !== kind/);
  assert.match(webauthn, /store\.delete\(CHALLENGE_COOKIE\)/);

  const reg = read(REG_ACTIONS);
  // Registration must bind the ceremony to the signed-in admin.
  assert.match(reg, /pending\.adminId !== admin\.id/);
});

test("permissions policy scopes WebAuthn to self", () => {
  const config = read("next.config.ts");
  assert.match(config, /publickey-credentials-get=\(self\)/);
  assert.match(config, /publickey-credentials-create=\(self\)/);
});
