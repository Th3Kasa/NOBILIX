# Production Admin Login Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Vercel production admin login for all three administrators and retain working Firebase Auth operations.

**Architecture:** Split the shared Firebase Admin module into service-specific modules so the login path loads Firestore without loading Firebase Auth. Pin the broken `jwks-rsa` transitive dependency to a CommonJS-compatible `jose` release.

**Tech Stack:** Next.js 16.2.9, TypeScript, Auth.js v5, Firebase Admin 14, Node test runner, Vercel

## Global Constraints

- Do not copy or commit the supplied Firebase service-account JSON.
- Do not print or commit administrator passwords.
- Preserve TOTP enrollment, lockout, and audit behavior.
- Push the verified fix directly to `main` as explicitly requested.

---

### Task 1: Add the regression guard

**Files:**
- Create: `tests/firebase-runtime-boundaries.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: repository source files and `package.json`
- Produces: `npm test`, enforcing that login's Firestore module does not import Firebase Auth and that `jwks-rsa` uses `jose@4.15.9`

- [ ] **Step 1: Write the failing test**

Create a Node test that expects service-specific Firebase files, rejects `firebase-admin/auth` from the Firestore module, and checks the npm override.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test`

Expected: FAIL because the service-specific modules and override do not exist.

### Task 2: Split Firebase services and pin jose

**Files:**
- Create: `src/lib/firebase/app.ts`
- Create: `src/lib/firebase/firestore.ts`
- Create: `src/lib/firebase/auth.ts`
- Create: `src/lib/firebase/messaging.ts`
- Modify: `src/lib/firebase/admin.ts` to a Firestore-only compatibility shim
- Modify: Firebase consumers under `src/lib` and `src/app/console/(auth)/login/actions.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `getFirebaseApp(): App`, `getDb(): Firestore`, `getAuthAdmin(): Auth`, and `getMessagingAdmin(): Messaging`

- [ ] **Step 1: Implement the minimal service split**

Move service-account resolution and app initialization to `app.ts`. Each service module imports `getFirebaseApp()` and initializes only its own SDK.

- [ ] **Step 2: Update consumers**

Import `getDb`, `getAuthAdmin`, and `getMessagingAdmin` from their service-specific files.

- [ ] **Step 3: Add the dependency override**

Set:

```json
"overrides": {
  "jwks-rsa": {
    "jose": "4.15.9"
  }
}
```

Run `npm.cmd install --package-lock-only` and `npm.cmd install` to update the lockfile and installed tree.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test`

Expected: all tests pass.

### Task 3: Verify code and live admin data

**Files:**
- No production source changes expected.

- [ ] **Step 1: Run static verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd ls firebase-admin jwks-rsa jose --all
```

Expected: lint/build exit 0 and `jwks-rsa` resolves `jose@4.15.9`.

- [ ] **Step 2: Reset all admin records**

Use the supplied service-account JSON locally and update the three `_admin` records with bcrypt hashes for the supplied passwords, clearing lockout and TOTP state.

- [ ] **Step 3: Verify password hashes**

Read each admin record and run `bcrypt.compare` with its supplied password. Expected: all three return true.

### Task 4: Review, ship, and verify production

**Files:**
- Update: `.Codex/shared/performance-log.md`
- Update as needed: `.Codex/shared/lessons.md`, `.Codex/shared/patterns.md`

- [ ] **Step 1: Review the focused diff**

Check for secret leakage, unrelated files, broken imports, and Firebase service-boundary regressions.

- [ ] **Step 2: Commit and push**

Stage only the fix, tests, lockfile, and approved documentation. Commit to `main` and push `origin main`.

- [ ] **Step 3: Wait for Vercel**

Confirm the pushed SHA reaches a Ready production deployment and the `nobilix.vercel.app` alias points to it.

- [ ] **Step 4: Verify all three accounts**

For each admin, submit email/password and assert the page advances to TOTP enrollment without exposing the QR key.

- [ ] **Step 5: Verify logs**

Check production logs for new `/console/login` HTTP 500 responses and `ERR_REQUIRE_ESM`. Expected: none after deployment.
