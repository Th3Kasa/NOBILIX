# Production Admin Login Repair Design

## Goal

Restore production login at `/console` for all three NOBILIX administrators while preserving password verification, first-login TOTP enrollment, account lockout, and audit logging.

## Root Cause

Next.js 16 automatically externalizes `firebase-admin`. The shared Firebase module imported `firebase-admin/auth` even when the login path only needed Firestore. In Vercel's production CommonJS function runtime, `firebase-admin@14.0.0` loads `jwks-rsa@4.0.1`, which synchronously requires ESM-only `jose@6.2.3` and crashes before credentials reach Firestore.

## Design

1. Separate Firebase services by responsibility:
   - `app.ts` owns service-account resolution and the Firebase app singleton.
   - `firestore.ts` owns the Firestore singleton.
   - `auth.ts` owns Firebase Authentication access.
   - `messaging.ts` owns Firebase Cloud Messaging access.
2. Update login and data modules to import only the Firebase service they use. The login dependency graph must not include `firebase-admin/auth`.
3. Add an npm override so `jwks-rsa` uses dual-module `jose@4.15.9`. This protects the Firebase Auth path used by compliant user deletion.
4. Add a regression test that enforces the service boundaries and dependency override.
5. Reset the three `_admin` records with the provided credentials and require fresh TOTP enrollment.

## Verification

- Regression test passes after failing against the old structure.
- ESLint and production build succeed.
- `npm ls` confirms `jwks-rsa` resolves `jose@4.15.9`.
- Each admin's password verifies against the live Firestore hash.
- After deployment, each account advances from credentials to first-time TOTP enrollment without a server error.
- Vercel production logs show no new login HTTP 500 or `ERR_REQUIRE_ESM`.

## Security

- The service-account JSON remains outside the repository.
- Passwords are never committed or printed.
- Production environment secrets remain in Vercel.
- TOTP secrets remain encrypted at rest.
