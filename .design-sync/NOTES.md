# design-sync notes — NOBILIX

- This is a Next.js **app**, not a packaged library: no `dist/`, no `main`/`module` in
  package.json. The converter runs in synth-entry mode discovering PascalCase exports
  from `srcDir: "src/components"`.
- **CSS comes from the app's own production build.** `buildCmd` is
  `npm run build && node .design-sync/prep-css.mjs`: the prep script concatenates
  `.next/static/chunks/*.css`, copies the next/font woff2 files out of
  `.next/static/media/`, rewrites their URLs, and re-declares the `--font-*` variables
  on `:root` (next/font sets them via generated classes on `<html>` that previews never
  have). Never point cssEntry at the raw `src/app/globals.css` — it contains Tailwind v4
  directives browsers can't parse.
- **`DSProvider`** (`.design-sync/shims/ds-provider.tsx`, wired via `extraEntries` +
  `provider`) supplies stub app-router/pathname/searchParams/image-config contexts —
  16 components import `next/link`/`next/image`/`next/navigation` and throw or break
  outside the Next runtime without them. It also applies the `dark` class (app is
  dark-only, hardcoded on `<html>`).
- Surface scoping matters for previews: wrap public-site components in
  `.public-shell`, console components in `.console-shell` (tokens/re-themes are scoped
  to those classes in the compiled CSS). Neither is applied globally by DSProvider.
- Media-bound public components (StudioHero, StudioPrinciples, CinematicVideo) reference
  `/assets/...` files that don't ship with the bundle — user accepted degraded media on
  2026-07-09. CinematicVideo's src/poster are props, so its authored preview can point
  at a relocated asset; StudioHero/StudioPrinciples have hardcoded asset paths.
- OneDrive locks `.git/worktrees/*` metadata (harmless errors on worktree cleanup) and
  previously broke `git stash` file restores — avoid stash on this checkout; prefer
  worktrees outside OneDrive only for read-only verification.
- No playwright/chromium cache existed on this machine as of first sync (Edge is
  installed; Chrome is not).
