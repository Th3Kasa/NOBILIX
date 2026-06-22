# Nobilix Platform and Public Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static public-site rewrites with a typed App Router foundation for Nobilix, project-scoped routes, shared public layouts, canonical redirects, and a reusable project registry.

**Architecture:** Public routes become Server Components under route groups, while `/console` keeps its existing Auth.js boundary. A typed registry defines project identity and enabled surfaces. Project-specific pages consume registry data without reading credentials or Firebase at build time.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript strict, Tailwind CSS 4, Node test runner, `next/image`, Next.js Metadata API.

## Global Constraints

- Nobilix is the parent company; TrapMan is one project.
- Canonical public URLs are lowercase.
- Every administrator sees every project; this plan does not migrate console modules yet.
- No date-of-birth field or age gate.
- Keep `public/assets/trapman-logo.png` unchanged.
- Do not commit credentials or `trap-man-*.json`.
- WCAG 2.2 AA, keyboard navigation, 44px mobile targets, reduced-motion support.
- Public LCP target is below 2.5 seconds; CLS target is below 0.1.
- Read installed Next.js documentation before changing routing, metadata, images, proxy, or auth.

---

## File Structure

- `src/config/projects.ts` - typed, secret-free project registry.
- `src/types/projects.ts` - project registry domain types.
- `src/components/public/nobilix-header.tsx` - company-level public navigation.
- `src/components/public/nobilix-footer.tsx` - company footer and project legal links.
- `src/components/public/project-card.tsx` - portfolio project card.
- `src/app/(public)/layout.tsx` - public route-group layout.
- `src/app/(public)/page.tsx` - Nobilix homepage.
- `src/app/(public)/legal/page.tsx` - Nobilix legal directory.
- `src/app/(public)/not-found.tsx` - branded public 404.
- `src/app/robots.ts` - robots rules.
- `src/app/sitemap.ts` - public sitemap.
- `src/app/layout.tsx` - neutral root metadata and font setup.
- `src/app/globals.css` - shared tokens plus scoped public styles.
- `next.config.ts` - remove static rewrites and add legacy redirects.
- `tests/project-registry.test.mjs` - registry contract.
- `tests/public-routes.test.mjs` - route and redirect contract.

### Task 1: Add the Typed Project Registry

**Files:**
- Create: `src/types/projects.ts`
- Create: `src/config/projects.ts`
- Create: `tests/project-registry.test.mjs`

**Interfaces:**
- Produces: `ProjectDefinition`, `ProjectSlug`, `PROJECTS`, `getProject(slug)`.

- [ ] **Step 1: Write the failing registry contract test**

```js
// tests/project-registry.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("project registry defines TrapMan without secrets", () => {
  const source = read("src/config/projects.ts");
  assert.match(source, /slug:\s*"trapman"/);
  assert.match(source, /publicPath:\s*"\/trapman"/);
  assert.match(source, /accountPath:\s*"\/trapman\/account"/);
  assert.match(source, /privacy:\s*"\/trapman\/privacy-policy"/);
  assert.doesNotMatch(source, /private_key|client_email|apiKey|password/i);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/project-registry.test.mjs`

Expected: FAIL because `src/config/projects.ts` does not exist.

- [ ] **Step 3: Create the registry types**

```ts
// src/types/projects.ts
export type ProjectSlug = "trapman";

export type ConsoleModule =
  | "overview"
  | "users"
  | "leaderboard"
  | "purchases"
  | "analytics"
  | "gameplay"
  | "ads"
  | "messaging"
  | "exports"
  | "audit"
  | "settings";

export interface ProjectDefinition {
  slug: ProjectSlug;
  name: string;
  kind: "game" | "application" | "crm";
  status: "live" | "development" | "planned";
  description: string;
  logoPath: string;
  publicPath: string;
  accountPath: string | null;
  legal: {
    privacy: string;
    terms: string;
    compliance: string;
    deletion: string;
  };
  consoleModules: readonly ConsoleModule[];
  collections: {
    users: string;
    leaderboard: string;
    purchases: string;
    progress: string;
  };
}
```

- [ ] **Step 4: Create the registry**

```ts
// src/config/projects.ts
import type { ProjectDefinition, ProjectSlug } from "@/types/projects";

export const PROJECTS = {
  trapman: {
    slug: "trapman",
    name: "TrapMan",
    kind: "game",
    status: "live",
    description: "A neon pixel-art city chase built by Nobilix.",
    logoPath: "/assets/trapman-logo.png",
    publicPath: "/trapman",
    accountPath: "/trapman/account",
    legal: {
      privacy: "/trapman/privacy-policy",
      terms: "/trapman/terms-of-use",
      compliance: "/trapman/data-compliance",
      deletion: "/trapman/delete-account",
    },
    consoleModules: [
      "overview",
      "users",
      "leaderboard",
      "purchases",
      "analytics",
      "gameplay",
      "ads",
      "messaging",
      "exports",
      "audit",
      "settings",
    ],
    collections: {
      users: "users",
      leaderboard: "leaderboard",
      purchases: "purchases",
      progress: "player_progress",
    },
  },
} as const satisfies Record<ProjectSlug, ProjectDefinition>;

export function getProject(slug: ProjectSlug): ProjectDefinition {
  return PROJECTS[slug];
}
```

- [ ] **Step 5: Run the test and type-check**

Run: `node --test tests/project-registry.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/types/projects.ts src/config/projects.ts tests/project-registry.test.mjs
git commit -m "feat: add Nobilix project registry"
```

### Task 2: Replace Static Rewrites with Canonical Redirects

**Files:**
- Modify: `next.config.ts`
- Create: `tests/public-routes.test.mjs`

**Interfaces:**
- Consumes: project routes established by Task 1.
- Produces: permanent legacy redirects without public HTML rewrites.

- [ ] **Step 1: Write the failing redirect test**

```js
// tests/public-routes.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "next.config.ts"), "utf8");

test("legacy TrapMan legal URLs redirect to project-scoped routes", () => {
  assert.match(source, /source:\s*"\/privacy-policy"[\s\S]*destination:\s*"\/trapman\/privacy-policy"/);
  assert.match(source, /source:\s*"\/terms-of-use"[\s\S]*destination:\s*"\/trapman\/terms-of-use"/);
  assert.match(source, /source:\s*"\/data-compliance"[\s\S]*destination:\s*"\/trapman\/data-compliance"/);
  assert.match(source, /source:\s*"\/delete-account"[\s\S]*destination:\s*"\/trapman\/delete-account"/);
  assert.doesNotMatch(source, /destination:\s*"\/site\//);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `node --test tests/public-routes.test.mjs`

Expected: FAIL because static rewrites remain.

- [ ] **Step 3: Replace rewrites with redirects**

```ts
// next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/trapman/privacy-policy", permanent: true },
      { source: "/terms-of-use", destination: "/trapman/terms-of-use", permanent: true },
      { source: "/data-compliance", destination: "/trapman/data-compliance", permanent: true },
      { source: "/delete-account", destination: "/trapman/delete-account", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Run routing tests**

Run: `node --test tests/public-routes.test.mjs tests/firebase-runtime-boundaries.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add next.config.ts tests/public-routes.test.mjs
git commit -m "feat: add project-scoped public redirects"
```

### Task 3: Build the Shared Public Shell

**Files:**
- Create: `src/components/public/nobilix-header.tsx`
- Create: `src/components/public/nobilix-footer.tsx`
- Create: `src/app/(public)/layout.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `PROJECTS`.
- Produces: public header/footer used by Nobilix pages; neutral root layout that does not force console-only robots metadata.

- [ ] **Step 1: Add a structural test**

Append to `tests/public-routes.test.mjs`:

```js
test("public shell is separated from the console shell", () => {
  const publicLayout = readFileSync(resolve(root, "src/app/(public)/layout.tsx"), "utf8");
  const rootLayout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
  assert.match(publicLayout, /NobilixHeader/);
  assert.match(publicLayout, /NobilixFooter/);
  assert.doesNotMatch(rootLayout, /robots:\s*\{\s*index:\s*false/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/public-routes.test.mjs`

Expected: FAIL because the public layout does not exist.

- [ ] **Step 3: Implement the header**

```tsx
// src/components/public/nobilix-header.tsx
import Link from "next/link";

export function NobilixHeader() {
  return (
    <header className="public-header">
      <Link className="public-wordmark" href="/">NOBILIX</Link>
      <nav aria-label="Primary navigation">
        <Link href="/#projects">Projects</Link>
        <Link href="/legal">Legal</Link>
        <Link href="/console">Console</Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Implement the footer**

```tsx
// src/components/public/nobilix-footer.tsx
import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export function NobilixFooter() {
  const trapman = PROJECTS.trapman;
  return (
    <footer className="public-footer">
      <div>
        <strong>NOBILIX</strong>
        <p>Nobilix Pty Ltd · New South Wales, Australia</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/legal">Company legal</Link>
        <Link href={trapman.legal.privacy}>TrapMan privacy</Link>
        <Link href={trapman.legal.terms}>TrapMan terms</Link>
        <Link href={trapman.legal.deletion}>Delete account</Link>
      </nav>
    </footer>
  );
}
```

- [ ] **Step 5: Add the public layout and neutral root metadata**

```tsx
// src/app/(public)/layout.tsx
import { NobilixFooter } from "@/components/public/nobilix-footer";
import { NobilixHeader } from "@/components/public/nobilix-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <NobilixHeader />
      <main>{children}</main>
      <NobilixFooter />
    </div>
  );
}
```

Update `src/app/layout.tsx` metadata to:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://nobilix.vercel.app"),
  title: { default: "Nobilix", template: "%s · Nobilix" },
  description: "Nobilix builds distinctive games and digital products.",
};
```

- [ ] **Step 6: Add scoped public CSS**

Append to `src/app/globals.css`:

```css
.public-shell {
  min-height: 100vh;
  background: #07090d;
  color: #f4f0e8;
}
.public-header,
.public-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.25rem clamp(1.25rem, 4vw, 4rem);
  border-color: rgb(255 255 255 / 0.1);
}
.public-header { border-bottom-width: 1px; }
.public-footer { border-top-width: 1px; flex-wrap: wrap; }
.public-header nav,
.public-footer nav { display: flex; flex-wrap: wrap; gap: 1rem; }
.public-header a,
.public-footer a { min-height: 44px; display: inline-flex; align-items: center; }
.public-wordmark { font-weight: 800; letter-spacing: 0.18em; }
```

- [ ] **Step 7: Verify**

Run: `node --test tests/public-routes.test.mjs && npm run lint && npm run build`

Expected: PASS; `/console` still builds.

- [ ] **Step 8: Commit**

```powershell
git add src/components/public "src/app/(public)" src/app/layout.tsx src/app/globals.css tests/public-routes.test.mjs
git commit -m "feat: add Nobilix public shell"
```

### Task 4: Build the Nobilix Homepage and Legal Directory

**Files:**
- Create: `src/components/public/project-card.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/legal/page.tsx`
- Create: `src/app/(public)/not-found.tsx`

**Interfaces:**
- Consumes: `ProjectDefinition`, `PROJECTS`.
- Produces: company homepage and legal directory.

- [ ] **Step 1: Add page-existence assertions**

Append to `tests/public-routes.test.mjs`:

```js
test("Nobilix public routes are App Router pages", () => {
  for (const path of [
    "src/app/(public)/page.tsx",
    "src/app/(public)/legal/page.tsx",
    "src/app/(public)/not-found.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, path)), true, `${path} must exist`);
  }
});
```

Add `existsSync` to the test imports.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/public-routes.test.mjs`

Expected: FAIL for missing pages.

- [ ] **Step 3: Implement the project card**

```tsx
// src/components/public/project-card.tsx
import Image from "next/image";
import Link from "next/link";
import type { ProjectDefinition } from "@/types/projects";

export function ProjectCard({ project }: { project: ProjectDefinition }) {
  return (
    <article className="project-card">
      <Image src={project.logoPath} alt="" width={112} height={112} />
      <p>{project.kind} · {project.status}</p>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <Link href={project.publicPath}>Enter {project.name}</Link>
    </article>
  );
}
```

- [ ] **Step 4: Implement the homepage**

```tsx
// src/app/(public)/page.tsx
import type { Metadata } from "next";
import { ProjectCard } from "@/components/public/project-card";
import { PROJECTS } from "@/config/projects";

export const metadata: Metadata = {
  title: "Independent digital worlds",
  description: "Nobilix builds games and digital products with distinct identities.",
  alternates: { canonical: "/" },
};

export default function NobilixHomePage() {
  return (
    <>
      <section className="nobilix-hero">
        <p>Independent studio · Sydney</p>
        <h1>Build worlds. Read signals.</h1>
        <p>Distinctive products, built as complete identities.</p>
      </section>
      <section id="projects" className="nobilix-projects" aria-labelledby="projects-title">
        <h2 id="projects-title">Current projects</h2>
        <ProjectCard project={PROJECTS.trapman} />
      </section>
    </>
  );
}
```

- [ ] **Step 5: Implement the legal directory**

```tsx
// src/app/(public)/legal/page.tsx
import Link from "next/link";
import { PROJECTS } from "@/config/projects";

export default function LegalDirectoryPage() {
  const project = PROJECTS.trapman;
  return (
    <section className="legal-directory">
      <p>Nobilix company legal</p>
      <h1>Legal and project policies</h1>
      <p>Each Nobilix project maintains its own product-specific terms and data disclosures.</p>
      <article>
        <h2>{project.name}</h2>
        <Link href={project.legal.privacy}>Privacy Policy</Link>
        <Link href={project.legal.terms}>Terms of Use</Link>
        <Link href={project.legal.compliance}>Data &amp; Compliance</Link>
        <Link href={project.legal.deletion}>Delete Account</Link>
      </article>
    </section>
  );
}
```

- [ ] **Step 6: Implement the 404**

```tsx
// src/app/(public)/not-found.tsx
import Link from "next/link";

export default function PublicNotFound() {
  return (
    <section className="public-not-found">
      <p>404</p>
      <h1>This world does not exist.</h1>
      <Link href="/">Return to Nobilix</Link>
    </section>
  );
}
```

- [ ] **Step 7: Add responsive page styles**

Add focused classes to `src/app/globals.css` for `.nobilix-hero`, `.nobilix-projects`, `.project-card`, `.legal-directory`, and `.public-not-found`, using:

```css
.nobilix-hero {
  min-height: 72svh;
  display: grid;
  align-content: center;
  padding: clamp(5rem, 12vw, 10rem) clamp(1.25rem, 7vw, 7rem);
}
.nobilix-hero h1 {
  max-width: 12ch;
  font-size: clamp(3.75rem, 10vw, 9rem);
  line-height: 0.88;
  letter-spacing: -0.065em;
}
.nobilix-projects,
.legal-directory,
.public-not-found {
  padding: clamp(4rem, 8vw, 8rem) clamp(1.25rem, 7vw, 7rem);
}
.project-card {
  margin-top: 2rem;
  max-width: 56rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid rgb(255 255 255 / 0.12);
}
```

- [ ] **Step 8: Verify**

Run: `node --test tests/*.test.mjs && npm run lint && npm run build`

Expected: all checks PASS; build output includes `/`, `/legal`, and existing console routes.

- [ ] **Step 9: Commit**

```powershell
git add src/components/public/project-card.tsx "src/app/(public)/page.tsx" "src/app/(public)/legal" "src/app/(public)/not-found.tsx" src/app/globals.css tests/public-routes.test.mjs
git commit -m "feat: build Nobilix public foundation"
```

### Task 5: Add Sitemap, Robots, and Smoke Verification

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `.gitignore`
- Test: `tests/public-routes.test.mjs`

- [ ] **Step 1: Add metadata-route assertions**

Append:

```js
test("public metadata routes exist and preview artifacts stay ignored", () => {
  assert.equal(existsSync(resolve(root, "src/app/sitemap.ts")), true);
  assert.equal(existsSync(resolve(root, "src/app/robots.ts")), true);
  assert.match(readFileSync(resolve(root, ".gitignore"), "utf8"), /^\.superpowers\/$/m);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/public-routes.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement sitemap and robots**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { PROJECTS } from "@/config/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const trapman = PROJECTS.trapman;
  const paths = [
    "/",
    "/legal",
    trapman.publicPath,
    trapman.legal.privacy,
    trapman.legal.terms,
    trapman.legal.compliance,
    trapman.legal.deletion,
  ];
  return paths.map((path) => ({
    url: new URL(path, "https://nobilix.vercel.app").toString(),
    lastModified: new Date(),
  }));
}
```

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/console/", "/trapman/account/"] }],
    sitemap: "https://nobilix.vercel.app/sitemap.xml",
  };
}
```

Add to `.gitignore`:

```gitignore
.superpowers/
trap-man-*.json
```

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 5: Local browser smoke test**

Run: `npm run dev`

Verify:

- `/` renders Nobilix.
- `/legal` lists TrapMan legal links.
- `/privacy-policy` redirects to `/trapman/privacy-policy` once the legal plan is implemented; until then it may resolve to a planned 404.
- `/console/login` remains accessible.
- `/console` remains protected.

- [ ] **Step 6: Commit**

```powershell
git add src/app/sitemap.ts src/app/robots.ts .gitignore tests/public-routes.test.mjs
git commit -m "chore: add public metadata and artifact guards"
```

## Phase Completion Gate

Run:

```powershell
npm test
npm run lint
npm run build
git status --short
```

Expected:

- All tests pass.
- Lint passes.
- Production build passes.
- Only intentional files are tracked.
- No service-account JSON is staged.
