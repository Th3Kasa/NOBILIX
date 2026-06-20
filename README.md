# NOBILIX Admin Console

Secure internal admin console (CRM) for the **TrapMan** mobile game, built on top of
the live Firebase project (Firestore, Auth, Cloud Messaging) via the Firebase Admin SDK.

Next.js (App Router) · TypeScript (strict) · Tailwind v4 · Auth.js · TOTP 2FA.

## What's built

| Area | Status |
|------|--------|
| Foundation, design system, lazy Firebase Admin SDK | ✅ |
| Admin auth — password + TOTP (authenticator app), 3 seats, lockout, audit log | ✅ |
| Player management — search, detail, edit, **compliant hard-delete**, per-player export | ✅ |
| Push notifications (FCM) — single / segment / broadcast, preview, history | ✅ |
| Audit log viewer | ✅ |
| Analytics + purchase tracking | ⏳ Phase 5 (needs live schema scan) |
| Custom CSV/XLSX/PDF export | ⏳ Phase 6 |

## Setup

### 1. Environment

Copy `.env.example` → `.env.local` and fill in:

- **Firebase service account** — in the Firebase console: *Project Settings → Service
  Accounts → Generate new private key*. Then either base64 the whole JSON into
  `FIREBASE_SERVICE_ACCOUNT_B64`, or paste the three discrete fields.
- `AUTH_SECRET` — `openssl rand -base64 32`
- `CRM_ENCRYPTION_KEY` — `openssl rand -base64 32` (encrypts TOTP secrets at rest)

### 2. Install & run

```bash
npm install
npm run dev
```

### 3. Seed the 3 admins

```bash
node --env-file=.env.local scripts/seed-admin.mjs --email owner@nobilix.com --name "Owner" --role owner
node --env-file=.env.local scripts/seed-admin.mjs --email a2@nobilix.com   --name "Admin 2" --role admin
node --env-file=.env.local scripts/seed-admin.mjs --email a3@nobilix.com   --name "Admin 3" --role admin
```

Each prints a one-time temporary password. Each admin then visits **/enroll** to set
up their authenticator app, and signs in at **/login** with email + password + 6-digit code.

Roles: `owner` / `admin` can edit & send; `viewer` is read-only.

## Security notes

- Service-account credentials are server-only (`server-only` guard) and never reach the client.
- TOTP secrets are AES-256-GCM encrypted at rest.
- Login lockout after 5 failed attempts (15 min). Every privileged action is audit-logged.
- All routes except `/login`, `/enroll`, and the auth API require an authenticated session
  (enforced in `src/proxy.ts`).

## Compliance

Player deletion is a **hard delete** of `users/{uid}` plus the Firebase Auth record,
satisfying the data-compliance commitment. Per-player JSON export supports the data
portability right. Both are audit-logged.
