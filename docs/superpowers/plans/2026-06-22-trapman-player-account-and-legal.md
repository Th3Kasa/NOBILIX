# TrapMan Player Account and Legal Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared Firebase player sign-in, a UID-scoped progression portal, accurate project-specific legal documents, data export, and tested account deletion.

**Architecture:** Firebase Web Auth obtains an ID token in a client login island. A route handler exchanges it for a secure Firebase Admin session cookie. Server Components verify the cookie and read UID-scoped Firestore data. Legal content is rendered from typed project-specific content and is published only after the data inventory test matches implementation.

**Tech Stack:** Firebase JS SDK, Firebase Admin 14, Next.js 16 route handlers and cookies, React 19, Zod, Node test runner.

## Global Constraints

- Same Firebase identity as the game.
- No parallel player account database.
- No date-of-birth field or age gate.
- 13+ contractual representation and under-13 parent deletion path.
- Player and admin cookies use separate names.
- Firebase Analytics is not queried as a player database.
- Playtime/ad counters show unavailable until Firestore counters exist.
- Legal copy requires qualified legal review before launch.

---

## File Structure

- `src/lib/firebase/client.ts` - browser Firebase app/auth singleton.
- `src/lib/player-session.ts` - server session-cookie verification.
- `src/lib/player-account.ts` - UID-scoped player data composition.
- `src/lib/player-deletion.ts` - idempotent deletion map.
- `src/types/player-account.ts` - player portal types.
- `src/app/api/player/session/route.ts` - create/delete player session.
- `src/app/api/player/export/route.ts` - authenticated JSON export.
- `src/app/api/player/delete/route.ts` - recent-auth deletion endpoint.
- `src/app/(public)/trapman/account/login/page.tsx` - sign-in page.
- `src/components/trapman/account/player-login-form.tsx` - Firebase client login.
- `src/app/(player)/trapman/account/layout.tsx` - protected player shell.
- `src/app/(player)/trapman/account/page.tsx` - player dashboard.
- `src/app/(public)/trapman/_legal/*` - shared legal components/content.
- Four legal route pages.
- `tests/player-session.test.mjs`
- `tests/player-data-contract.test.mjs`
- `tests/player-deletion-contract.test.mjs`
- `tests/legal-data-inventory.test.mjs`

### Task 1: Add Firebase Client Configuration

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/lib/env.ts`
- Create: `src/lib/firebase/client.ts`
- Create: `tests/player-session.test.mjs`

- [ ] **Step 1: Install Firebase client SDK**

Run: `npm install firebase`

Expected: `firebase` added to dependencies.

- [ ] **Step 2: Add public config variables**

Add to `.env.example`:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Extend `src/lib/env.ts` with optional public fields. Do not require them for console-only builds.

- [ ] **Step 3: Write the client singleton**

```ts
// src/lib/firebase/client.ts
"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseClientAuth() {
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
```

- [ ] **Step 4: Add a boundary test**

Assert `client.ts` contains no `firebase-admin`, and `player-session.ts` contains no `firebase/app`.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run lint && npm run build`

Commit: `feat: add Firebase player client`

### Task 2: Exchange ID Tokens for Secure Player Sessions

**Files:**
- Create: `src/lib/player-session.ts`
- Create: `src/app/api/player/session/route.ts`
- Modify: `tests/player-session.test.mjs`

**Interfaces:**

```ts
export const PLAYER_SESSION_COOKIE = "__Host-nobilix-player";
export async function getPlayerSession(): Promise<{ uid: string; email?: string } | null>;
export async function requirePlayerSession(): Promise<{ uid: string; email?: string }>;
```

- [ ] **Step 1: Write tests for cookie separation and security flags**

Assert the route includes `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`, `path: "/"`, and never uses the Auth.js admin cookie.

- [ ] **Step 2: Implement session verification**

```ts
// src/lib/player-session.ts
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthAdmin } from "@/lib/firebase/auth";

export const PLAYER_SESSION_COOKIE = "__Host-nobilix-player";

export async function getPlayerSession() {
  const value = (await cookies()).get(PLAYER_SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const decoded = await getAuthAdmin().verifySessionCookie(value, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export async function requirePlayerSession() {
  const session = await getPlayerSession();
  if (!session) redirect("/trapman/account/login");
  return session;
}
```

- [ ] **Step 3: Implement POST/DELETE session route**

POST validates `{ idToken }`, verifies it, rejects tokens older than five minutes by checking `auth_time`, then creates a five-day session cookie. DELETE clears the cookie.

- [ ] **Step 4: Verify**

Run: `node --test tests/player-session.test.mjs && npm run build`

- [ ] **Step 5: Commit**

Commit: `feat: add secure player sessions`

### Task 3: Build Login and Protected Account Shell

**Files:**
- Create: `src/components/trapman/account/player-login-form.tsx`
- Create: `src/app/(public)/trapman/account/login/page.tsx`
- Create: `src/app/(player)/trapman/account/layout.tsx`
- Create: `src/app/(player)/trapman/account/loading.tsx`
- Create: `src/app/(player)/trapman/account/error.tsx`

- [ ] **Step 1: Implement provider-aware login**

Use Firebase providers matching production configuration. Begin with Google and email/password only if both are enabled in the game. Apple is added only after verifying web provider configuration.

After Firebase sign-in:

```ts
const idToken = await credential.user.getIdToken();
const response = await fetch("/api/player/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ idToken }),
});
if (response.ok) router.replace("/trapman/account");
```

- [ ] **Step 2: Protect the account layout**

Call `requirePlayerSession()` in the Server Component layout. Do not rely only on proxy.

- [ ] **Step 3: Add loading and recoverable error UI**

Never expose raw Firebase messages. Error copy: "We could not load your TrapMan account. Try again or contact player support."

- [ ] **Step 4: Verify**

Run: `npm test && npm run lint && npm run build`

- [ ] **Step 5: Commit**

Commit: `feat: add TrapMan player login`

### Task 4: Compose UID-Scoped Player Data

**Files:**
- Create: `src/types/player-account.ts`
- Create: `src/lib/player-account.ts`
- Modify: `src/lib/firebase/collections.ts`
- Create: `tests/player-data-contract.test.mjs`

**Interfaces:**

```ts
export interface PlayerAccountSnapshot {
  uid: string;
  username: string | null;
  email: string | null;
  country: string | null;
  competitionsWon: number | null;
  progress: Record<string, unknown> | null;
  purchases: Array<{ id: string; productId: string; purchasedAt: number | null }>;
  analytics: {
    totalPlaytimeMs: number | null;
    adsWatchedCount: number | null;
    adsClickedCount: number | null;
    updatedAt: number | null;
  };
}
export async function getPlayerAccountSnapshot(uid: string): Promise<PlayerAccountSnapshot>;
```

- [ ] **Step 1: Extend collection names**

Add `purchases: "purchases"` and `progress: "player_progress"` to `GAME`.

- [ ] **Step 2: Write a test that enforces UID scoping**

Assert `player-account.ts` accepts `uid`, reads `users/{uid}` and `player_progress/{uid}`, and filters purchases by `uid`.

- [ ] **Step 3: Implement defensive mapping**

Map:

- `username` from `username`, `displayName`, or `name`.
- `competitionsWon` from either user or progress document.
- purchase product from `productId`, `product_id`, or `itemId`.
- analytics counters only from explicit Firestore numeric fields.

Return `null` for missing metrics, never zero unless stored as zero.

- [ ] **Step 4: Verify and commit**

Run: `node --test tests/player-data-contract.test.mjs && npm run build`

Commit: `feat: compose player account data`

### Task 5: Build the Player Dashboard and Export

**Files:**
- Create: `src/app/(player)/trapman/account/page.tsx`
- Create: `src/components/trapman/account/progression-panel.tsx`
- Create: `src/components/trapman/account/purchase-history.tsx`
- Create: `src/components/trapman/account/account-actions.tsx`
- Create: `src/app/api/player/export/route.ts`

- [ ] **Step 1: Render verified fields**

Show username, email, country, competitions won, available progression, purchase history, and three analytics counters.

Use "Not available yet" for missing Firestore counters.

- [ ] **Step 2: Add authenticated export**

The export route calls `requirePlayerSession()`-equivalent route verification and returns:

```json
{
  "exportedAt": "ISO_DATE",
  "project": "trapman",
  "account": {},
  "progress": {},
  "purchases": []
}
```

Set `Content-Disposition: attachment; filename="trapman-data.json"`.

- [ ] **Step 3: Verify no arbitrary UID input**

Test that neither page nor API reads `uid` from query parameters or request body.

- [ ] **Step 4: Commit**

Commit: `feat: add TrapMan player dashboard`

### Task 6: Create a Verified Legal Data Inventory

**Files:**
- Create: `src/content/trapman/data-inventory.ts`
- Create: `tests/legal-data-inventory.test.mjs`

**Interfaces:**

```ts
export const TRAPMAN_DATA_INVENTORY = [
  { key: "username", system: "Firestore", location: "users/{uid}", purpose: "..." },
  // exact confirmed rows
] as const;
```

- [ ] **Step 1: Encode confirmed fields and events**

Include username, email, country, competitions won, purchase receipt record, purchased product ID, `session_end.duration_ms`, `ad_closed`, and `ad_clicked`.

- [ ] **Step 2: Encode unresolved claims separately**

```ts
export const REQUIRES_ENGINEERING_VERIFICATION = [
  "Firebase Analytics automatic events and user properties",
  "device identifiers including GAID",
  "FCM tokens and push notification data",
  "crash reporting",
  "guest account behavior",
  "advertising SDKs and destination processors",
] as const;
```

- [ ] **Step 3: Test that legal content imports the inventory**

Prevent hand-maintained contradictory tables.

- [ ] **Step 4: Commit**

Commit: `feat: define TrapMan legal data inventory`

### Task 7: Replace Static Legal Pages with Project-Scoped Pages

**Files:**
- Create: `src/app/(public)/trapman/_legal/legal-shell.tsx`
- Create: `src/content/trapman/privacy.ts`
- Create: `src/content/trapman/terms.ts`
- Create: `src/content/trapman/compliance.ts`
- Create: four route pages.
- Delete after migration: `public/site/privacy-policy.html`, `terms-of-use.html`, `data-compliance.html`, `delete-account.html`

- [ ] **Step 1: Build a semantic legal shell**

Include project breadcrumb, official logo, sticky table of contents, last-updated date, support email, and cross-links.

- [ ] **Step 2: Write Privacy Policy content from the inventory**

The policy must explicitly say:

- Firestore stores username, email, country, competitions won, and purchase/product records.
- Analytics records `session_end.duration_ms`, `ad_closed`, and `ad_clicked`.
- `ad_closed` means the ad was closed; it is not described as full completion unless engineering verifies that meaning.
- TrapMan is intended for users 13+.
- No birth date is collected.
- Nobilix does not knowingly collect under-13 data and provides parent deletion requests.
- Firebase Analytics aggregated data deletion is described accurately, without promising instant per-event deletion.

- [ ] **Step 3: Write Terms**

Cover eligibility, account security, licence, fair play, leaderboard names, purchases/refunds, advertising links, IP, termination, Australian Consumer Law savings, and disputes.

- [ ] **Step 4: Write Data & Compliance**

Render `TRAPMAN_DATA_INVENTORY` as the technical table and visibly mark unverified categories as "Under engineering verification; not claimed as collected until confirmed."

- [ ] **Step 5: Build Delete Account page**

Before the endpoint ships, the page supports authenticated deletion plus parent/support request instructions. It distinguishes deletable Firestore/Auth data from aggregated Analytics retention.

- [ ] **Step 6: Verify**

Run legal inventory tests, lint, build, and manual link checks.

- [ ] **Step 7: Commit**

Commit: `feat: publish project-scoped TrapMan legal pages`

### Task 8: Implement Idempotent Account Deletion

**Files:**
- Create: `src/lib/player-deletion.ts`
- Create: `src/app/api/player/delete/route.ts`
- Create: `tests/player-deletion-contract.test.mjs`
- Modify: `src/components/trapman/account/account-actions.tsx`

**Interfaces:**

```ts
export interface DeletionResult {
  uid: string;
  deleted: string[];
  anonymized: string[];
  alreadyAbsent: string[];
}
export async function deletePlayerAccount(uid: string): Promise<DeletionResult>;
```

- [ ] **Step 1: Write contract tests**

Require deletion handling for:

- `users/{uid}`
- `player_progress/{uid}`
- `leaderboard/{uid}`
- purchase documents queried by `uid`
- Firebase Auth user

Require idempotent `auth/user-not-found` handling.

- [ ] **Step 2: Implement deletion in ordered batches**

Delete private profile/progress, delete or anonymize leaderboard identity, delete purchase documents unless retention configuration marks them for anonymization, then delete Auth.

Do not write email or username into the compliance receipt.

- [ ] **Step 3: Require recent authentication**

The endpoint verifies the session cookie with revocation checking and rejects sessions whose `auth_time` exceeds five minutes. UI prompts the user to reauthenticate.

- [ ] **Step 4: Add typed confirmation**

Require body `{ confirmation: "DELETE TRAPMAN" }`.

- [ ] **Step 5: Verify**

Run: `node --test tests/player-deletion-contract.test.mjs && npm run build`

- [ ] **Step 6: Commit**

Commit: `feat: add compliant TrapMan account deletion`

## Legal Launch Gate

Do not deploy revised legal pages as final legal advice until:

- Engineering inventory is signed off.
- Store Data Safety and App Privacy forms match.
- Qualified legal review is recorded.
- Deletion is tested against a non-production Firebase test account.
