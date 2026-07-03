# Media Brief — TrapMan Redesign

> Companion to `docs/art-direction.md`. Describes every media slot in the redesigned
> TrapMan surface: `src/app/(public)/trapman/**` (marketing, account/login, legal),
> `src/app/(player)/trapman/account/**`, and `src/components/trapman/**`.
> Existing generated-asset paths under `/assets/generated/trapman/…` continue to be
> referenced — this brief describes how each should be regenerated to fit the refined
> composition. Real gameplay screenshots under `/assets/trapman/screens/**` are called
> out separately: they are **ground-truth captures, not generated art**, and are not
> regenerated — only re-cropped/re-composited in CSS.

## Global direction for this pass

TrapMan keeps the loud half of the shared universe: full neon, maze grids, glow pulses,
HUD framing — restrained to **max 5 colors per view**, neon as light not fill, yellow
reserved for the single most important spark per screen (leaderboard rank #1, coin/shop
accents). Account, login, and legal surfaces stay on the existing calmer `--tm-calm-*`
register (lower saturation, cyan-only accent) — that split is already correct and is
preserved unchanged in this pass.

**New in this pass:** every marketing section now pairs its generated atmosphere plate
with one real gameplay screenshot, framed as an "evidence" exhibit (HUD-style neon
border, small mono/pixel caption) rather than blended into the background. This restores
authenticity that a prior QA pass had traded away in favor of an all-generated look — per
this round's brief, the real screens are ground truth and should read as proof, not
texture. Generated plates keep doing the atmosphere/mood job; screenshots do the proof job.

---

## 1. City hero — `trapman/city-hero.webp` + `.mp4`, `trapman/city-mobile.webp` + `.mp4`

- **Component:** `src/components/trapman/city-hero.tsx`
- **Rendered size:** desktop full-bleed `100vw` behind the hero copy panel, `min-height:
  min(980px, 100svh - 76px)`, 16:9 source (`1536x864`) `object-fit: cover`,
  `object-position: center 72%`. Mobile (≤820px) swaps to the portrait variant
  (`864x1536`), same full-bleed treatment, `min-height: 940px`.
- **Crop/overlay:** scrim gradient (`.city-hero::before`) plus a perspective grid-mesh
  floor (`.city-hero::after`) layered on top; both unchanged. **New:** the atmosphere
  layer is now wrapped in `ParallaxMedia` (±28px scroll-linked translateY, reduced-motion
  safe) — keep the composition's focal skyline elements away from the extreme top/bottom
  8% of the frame so the parallax travel never clips the spire or waterline out of frame.
- **Mood/content:** unchanged concept — wide Sydney neon skyline, opera-house silhouette
  left, tapering CBD spire centre-right, three-plane parallax depth already baked into the
  video loop.
- **Constraints:** no readable text/UI/logos in the generated plate (unchanged). Must
  hold together at both 320px and 1920px with the hero-copy glass panel overlaid
  top/left and the new evidence thumbnails (see §2) anchored bottom-right.

## 2. Hero evidence thumbnails — `assets/trapman/screens/home-lil-golo.png`, `gameplay.png`

- **Component:** `src/components/trapman/city-hero.tsx` (`.hero-evidence`)
- **Status:** **restored slot** — present in an earlier build, removed by a prior QA pass
  that eliminated all real screenshots in favor of generated-only art; this round's brief
  explicitly calls for real gameplay art used prominently, so it is back.
- **Asset:** real phone-portrait screenshots, native `945x2048` (~9:19.5), not generated.
- **Rendered size:** two thumbnails, `clamp(5.5rem, 10vw, 9rem)` wide each, `aspect-ratio:
  945/2048`, `object-fit: cover; object-position: top center` (crops to the top of the
  screenshot — logo/HUD band — rather than squashing the full tall capture into a small
  box). Desktop: absolutely positioned bottom-right of the hero, `rotate(2deg)`. Mobile
  (≤820px): centered full-width row, `bottom: 2rem`.
- **Crop/overlay:** same HUD-border treatment as generated plates (`2px` cyan border +
  magenta double-shadow) so real captures and generated art read as one continuous
  system, not a jarring insert.
- **Composition constraints:** no changes needed to the source PNGs — crop is handled in
  CSS. If these are ever swapped, prefer captures where the top ~40% of the 2048px-tall
  frame contains clear, unambiguous game identity (logo, character, or HUD), since only
  that band survives the `top center` crop at thumbnail size.

## 3. Gameplay section atmosphere — `trapman/gameplay-atmosphere.webp` + `.mp4`

- **Component:** `src/components/trapman/gameplay-gallery.tsx`
- **Rendered size:** absolutely positioned ambient band behind the three feature cards,
  `height: 18rem`, `opacity: .22`, 16:9 source, unchanged from previous pass.
- **Mood/content:** unchanged — side-scrolling street corridor, no player character, no
  HUD, ambient only (it's a background wash, not a focal image).

## 4. Gameplay proof screenshot — `assets/trapman/screens/gameplay.png` (NEW slot)

- **Component:** `src/components/trapman/gameplay-gallery.tsx` (`.gameplay-proof`)
- **Asset:** real in-game capture, `945x2048`, showing the live HUD (score, level,
  hearts, high score) and maze corridor — exactly the "ground truth" reference this
  round's brief asks for.
- **Rendered size:** `clamp(9rem, 16vw, 13rem)` wide card, full aspect ratio preserved
  (`height: auto`), anchored bottom-right of the feature-card grid, slight
  `rotate(-1.5deg)` for an "exhibit" feel. Pixel-type caption ("Live in-game HUD") sits
  below at `.62rem`.
- **Composition constraints:** none — used as-is, full frame, no crop. This is the single
  most important proof asset on the page; do not replace with a generated plate.

## 5. Characters backdrop — `trapman/characters-plate.webp`

- **Component:** `src/components/trapman/character-showcase.tsx` (`.character-stage__plate`)
- **Rendered size:** full-bleed backdrop behind the two character cards, `100%` width,
  16:9 source, heavy bottom scrim so card text stays legible. Unchanged.
- **Mood/content:** unchanged — empty spotlight podiums, no characters shown (the real
  character art now comes from the screenshot slot below instead).

## 6. Character screenshots — `assets/trapman/screens/home-lil-golo.png`, `home-shotta.png` (NEW slot)

- **Component:** `src/components/trapman/character-showcase.tsx` (`.character-card__screen`)
- **Asset:** real character-select screen captures — each shows the named runner on the
  in-game podium with the TRAP-MAN logotype and city skyline above.
- **Rendered size:** `clamp(4.5rem, 9vw, 6.5rem)` wide thumbnail nested inside each
  character card, right-aligned next to the copy, accent-tinted border matching that
  character's `--char-accent` (cyan for Lil Golo, magenta for Shotta). **Hidden below
  820px** — cards already stack to a single column on mobile and the avatar-letter badge
  carries the identity there; adding a second image would crowd a narrow card and risk
  clipping (acceptance bar §2/§3).
- **Composition constraints:** none — used at native aspect ratio, `object-fit` not
  needed since the frame matches the source ratio.

## 7. World system full-bleed plate — `trapman/world-plate.webp`

- **Component:** `src/components/trapman/world-system.tsx` (`.world-plate`)
- **Rendered size:** full-bleed backdrop, `min-height: 32rem` (26rem mobile), 16:9 source,
  `object-fit: cover`. **New:** wrapped in `ParallaxMedia` (±24px scroll-linked
  translateY) for scroll-scrubbed depth per the motion vocabulary spec (art-direction §5).
- **Crop/overlay:** unchanged two-stop scrim (bottom-heavy + left-heavy) so the copy block
  and chip row stay legible over the image.
- **Mood/content:** unchanged — elevated rooftop route, cyan HUD-style grid overlay,
  distant Opera House silhouette. Keep focal elements (grid overlay lines, skyline) out of
  the extreme top/bottom 6% of frame so parallax travel doesn't clip them at scroll
  extremes.

## 8. Music section atmosphere — `trapman/music-atmosphere.webp` + `.mp4`

- **Component:** `src/components/trapman/music-strip.tsx` (`.music-strip__art`)
- **Rendered size:** `48vw` column (desktop) / `100vw` (mobile, stacks above the player),
  16:9 source, `object-fit: cover`, unchanged.
- **Mood/content:** unchanged — no real music-screen equivalent exists in the current
  screenshot set, so this section stays fully generated-art; no proof slot added here.

## 9. Shop backdrop — `trapman/shop-plate.webp`

- **Component:** `src/components/trapman/shop-showcase.tsx` (`.shop-item-card__plate`,
  first card only)
- **Rendered size:** `24vw` card backdrop at `opacity: .55`, 16:9 source, unchanged.

## 10. Shop proof screenshot — `assets/trapman/screens/shop.png` (NEW slot)

- **Component:** `src/components/trapman/shop-showcase.tsx` (`.shop-proof`)
- **Asset:** real in-game shop screen — four tiles (Remove Ads, Characters, Music, Items)
  in the same cyan/magenta/violet neon language as the marketing page.
- **Rendered size:** `clamp(8rem, 14vw, 11rem)` wide card, centered below the item grid,
  amber/yellow-tinted border (this section's one "yellow spark" beat), pixel-type caption
  ("Real in-game shop").
- **Composition constraints:** none — used at native aspect ratio.

## 11. Leaderboard backdrop — `trapman/leaderboard-plate.webp`

- **Component:** `src/components/trapman/leaderboard-preview.tsx` (`.leaderboard-stage__plate`)
- **Rendered size:** `40vw` column (desktop) / `100vw` (mobile), 16:9 source, unchanged.

## 12. Leaderboard proof screenshot — `assets/trapman/screens/leaderboard.png` (NEW slot)

- **Component:** `src/components/trapman/leaderboard-preview.tsx` (`.leaderboard-stage__proof`)
- **Asset:** real in-game leaderboard screen — ranked list with flags, usernames, scores,
  medal icons for top 3.
- **Rendered size:** `clamp(5.5rem, 11vw, 8rem)` wide, absolutely anchored bottom-right of
  the backdrop plate on desktop; drops to static full-width-centered placement below the
  plate on mobile (≤820px) to avoid overlapping the live ranked table underneath.
- **Composition constraints:** none — used at native aspect ratio.

## 13. Account CTA plate — `trapman/account-cta-plate.webp`

- **Component:** `src/app/(public)/trapman/page.tsx` (`#account` section)
- **Rendered size:** `60vw` (desktop) / `100vw` (mobile) inside the mission-control-framed
  CTA panel, 16:9 source, unchanged from the most recent regeneration (figure-free per the
  last asset-review fix).
- **Mood/content:** unchanged — empty save-point beacon, no figures, calm/hopeful mood.

## 14. Support plate — `trapman/support-plate.webp`

- **Component:** `src/app/(public)/trapman/page.tsx` (`#support` section)
- **Rendered size:** `60vw` (desktop) / `100vw` (mobile), 16:9 source, `filter:
  saturate(.92)` (calmer register per the support/legal-adjacent tone), unchanged.

## 15. Legal header band — `trapman/legal-header-plate.webp`

- **Component:** `src/app/(public)/trapman/_legal/legal-shell.tsx` (`.legal-header__plate`)
- **Rendered size:** short wide banner, `1440x480` source, `object-fit: cover`, `filter:
  saturate(.7) brightness(.62)` + strong scrim for WCAG AA text contrast, unchanged.
- **Used by:** privacy-policy, terms-of-use, data-compliance, delete-account pages (shared
  shell — one asset, four pages).

## 16. Account/login shell plate — `trapman/account-shell-plate.webp`

- **Components:** `src/app/(public)/trapman/account/login/page.tsx`,
  `src/app/(player)/trapman/account/layout.tsx`
- **Rendered size:** full-bleed at `opacity: .16`, heavy scrim, `filter: saturate(.6)
  brightness(.5)` — pure ambience behind the login card / dashboard chrome, unchanged.

---

## Dropped slots

None. Every generated plate from the prior pass remains in use at the same rendered
context; no generated asset was retired.

## New slots (this pass)

Five real-screenshot "proof" placements were added, all sourced from the existing
`public/assets/trapman/screens/**` directory (no new capture needed):

1. Hero evidence — `home-lil-golo.png` + `gameplay.png` (§2)
2. Gameplay proof — `gameplay.png` (§4)
3. Character proof — `home-lil-golo.png` + `home-shotta.png` (§6)
4. Shop proof — `shop.png` (§10)
5. Leaderboard proof — `leaderboard.png` (§12)

`assets/trapman/screens/leaderboard.png` and `shop.png` are each used once; `gameplay.png`
and `home-lil-golo.png` are each used twice (hero + section proof) — both placements are
small enough, and different enough in framing (thumbnail row vs. full-card exhibit), that
the repeat is not visually redundant.

---

# REVISION — 2026-07-03 game-style pass (supersedes the proof-exhibit sections above)

Owner direction: design `/trapman` in the ACTUAL game's visual language, using the four
real screenshots as a **style guide only — never embedded on the page**. Consequences:

1. **All five screenshot "proof" slots above (§2, §4, §6, §10, §12) are DROPPED.** The
   embeds and their CSS were removed. The screenshots stay in the repo purely as style
   reference for designers/asset generation.
2. **The game look is now recreated natively in code** (no new raster assets needed):
   chrome pink→cyan pixel wordmark (`chrome-wordmark.tsx`), animated neon-outline Sydney
   skyline SVG (`neon-skyline.tsx`), HUD chip frames with pixel hearts and leading-zero
   score numerals (`hud-chip.tsx`), cyan maze-line section dividers (`maze-divider.tsx`),
   PLAY-style install CTA (`play-button.tsx`), podium character-select scene
   (`character-showcase.tsx`), in-game-styled player bar + Lonely Souljaz crew section
   (`music-strip.tsx`), game-styled leaderboard board (`leaderboard-preview.tsx`).
3. **Palette shift for future plate regeneration:** the existing generated plates are
   indigo/amber-toned; the game is black-violet / hot magenta / electric cyan with gold
   reserved for scores. `scripts/generate-design-assets.mjs` prompts for
   `trapman-city-hero`, `trapman-city-mobile`, and both city videos have been rewritten
   to the game-accurate palette. Regenerate them (plus any other plate that clashes)
   with `node scripts/generate-design-assets.mjs --generate --only=<ids>` when the
   MuAPI key is available. Until then the pages pull the old plates toward the game
   palette with scoped CSS filters.
4. **NEW future slot — `trapman/characters-loop.mp4`** (+ optional
   `characters-loop-poster.webp`): 5s, 16:9 loop of the two runners idling on the neon
   podium. A commented `<video>` slot is reserved in `character-showcase.tsx`; the CSS
   podium scene is the poster/fallback until the asset exists. Script entry
   `trapman-characters-loop` is ready to generate.
