# Nobilix Multi-Project Console Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current TrapMan-only `/console` into a Nobilix project selector plus `/console/trapman/*` mission-control workspace without breaking admin authentication or existing data operations.

**Architecture:** Auth.js continues protecting all `/console` routes. `/console` becomes the platform-level project selector. A project-scoped layout reads the registry slug and supplies navigation. Existing TrapMan pages move under `/console/trapman`, with redirects preserving old paths.

**Tech Stack:** Next.js 16 App Router, Auth.js v5 beta, Firebase Admin, React 19, Recharts 3, Tailwind CSS 4.

## Global Constraints

- Every admin sees every project.
- Admin auth and player auth remain isolated.
- Preserve TOTP, lockout, audit logging, and password-change behavior.
- No fake live values.
- Missing metrics use honest unavailable states.
- Console motion is 120-240ms and reduced-motion compatible.

---

## File Structure

- `src/app/console/(dashboard)/page.tsx` - project selector.
- `src/app/console/(dashboard)/trapman/layout.tsx` - project workspace shell.
- `src/app/console/(dashboard)/trapman/*` - migrated modules.
- `src/components/nav/platform-sidebar.tsx` - platform navigation.
- `src/components/nav/project-sidebar.tsx` - project module navigation.
- `src/components/console/project-tile.tsx` - project selector tile.
- `src/components/console/live-status.tsx` - connection/status display.
- `src/lib/trapman/overview.ts` - verified overview composition.
- `tests/console-routing.test.mjs`
- `tests/console-metrics-contract.test.mjs`

### Task 1: Add Console Route Contracts and Legacy Redirects

**Files:**
- Create: `tests/console-routing.test.mjs`
- Modify: `next.config.ts`

- [ ] **Step 1: Write failing tests**

Assert:

- `/console` project selector file exists.
- `/console/(dashboard)/trapman/layout.tsx` exists.
- legacy `/console/users` redirects to `/console/trapman/users`.
- all nine existing modules have project-scoped destinations.

- [ ] **Step 2: Add temporary redirects**

Add non-permanent redirects during migration:

```ts
{ source: "/console/users/:path*", destination: "/console/trapman/users/:path*", permanent: false }
```

Repeat for leaderboard, messaging, analytics, purchases, exports, audit, and settings. `/console` is not redirected.

- [ ] **Step 3: Verify and commit**

Run: `node --test tests/console-routing.test.mjs`

Commit: `feat: add project-scoped console redirects`

### Task 2: Build the Project Selector

**Files:**
- Modify: `src/app/console/(dashboard)/page.tsx`
- Create: `src/components/console/project-tile.tsx`
- Create: `src/components/nav/platform-sidebar.tsx`
- Modify: `src/app/console/(dashboard)/layout.tsx`

- [ ] **Step 1: Replace the overview with registry-driven projects**

Map `Object.values(PROJECTS)` to `ProjectTile`.

The tile displays logo, name, type, status, enabled module count, and "Open console".

- [ ] **Step 2: Add platform sidebar**

Navigation contains Projects, Admin profile/settings, and Audit activity. Do not show TrapMan modules at platform level.

- [ ] **Step 3: Preserve auth**

Keep the current `auth()` check in the dashboard layout and current `Topbar`.

- [ ] **Step 4: Verify**

Run: `npm test && npm run lint && npm run build`

- [ ] **Step 5: Commit**

Commit: `feat: add Nobilix console project selector`

### Task 3: Add the TrapMan Workspace Shell

**Files:**
- Create: `src/app/console/(dashboard)/trapman/layout.tsx`
- Create: `src/components/nav/project-sidebar.tsx`
- Modify: `src/components/nav/topbar.tsx`

- [ ] **Step 1: Build registry-driven module links**

Each link is `/console/trapman/{module}`. Overview uses `/console/trapman`.

- [ ] **Step 2: Add "All projects" control**

The project sidebar header shows official logo, TrapMan, live status, and a link back to `/console`.

- [ ] **Step 3: Update topbar context**

Accept optional `projectName` and display Nobilix / TrapMan hierarchy without changing logout behavior.

- [ ] **Step 4: Verify and commit**

Run build and keyboard navigation smoke test.

Commit: `feat: add TrapMan console workspace`

### Task 4: Move Existing Modules Without Behavior Changes

**Files:**
- Move: all current dashboard module directories to `src/app/console/(dashboard)/trapman/`
- Update imports only where route-relative paths break.

- [ ] **Step 1: Move overview and modules**

Use native PowerShell `Move-Item -LiteralPath` within the repository. Preserve file contents.

- [ ] **Step 2: Update action imports**

Update absolute action paths such as:

```ts
import { logout } from "@/app/console/(dashboard)/actions";
```

Keep shared logout action at the platform dashboard level.

- [ ] **Step 3: Run existing tests and build**

Expected: no behavior regression in users, leaderboard, messaging, audit, exports, or settings.

- [ ] **Step 4: Commit**

Commit: `refactor: scope TrapMan console modules`

### Task 5: Build Verified Mission-Control Overview

**Files:**
- Create: `src/lib/trapman/overview.ts`
- Create: `src/components/console/live-status.tsx`
- Modify: `src/app/console/(dashboard)/trapman/page.tsx`
- Create: `tests/console-metrics-contract.test.mjs`

**Interfaces:**

```ts
export interface TrapManOverview {
  connected: boolean;
  totalPlayers: number | null;
  registeredPlayers: number | null;
  guestPlayers: number | null;
  newPlayers7d: number | null;
  purchases24h: number | null;
  revenue24h: number | null;
  adsClosed24h: number | null;
  adsClicked24h: number | null;
  unavailable: string[];
}
```

- [ ] **Step 1: Write a no-fake-values test**

Assert the page does not contain numeric literals such as example player/revenue figures and reads from `getTrapManOverview`.

- [ ] **Step 2: Compose verified Firestore metrics**

Reuse `getOverviewMetrics`. Add purchases only after collection field names and timestamps are confirmed. Return `null` and append a human label to `unavailable` for unconfirmed metrics.

- [ ] **Step 3: Render hierarchy**

Order:

1. Connection/live status
2. Player health metrics
3. Available activity chart or honest empty state
4. Needs-attention list derived only from actual thresholds
5. Unavailable data-source panel

- [ ] **Step 4: Verify and commit**

Run tests, lint, build.

Commit: `feat: add verified TrapMan mission control`

### Task 6: Add Gameplay and Ads Modules

**Files:**
- Create: `src/app/console/(dashboard)/trapman/gameplay/page.tsx`
- Create: `src/app/console/(dashboard)/trapman/ads/page.tsx`
- Create: `src/lib/trapman/gameplay.ts`
- Create: `src/lib/trapman/ads.ts`

- [ ] **Step 1: Define data-source contracts**

Gameplay supports level distribution only when level fields exist. Ads supports `ad_closed` and `ad_clicked` aggregates only when counters or export-backed metrics exist.

- [ ] **Step 2: Implement empty states first**

Exact copy:

- Gameplay: "Gameplay analytics are waiting for the player_progress schema."
- Ads: "Ad analytics require persisted ad_closed and ad_clicked aggregates."

- [ ] **Step 3: Add data adapters**

Adapters return `{ connected, rows, unavailableReason }`, never throw raw errors into pages.

- [ ] **Step 4: Verify and commit**

Commit: `feat: add gameplay and ads console modules`

### Task 7: Apply the Mission-Control Design System

**Files:**
- Modify: `src/app/globals.css`
- Modify: console UI components.
- Create: `src/components/console/metric-panel.tsx`
- Create: `src/components/console/attention-panel.tsx`

- [ ] **Step 1: Add console semantic tokens**

Add:

```css
.console-shell {
  --console-bg: #090c10;
  --console-panel: #10151c;
  --console-line: rgb(255 255 255 / .09);
  --console-live: #9de43a;
  --console-action: #ff632f;
  --console-violet: #9b5cff;
}
```

- [ ] **Step 2: Replace generic card grid**

Use one primary metric, compact supporting KPIs, large chart region, attention rail, and recent event table.

- [ ] **Step 3: Add restrained motion**

Use 120-240ms transitions for hover, selection, drawers, and live pulse. Disable interpolation in reduced-motion mode.

- [ ] **Step 4: Accessibility review**

Check focus, table headers, button names, color-independent status, mobile navigation, and 44px targets.

- [ ] **Step 5: Verify and commit**

Run all checks and commit: `feat: redesign Nobilix console`

### Task 8: Console Security and Regression Gate

**Files:**
- Modify: `tests/firebase-runtime-boundaries.test.mjs`
- Modify: `tests/console-routing.test.mjs`
- Create: `tests/console-auth-boundary.test.mjs`

- [ ] **Step 1: Assert admin/player separation**

The test must ensure:

- Auth.js admin modules do not import Firebase client auth.
- Player session modules do not import `@/auth`.
- Proxy still matches `/console/:path*`.
- Player account protection occurs server-side in its layout.

- [ ] **Step 2: Assert destructive actions retain audit logging**

Check user deletion, leaderboard reset/removal, password change, and messaging send continue calling `recordAudit`.

- [ ] **Step 3: Run full gate**

Run:

```powershell
npm test
npm run lint
npm run build
```

- [ ] **Step 4: Browser smoke test**

Verify project selector, TrapMan modules, logout, legacy redirects, mobile navigation, and no console errors.

- [ ] **Step 5: Commit**

Commit: `test: harden multi-project console boundaries`

## Deployment Gate

The Vercel CLI is not installed. Before deployment, install it with:

```powershell
npm i -g vercel
```

Then use `vercel env pull`, preview deployment, production promotion, logs, and post-deploy smoke tests. If the CLI is not installed, use the connected GitHub deployment flow and verify Vercel through its official dashboard/API before claiming launch success.
