# TrapMan Animated Marketing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/trapman` as a premium, responsive pixel-art synthwave marketing experience using the official logo and supplied gameplay captures, with a living animated city and complete reduced-motion behavior.

**Architecture:** The page is primarily server-rendered content with small client animation islands. Layered DOM/CSS scenes provide parallax and motion; requestAnimationFrame is used only for pointer/parallax state. The experience remains complete without JavaScript.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind/CSS, `next/image`, CSS keyframes, IntersectionObserver, requestAnimationFrame.

## Global Constraints

- Preserve the official logo without redrawing, cropping, stretching, or recoloring.
- Preserve authentic pixel-art synthwave identity; no photorealistic cyberpunk.
- Pixel fonts are for short labels only; body copy uses accessible sans-serif.
- Pause animation when hidden or offscreen.
- Support `prefers-reduced-motion`.
- No new animation dependency in the first implementation.
- Use supplied screenshots as first-party marketing assets.

---

## File Structure

- `public/assets/trapman/screens/*` - normalized gameplay captures.
- `src/app/(public)/trapman/page.tsx` - composed marketing page.
- `src/app/(public)/trapman/layout.tsx` - TrapMan metadata and theme wrapper.
- `src/app/(public)/trapman/opengraph-image.tsx` - social preview.
- `src/components/trapman/trapman-header.tsx` - project navigation.
- `src/components/trapman/city-hero.tsx` - hero markup.
- `src/components/trapman/city-motion.tsx` - client motion controller.
- `src/components/trapman/gameplay-gallery.tsx` - real screenshot gallery.
- `src/components/trapman/character-showcase.tsx` - character section.
- `src/components/trapman/music-strip.tsx` - visual music section.
- `src/components/trapman/leaderboard-preview.tsx` - public leaderboard preview.
- `src/app/(public)/trapman/trapman.css` - isolated project styling and keyframes.
- `tests/trapman-marketing.test.mjs` - asset, route, and motion contracts.

### Task 1: Normalize First-Party TrapMan Assets

**Files:**
- Create: `public/assets/trapman/screens/home-lil-golo.png`
- Create: `public/assets/trapman/screens/home-shotta.png`
- Create: `public/assets/trapman/screens/gameplay.png`
- Create: `public/assets/trapman/screens/shop.png`
- Create: `public/assets/trapman/screens/leaderboard.png`
- Create: `tests/trapman-marketing.test.mjs`

- [ ] **Step 1: Add the failing asset test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("official TrapMan marketing assets are present", () => {
  for (const path of [
    "public/assets/trapman-logo.png",
    "public/assets/trapman/screens/home-lil-golo.png",
    "public/assets/trapman/screens/home-shotta.png",
    "public/assets/trapman/screens/gameplay.png",
    "public/assets/trapman/screens/shop.png",
    "public/assets/trapman/screens/leaderboard.png",
  ]) assert.equal(existsSync(resolve(root, path)), true, `${path} missing`);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/trapman-marketing.test.mjs`

Expected: FAIL for missing screenshots.

- [ ] **Step 3: Copy the supplied screenshots**

```powershell
New-Item -ItemType Directory -Force public/assets/trapman/screens | Out-Null
Copy-Item -LiteralPath 'C:\Users\hanan\AppData\Local\Temp\codex-clipboard-f12853e3-4441-4e38-8ddb-6e077338cdf6.png' -Destination 'public/assets/trapman/screens/home-lil-golo.png'
Copy-Item -LiteralPath 'C:\Users\hanan\AppData\Local\Temp\codex-clipboard-37ef3fd3-1b07-415a-b584-af41c1451f6e.png' -Destination 'public/assets/trapman/screens/home-shotta.png'
Copy-Item -LiteralPath 'C:\Users\hanan\AppData\Local\Temp\codex-clipboard-f8b68c7e-c546-4a33-a011-2c65ef5a6770.png' -Destination 'public/assets/trapman/screens/gameplay.png'
Copy-Item -LiteralPath 'C:\Users\hanan\AppData\Local\Temp\codex-clipboard-5e044f53-f7cd-447b-80cc-4463ee4b4468.png' -Destination 'public/assets/trapman/screens/shop.png'
Copy-Item -LiteralPath 'C:\Users\hanan\AppData\Local\Temp\codex-clipboard-3a780fd7-3f09-4c0c-9cdc-e64743118267.png' -Destination 'public/assets/trapman/screens/leaderboard.png'
```

- [ ] **Step 4: Verify dimensions and test**

Run: `node --test tests/trapman-marketing.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add public/assets/trapman tests/trapman-marketing.test.mjs
git commit -m "feat: add official TrapMan marketing assets"
```

### Task 2: Build the TrapMan Layout and Static Content

**Files:**
- Create: `src/app/(public)/trapman/layout.tsx`
- Create: `src/app/(public)/trapman/page.tsx`
- Create: `src/components/trapman/trapman-header.tsx`
- Create: `src/app/(public)/trapman/trapman.css`

- [ ] **Step 1: Add route assertions**

Append to the test:

```js
test("TrapMan marketing route contains required sections", () => {
  const source = readFileSync(resolve(root, "src/app/(public)/trapman/page.tsx"), "utf8");
  for (const id of ["the-run", "characters", "music", "leaderboard", "account", "support"]) {
    assert.match(source, new RegExp(`id="${id}"`));
  }
});
```

Add `readFileSync` to imports.

- [ ] **Step 2: Verify failure**

Run: `node --test tests/trapman-marketing.test.mjs`

- [ ] **Step 3: Create project metadata**

```tsx
// src/app/(public)/trapman/layout.tsx
import type { Metadata } from "next";
import "./trapman.css";

export const metadata: Metadata = {
  title: "TrapMan",
  description: "Run the neon city, climb the leaderboard, and own the night.",
  alternates: { canonical: "/trapman" },
  openGraph: { title: "TrapMan by Nobilix", url: "/trapman", type: "website" },
};

export default function TrapManLayout({ children }: { children: React.ReactNode }) {
  return <div className="trapman-site">{children}</div>;
}
```

- [ ] **Step 4: Build accessible project navigation**

```tsx
// src/components/trapman/trapman-header.tsx
import Image from "next/image";
import Link from "next/link";

export function TrapManHeader() {
  return (
    <header className="trapman-header">
      <Link href="/trapman" aria-label="TrapMan home">
        <Image src="/assets/trapman-logo.png" alt="" width={56} height={56} priority />
        <span>TRAPMAN</span>
      </Link>
      <nav aria-label="TrapMan navigation">
        <Link href="/trapman#the-run">The Run</Link>
        <Link href="/trapman#characters">Characters</Link>
        <Link href="/trapman#leaderboard">Leaderboard</Link>
        <Link href="/trapman/account">My Account</Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 5: Compose the static page**

Create `page.tsx` using semantic sections and these exact IDs:

```tsx
import { TrapManHeader } from "@/components/trapman/trapman-header";
import { CityHero } from "@/components/trapman/city-hero";
import { GameplayGallery } from "@/components/trapman/gameplay-gallery";
import { CharacterShowcase } from "@/components/trapman/character-showcase";
import { MusicStrip } from "@/components/trapman/music-strip";
import { LeaderboardPreview } from "@/components/trapman/leaderboard-preview";

export default function TrapManPage() {
  return (
    <>
      <TrapManHeader />
      <main>
        <CityHero />
        <section id="the-run"><h2>Run the city</h2><GameplayGallery /></section>
        <section id="characters"><h2>Choose your runner</h2><CharacterShowcase /></section>
        <section id="music"><h2>Move to the beat</h2><MusicStrip /></section>
        <section id="leaderboard"><h2>Own the leaderboard</h2><LeaderboardPreview /></section>
        <section id="account"><h2>Your run continues online</h2><a href="/trapman/account">Track my progression</a></section>
        <section id="support"><h2>Player support</h2><a href="/trapman/privacy-policy">Privacy</a><a href="/trapman/delete-account">Delete account</a></section>
      </main>
    </>
  );
}
```

- [ ] **Step 6: Add base TrapMan CSS**

Create CSS variables and layout:

```css
.trapman-site {
  --tm-black: #030207;
  --tm-violet: #8c27ff;
  --tm-magenta: #f144ff;
  --tm-cyan: #39e9ff;
  --tm-yellow: #ffd436;
  min-height: 100vh;
  background: var(--tm-black);
  color: #fff;
  overflow: clip;
}
.trapman-site section { padding: clamp(5rem, 10vw, 10rem) clamp(1.25rem, 6vw, 6rem); }
.trapman-site h2 { font-size: clamp(2.5rem, 7vw, 6rem); line-height: .9; }
.trapman-header { min-height: 76px; display: flex; justify-content: space-between; align-items: center; padding: .75rem clamp(1rem, 4vw, 4rem); }
```

- [ ] **Step 7: Verify and commit**

Run: `node --test tests/trapman-marketing.test.mjs && npm run lint && npm run build`

Commit:

```powershell
git add "src/app/(public)/trapman" src/components/trapman tests/trapman-marketing.test.mjs
git commit -m "feat: build TrapMan marketing structure"
```

### Task 3: Implement the Living City Hero

**Files:**
- Create: `src/components/trapman/city-hero.tsx`
- Create: `src/components/trapman/city-motion.tsx`
- Modify: `src/app/(public)/trapman/trapman.css`

- [ ] **Step 1: Add motion-contract assertions**

Append:

```js
test("city hero includes all required motion layers and reduced motion", () => {
  const hero = readFileSync(resolve(root, "src/components/trapman/city-hero.tsx"), "utf8");
  const css = readFileSync(resolve(root, "src/app/(public)/trapman/trapman.css"), "utf8");
  for (const layer of ["starfield", "far-skyline", "near-skyline", "helicopter", "searchlight", "runner", "scan-platform"]) {
    assert.match(hero, new RegExp(`data-layer="${layer}"`));
  }
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
```

- [ ] **Step 2: Verify failure**

Run: `node --test tests/trapman-marketing.test.mjs`

- [ ] **Step 3: Implement hero markup**

```tsx
// src/components/trapman/city-hero.tsx
import Image from "next/image";
import Link from "next/link";
import { CityMotion } from "./city-motion";

export function CityHero() {
  return (
    <section className="city-hero" aria-labelledby="trapman-title">
      <CityMotion />
      <div className="starfield" data-layer="starfield" aria-hidden="true" />
      <div className="far-skyline" data-layer="far-skyline" aria-hidden="true" />
      <div className="near-skyline" data-layer="near-skyline" aria-hidden="true" />
      <div className="helicopter" data-layer="helicopter" aria-hidden="true">
        <span className="rotor" />
        <span className="searchlight" data-layer="searchlight" />
      </div>
      <div className="hero-copy">
        <Image src="/assets/trapman-logo.png" alt="TrapMan" width={260} height={260} priority />
        <h1 id="trapman-title">The city does not wait.</h1>
        <p>Run. Collect. Climb. Own the night.</p>
        <div><Link href="#the-run">Explore the game</Link><Link href="/trapman/account">My account</Link></div>
      </div>
      <div className="runner-stage" aria-hidden="true">
        <div className="runner" data-layer="runner" />
        <div className="scan-platform" data-layer="scan-platform" />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement the client motion controller**

```tsx
// src/components/trapman/city-motion.tsx
"use client";

import { useEffect } from "react";

export function CityMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".city-hero");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${event.clientX / innerWidth - 0.5}`);
        root.style.setProperty("--pointer-y", `${event.clientY / innerHeight - 0.5}`);
      });
    };
    const onVisibility = () => root.toggleAttribute("data-paused", document.hidden);
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}
```

- [ ] **Step 5: Add exact animation behavior**

In CSS define:

```css
.city-hero { position: relative; min-height: 900px; isolation: isolate; }
.far-skyline { animation: far-drift 36s ease-in-out infinite alternate; }
.near-skyline { animation: near-drift 24s ease-in-out infinite alternate; }
.helicopter { animation: helicopter-flight 18s linear infinite; }
.rotor { animation: rotor-spin .18s linear infinite; }
.searchlight { transform-origin: top center; animation: search-sweep 4.8s ease-in-out infinite alternate; }
.runner { animation: runner-idle 2.2s steps(4) infinite; }
.scan-platform::before { animation: platform-scan 2.4s linear infinite; }
.city-hero[data-paused] * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .city-hero * { animation: none !important; transform: none !important; }
}
```

Define keyframes with transforms only. Ensure the searchlight layer has `pointer-events:none` and never crosses `.hero-copy` through masking or z-index placement.

- [ ] **Step 6: Verify**

Run: `node --test tests/trapman-marketing.test.mjs && npm run lint && npm run build`

Use browser at 375x812, 768x1024, and 1440x900. Verify no copy obstruction and reduced-motion static state.

- [ ] **Step 7: Commit**

```powershell
git add src/components/trapman/city-hero.tsx src/components/trapman/city-motion.tsx "src/app/(public)/trapman/trapman.css" tests/trapman-marketing.test.mjs
git commit -m "feat: animate the TrapMan city hero"
```

### Task 4: Build Gameplay, Character, Music, and Leaderboard Sections

**Files:**
- Create: `src/components/trapman/gameplay-gallery.tsx`
- Create: `src/components/trapman/character-showcase.tsx`
- Create: `src/components/trapman/music-strip.tsx`
- Create: `src/components/trapman/leaderboard-preview.tsx`
- Modify: `src/app/(public)/trapman/trapman.css`

- [ ] **Step 1: Implement screenshot gallery**

Use `next/image` with explicit sizes and captions. Include all five supplied captures, never decorative fake screenshots.

- [ ] **Step 2: Implement character showcase**

Use `home-lil-golo.png` and `home-shotta.png` as source material in two cards with readable names and descriptions. Do not promise playable characters not confirmed by the game.

- [ ] **Step 3: Implement music strip**

Render a non-autoplay visual player. If licensed audio files are not present, display "Music preview coming soon" rather than fake controls.

- [ ] **Step 4: Implement public leaderboard preview**

Call `listLeaderboard(5, 0)` in a Server Component. Display only rank, display name, country, and score. On connection failure, show a designed unavailable state.

- [ ] **Step 5: Add entrance behavior**

Use CSS `@starting-style` or an IntersectionObserver client helper for once-only opacity/translate reveals. Reduced-motion must show content immediately.

- [ ] **Step 6: Verify**

Run: `npm test && npm run lint && npm run build`

Check all images preserve aspect ratio and have alt text or empty alt when decorative.

- [ ] **Step 7: Commit**

```powershell
git add src/components/trapman "src/app/(public)/trapman/trapman.css"
git commit -m "feat: complete TrapMan marketing sections"
```

### Task 5: Social Metadata, Performance, and Accessibility Gate

**Files:**
- Create: `src/app/(public)/trapman/opengraph-image.tsx`
- Modify: `src/app/(public)/trapman/page.tsx`
- Modify: `src/app/(public)/trapman/trapman.css`

- [ ] **Step 1: Generate an OG image using `ImageResponse`**

Use flexbox only and include the existing logo, black/violet background, and text "TRAPMAN · RUN THE CITY".

- [ ] **Step 2: Add skip link and landmarks**

Add `<a className="skip-link" href="#trapman-main">Skip to content</a>` and `id="trapman-main"` to the main element.

- [ ] **Step 3: Verify motion and performance**

Run production build and inspect:

- Hero logo uses `priority`.
- Below-fold screenshots lazy load.
- No layout shift from images.
- No looping animation changes layout properties.
- Hidden-tab animation pauses.

- [ ] **Step 4: Run final checks**

Run: `npm test && npm run lint && npm run build`

- [ ] **Step 5: Commit**

```powershell
git add "src/app/(public)/trapman" src/components/trapman
git commit -m "chore: harden TrapMan marketing experience"
```
