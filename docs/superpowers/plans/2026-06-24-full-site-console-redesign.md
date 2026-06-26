# Nobilix and TrapMan Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every public, player, legal, authentication, and console route as a responsive professional Nobilix platform, using an original animated TrapMan world and optimized MuAPI-authored media.

**Architecture:** Preserve the current Next.js 16 App Router, server data boundaries, Firebase integrations, and route structure. Add a token-driven visual foundation, small Motion client islands, generated static media, and responsive shared shells; pages remain Server Components unless browser state is required.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript 5, Tailwind CSS 4, Motion for React, Firebase, Recharts, Node test runner, MuAPI offline asset generation.

## Global Constraints

- Nobilix is a neutral editorial company brand; TrapMan owns the pixel-art synthwave identity.
- Supplied TrapMan screenshots are inspiration and selective product evidence, not page layouts.
- `MUAPI_API_KEY` stays in ignored local environment configuration and never enters browser code, logs, commits, or generated metadata.
- The Open Generative AI application is not installed into the production repository.
- Motion must respect `prefers-reduced-motion`, pause when hidden or offscreen, and primarily animate transforms and opacity.
- Every public page is mobile-first, keyboard accessible, WCAG 2.2 AA, and usable without animation.
- Preserve all current authentication, authorization, Firebase, deletion, and audit boundaries.
- Legal pages disclose the exact confirmed Firestore fields and Firebase Analytics events from the approved specification.
- No invented gameplay, products, metrics, integrations, or live values.
- Existing unrelated user changes in the original checkout must not be modified.

---

### Task 1: Isolated Branch, Generated Asset Pipeline, and Motion Dependency

**Files:**
- Create: `scripts/generate-design-assets.mjs`
- Create: `public/assets/generated/asset-manifest.json`
- Create: `public/assets/generated/nobilix/*`
- Create: `public/assets/generated/trapman/*`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/design-assets.test.mjs`

**Interfaces:**
- Produces a committed asset manifest whose entries contain `id`, `kind`, `path`, `width`, `height`, `source`, and `purpose`.
- Produces optimized image assets consumed by Tasks 3 and 4.
- Adds `motion` as the sole new runtime UI dependency.

- [ ] **Step 1: Create the isolated worktree and install the baseline dependencies**

Run:

```powershell
git worktree add ".worktrees/full-redesign" -b "codex/full-site-redesign"
Copy-Item -LiteralPath ".env.local" -Destination ".worktrees/full-redesign/.env.local"
npm.cmd install
```

- [ ] **Step 2: Run the clean baseline**

Run: `npm.cmd test`

Expected: all existing tests pass before redesign changes.

- [ ] **Step 3: Write the failing asset contract**

Add tests that require:

```js
const requiredAssets = [
  "nobilix/studio-hero.webp",
  "nobilix/project-transition.webp",
  "trapman/city-hero.webp",
  "trapman/city-mobile.webp",
  "trapman/portal.webp",
  "trapman/gameplay-atmosphere.webp",
  "trapman/music-atmosphere.webp",
];
```

The test must verify every file exists, the manifest contains every file, no manifest value contains `MUAPI_API_KEY`, and all paths remain inside `public/assets/generated`.

- [ ] **Step 4: Run the test and confirm RED**

Run: `node --test tests/design-assets.test.mjs`

Expected: FAIL because the manifest and generated assets do not exist.

- [ ] **Step 5: Implement the isolated generation script**

The script must:

- Read `MUAPI_API_KEY` from `.env.local` without printing it.
- Submit image requests directly to `https://api.muapi.ai/api/v1/{endpoint}`.
- Poll `/api/v1/predictions/{requestId}/result`.
- Download outputs into a temporary generation directory.
- Copy only reviewed output files into `public/assets/generated`.
- Write the manifest without prompts containing secrets or remote signed URLs.
- Support `--dry-run` to validate prompts and paths without spending credits.

- [ ] **Step 6: Generate and review the required assets**

Use original prompts derived from the approved art direction. Generate still key art first. Reject malformed text, altered logos, invented game UI, and generic photorealistic cyberpunk. Optimize accepted images to WebP with explicit delivery dimensions.

- [ ] **Step 7: Install Motion**

Run: `npm.cmd install motion`

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
node --test tests/design-assets.test.mjs
npm.cmd audit --omit=dev
```

Expected: asset contract passes; new production dependency audit has no newly introduced unresolved vulnerability attributable to Motion.

- [ ] **Step 9: Commit**

```powershell
git add package.json package-lock.json scripts/generate-design-assets.mjs public/assets/generated tests/design-assets.test.mjs
git commit -m "feat: add generated design asset pipeline"
```

### Task 2: Shared Design Tokens, Motion Primitives, and Responsive Navigation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/motion/motion-provider.tsx`
- Create: `src/components/motion/reveal.tsx`
- Create: `src/components/motion/parallax-media.tsx`
- Create: `src/components/nav/mobile-navigation.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/modal.tsx`
- Test: `tests/design-system.test.mjs`

**Interfaces:**
- `MotionProvider({ children })` wraps route content with `reducedMotion="user"`.
- `Reveal` provides once-only viewport entrance with a static reduced-motion state.
- `MobileNavigation` renders a labeled accessible sheet and receives navigation items as serializable props.

- [ ] **Step 1: Write failing design-system tests**

Test for:

- A root skip link target.
- `MotionProvider` using `MotionConfig`.
- `reducedMotion="user"`.
- Semantic company, project, status, surface, focus, spacing, duration, and z-index tokens.
- Minimum 44-pixel control heights in shared form/button primitives.
- A mobile navigation trigger with an accessible name and Escape dismissal.

- [ ] **Step 2: Confirm RED**

Run: `node --test tests/design-system.test.mjs`

- [ ] **Step 3: Implement the token system and motion provider**

Use warm neutral Nobilix tokens as the global base. Keep TrapMan tokens scoped under `.trapman-site`. Render the provider as deep as possible around `children`.

- [ ] **Step 4: Implement reusable motion and navigation primitives**

Keep client boundaries focused. Do not mark page layouts as client components merely to animate descendants.

- [ ] **Step 5: Upgrade shared controls and states**

Add visible focus, pressed, loading, disabled, error, and high-contrast states without breaking existing variants.

- [ ] **Step 6: Verify**

Run:

```powershell
node --test tests/design-system.test.mjs
npm.cmd run lint
npm.cmd test
```

- [ ] **Step 7: Commit**

```powershell
git add src/app/globals.css src/app/layout.tsx src/components/motion src/components/nav/mobile-navigation.tsx src/components/ui tests/design-system.test.mjs
git commit -m "feat: establish responsive motion design system"
```

### Task 3: Nobilix Company Website and Company Legal Experience

**Files:**
- Modify: `src/app/(public)/layout.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/legal/page.tsx`
- Modify: `src/app/(public)/not-found.tsx`
- Modify: `src/components/public/nobilix-header.tsx`
- Modify: `src/components/public/nobilix-footer.tsx`
- Modify: `src/components/public/project-card.tsx`
- Create: `src/components/public/studio-hero.tsx`
- Create: `src/components/public/studio-principles.tsx`
- Create: `src/components/public/project-showcase.tsx`
- Test: `tests/nobilix-redesign.test.mjs`

**Interfaces:**
- Company pages consume the generated Nobilix assets from Task 1.
- Project cards consume the typed project registry and remain future-project ready.

- [ ] **Step 1: Write failing Nobilix route and content tests**

Require:

- Company hero, projects, principles, studio, and contact landmarks.
- A distinct company legal directory.
- Header mobile navigation.
- Corporate legal links and project legal links presented separately.
- Helpful 404 navigation.

- [ ] **Step 2: Confirm RED**

Run: `node --test tests/nobilix-redesign.test.mjs`

- [ ] **Step 3: Implement the animated company shell**

Use generated studio media, editorial asymmetry, restrained acid-lime signals, and Motion reveals. Do not use TrapMan neon styling.

- [ ] **Step 4: Implement the scalable portfolio**

Make TrapMan the primary current project while clearly indicating a growing portfolio without fake project cards.

- [ ] **Step 5: Redesign company legal and 404 pages**

Legal reading width must remain between approximately 60 and 75 characters. Motion is limited to short opacity and position transitions.

- [ ] **Step 6: Verify**

Run:

```powershell
node --test tests/nobilix-redesign.test.mjs
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 7: Commit**

```powershell
git add "src/app/(public)" src/components/public tests/nobilix-redesign.test.mjs
git commit -m "feat: redesign Nobilix studio website"
```

### Task 4: Original Animated TrapMan Marketing World

**Files:**
- Modify: `src/app/(public)/trapman/page.tsx`
- Modify: `src/app/(public)/trapman/layout.tsx`
- Modify: `src/app/(public)/trapman/trapman.css`
- Modify: `src/components/trapman/trapman-header.tsx`
- Modify: `src/components/trapman/city-hero.tsx`
- Replace: `src/components/trapman/city-motion.tsx`
- Modify: `src/components/trapman/gameplay-gallery.tsx`
- Modify: `src/components/trapman/character-showcase.tsx`
- Modify: `src/components/trapman/music-strip.tsx`
- Modify: `src/components/trapman/leaderboard-preview.tsx`
- Create: `src/components/trapman/world-system.tsx`
- Create: `src/components/trapman/shop-showcase.tsx`
- Test: `tests/trapman-redesign.test.mjs`

**Interfaces:**
- Uses generated TrapMan atmosphere assets from Task 1.
- Uses Motion primitives from Task 2.
- Keeps leaderboard data access server-side.

- [ ] **Step 1: Write failing TrapMan experience tests**

Require:

- Hero, run, characters, world, music, shop, leaderboard, account, and support sections.
- Official logo and real screenshot evidence.
- Generated atmosphere assets.
- Motion imports from `motion/react` or `motion/react-client`.
- Reduced-motion and hidden-tab handling.
- No autoplay audio.

- [ ] **Step 2: Confirm RED**

Run: `node --test tests/trapman-redesign.test.mjs`

- [ ] **Step 3: Build the original cinematic hero**

Compose generated city layers, official brand assets, custom HUD elements, and responsive scene choreography. Do not arrange supplied mobile screenshots as the hero.

- [ ] **Step 4: Build all storytelling sections**

Use screenshots only as framed gameplay evidence. Introduce original layouts for character, world, music, shop, leaderboard, account, and support.

- [ ] **Step 5: Implement animation and responsive density**

Desktop receives layered scene depth. Mobile receives a focused vertical run with fewer continuous effects. Reduced motion receives static art with short fades.

- [ ] **Step 6: Verify**

Run:

```powershell
node --test tests/trapman-marketing.test.mjs tests/trapman-redesign.test.mjs
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 7: Commit**

```powershell
git add "src/app/(public)/trapman" src/components/trapman tests/trapman-redesign.test.mjs
git commit -m "feat: rebuild TrapMan as an animated web world"
```

### Task 5: Player Login, Account, Deletion, and Project Legal Pages

**Files:**
- Modify: `src/app/(public)/trapman/account/login/page.tsx`
- Modify: `src/app/(player)/trapman/account/layout.tsx`
- Modify: `src/app/(player)/trapman/account/page.tsx`
- Modify: `src/app/(player)/trapman/account/loading.tsx`
- Modify: `src/app/(player)/trapman/account/error.tsx`
- Modify: `src/components/trapman/account/player-login-form.tsx`
- Modify: `src/components/trapman/account/progression-panel.tsx`
- Modify: `src/components/trapman/account/purchase-history.tsx`
- Modify: `src/components/trapman/account/account-actions.tsx`
- Modify: `src/components/trapman/account/delete-account-form.tsx`
- Modify: `src/app/(public)/trapman/_legal/legal-shell.tsx`
- Modify: `src/app/(public)/trapman/privacy-policy/page.tsx`
- Modify: `src/app/(public)/trapman/data-compliance/page.tsx`
- Modify: `src/app/(public)/trapman/terms-of-use/page.tsx`
- Modify: `src/app/(public)/trapman/delete-account/page.tsx`
- Modify: `src/content/trapman/data-inventory.ts`
- Modify: `src/content/trapman/privacy.ts`
- Modify: `src/content/trapman/compliance.ts`
- Test: `tests/player-redesign.test.mjs`
- Test: `tests/legal-data-inventory.test.mjs`

**Interfaces:**
- Existing player session and deletion functions remain unchanged.
- Legal pages consume `TRAPMAN_DATA_INVENTORY` as their single data source.

- [ ] **Step 1: Write failing player and legal UI contracts**

Require mobile navigation, designed loading/error/empty states, labeled forms, password visibility controls, separated destructive actions, legal contents navigation, and the exact confirmed collection list.

- [ ] **Step 2: Confirm RED**

Run:

```powershell
node --test tests/player-redesign.test.mjs tests/legal-data-inventory.test.mjs
```

- [ ] **Step 3: Redesign login and account surfaces**

Keep server guards and action boundaries intact. Apply restrained TrapMan styling with readable data panels.

- [ ] **Step 4: Redesign deletion and all project legal pages**

Clearly distinguish Firestore records from Analytics events. Describe `ad_closed` accurately without claiming verified completion.

- [ ] **Step 5: Verify security and contracts**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 6: Commit**

```powershell
git add "src/app/(public)/trapman" "src/app/(player)" src/components/trapman/account src/content/trapman tests
git commit -m "feat: redesign TrapMan account and legal experience"
```

### Task 6: Nobilix Console Authentication and Responsive Shell

**Files:**
- Modify: `src/app/console/(auth)/layout.tsx`
- Modify: `src/app/console/(auth)/login/page.tsx`
- Modify: `src/app/console/(auth)/login/login-form.tsx`
- Modify: `src/app/console/(auth)/enroll/page.tsx`
- Modify: `src/app/console/(dashboard)/layout.tsx`
- Modify: `src/app/console/(dashboard)/trapman/layout.tsx`
- Modify: `src/components/nav/topbar.tsx`
- Modify: `src/components/nav/platform-sidebar.tsx`
- Modify: `src/components/nav/project-sidebar.tsx`
- Create: `src/components/nav/console-mobile-nav.tsx`
- Modify: `src/components/page-header.tsx`
- Test: `tests/console-shell-redesign.test.mjs`

**Interfaces:**
- Console layouts continue calling `auth()` server-side.
- Mobile and desktop navigation consume the same module metadata.

- [ ] **Step 1: Write failing shell tests**

Require company-branded auth, visible multi-step progress, responsive navigation, active routes, 44-pixel targets, mobile labels, persistent platform/project orientation, and accessible sign-out.

- [ ] **Step 2: Confirm RED**

Run: `node --test tests/console-shell-redesign.test.mjs`

- [ ] **Step 3: Implement auth redesign**

Preserve the existing server actions and credential flow. Improve form visibility, errors, progress, and recovery.

- [ ] **Step 4: Implement responsive console shell**

Use a calm Nobilix operational visual system and a mobile sheet. Do not style the console as a game menu.

- [ ] **Step 5: Verify**

Run:

```powershell
node --test tests/console-auth-boundary.test.mjs tests/console-routing.test.mjs tests/console-shell-redesign.test.mjs
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 6: Commit**

```powershell
git add src/app/console src/components/nav src/components/page-header.tsx tests/console-shell-redesign.test.mjs
git commit -m "feat: redesign responsive Nobilix console shell"
```

### Task 7: Redesign Every Console Module and Data State

**Files:**
- Modify: `src/app/console/(dashboard)/page.tsx`
- Modify: `src/app/console/(dashboard)/trapman/page.tsx`
- Modify: every page and interactive component below `src/app/console/(dashboard)/trapman/`
- Modify: `src/components/console/project-tile.tsx`
- Modify: `src/components/console/metric-panel.tsx`
- Modify: `src/components/console/live-status.tsx`
- Modify: `src/components/console/attention-panel.tsx`
- Modify: `src/components/stat-card.tsx`
- Modify: `src/components/section-placeholder.tsx`
- Test: `tests/console-modules-redesign.test.mjs`

**Interfaces:**
- Existing query functions and server actions remain the data source.
- Unavailable data continues to render honest unavailable states.

- [ ] **Step 1: Write failing console module tests**

Require each module to expose a page header, primary content region, loading/empty/unavailable treatment, responsive tables or rows, and no fake live values.

- [ ] **Step 2: Confirm RED**

Run: `node --test tests/console-modules-redesign.test.mjs`

- [ ] **Step 3: Redesign platform and project overview**

Prioritize health, change, attention, and next action.

- [ ] **Step 4: Redesign users, leaderboard, messaging, and settings**

Preserve all actions, filters, validations, and confirmation behavior.

- [ ] **Step 5: Redesign analytics, purchases, gameplay, ads, exports, and audit**

Create composed honest empty states where upstream data remains unavailable.

- [ ] **Step 6: Verify**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

- [ ] **Step 7: Commit**

```powershell
git add src/app/console src/components/console src/components/stat-card.tsx src/components/section-placeholder.tsx tests/console-modules-redesign.test.mjs
git commit -m "feat: redesign all console modules"
```

### Task 8: Browser QA, Accessibility, Performance, Documentation, and Push

**Files:**
- Modify as findings require
- Modify: `.Codex/shared/performance-log.md`
- Modify: `.Codex/shared/lessons.md`
- Modify: `.Codex/shared/patterns.md` if present
- Modify: `.Codex/shared/alfred-self-assessment.md`

**Interfaces:**
- Produces final fresh verification evidence and a pushed GitHub branch.

- [ ] **Step 1: Start the production-like local server**

Run: `npm.cmd run dev`

- [ ] **Step 2: Complete browser QA**

Inspect all public routes and representative console routes at 375×812, 768×1024, 1440×900, and mobile landscape. Test keyboard navigation, reduced motion, disconnected Firebase, and media fallback.

- [ ] **Step 3: Fix each observed issue with a failing regression contract**

For every behavioral bug, add or update a test first, confirm failure, implement the fix, and confirm the test passes.

- [ ] **Step 4: Run the full verification gate**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
git diff --check
```

Expected: tests, lint, and build pass; no whitespace errors; audit findings are documented and no new unresolved high-severity issue was introduced by this redesign.

- [ ] **Step 5: Complete Alfred's post-task loop**

Record agents used, outcome, review rounds, lessons, reusable patterns, and orchestration self-assessment.

- [ ] **Step 6: Request final whole-branch review**

Review the full branch against `docs/superpowers/specs/2026-06-24-full-site-console-redesign-design.md`. Fix all Critical and Important findings and re-run the covering tests.

- [ ] **Step 7: Push**

```powershell
git push -u origin codex/full-site-redesign
```

- [ ] **Step 8: Report**

Provide the pushed branch, final commit, generated asset summary, verification commands and outcomes, and any remaining non-blocking operational note.
