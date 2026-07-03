# Media Brief — NOBILIX Studio Redesign

> Companion to `docs/art-direction.md`. Describes every media slot in the redesigned
> NOBILIX studio surface (`src/app/(public)/page.tsx`, `legal/**`, `src/components/public/**`).
> Existing asset paths continue to be referenced; this brief describes how each should be
> regenerated to fit the new dark "arcade-luxury" direction. No new slots were added; no
> slots were dropped — all five existing plates plus the hero video remain in use.

## Global direction for this pass

The studio surface now sits on the same `--ink-900` dark substrate as TrapMan (previously
it used a warm-neutral light theme). All five plates below should be regenerated (or
re-graded) toward: **deep obsidian/charcoal base, restrained neon-violet as the structural
light, a single cyan accent seam, no more than a hint of amber/yellow** — never full neon
saturation. Nobilix imagery must stay calmer and lower-density than TrapMan's gameplay art:
think "gallery at night," not "arcade floor."

All plates are wrapped in a `.neon-border` (1px animated conic gradient, cyan → violet →
magenta, `prefers-reduced-motion`-safe — becomes a static violet hairline when reduced) and
sit inside a `border-radius: var(--radius-editorial)` (0.25rem) frame with a soft drop
shadow. Design the source images with a small quiet margin near the edges so the neon
hairline never overlaps busy detail.

---

## 1. Studio hero — `nobilix/studio-hero.webp` + `nobilix/studio-hero.mp4`

- **Component:** `src/components/public/studio-hero.tsx`
- **Rendered size:** desktop ~52vw within a `minmax(20rem, 1fr)` column (roughly 560–760px
  wide at 1440–1920 viewport, 16:9 crop, `posterWidth=1536 posterHeight=864`); mobile 100vw,
  same 16:9 crop, appears below the copy stack (single column under 768px).
- **Crop/overlay:** `object-fit: cover` inside the neon-bordered plate. A CRT scanline
  overlay (`.crt-overlay`, ~3–4% opacity horizontal lines) sits on top at all times — keep
  the image's own contrast high enough that the scanline doesn't muddy it. A glass caption
  chip ("Plate 01 / Studio, in progress") is anchored bottom-inset over the image — keep the
  bottom 15% of the frame calm/dark so the chip stays legible without a heavier scrim.
- **Mood/content:** the isometric city-grid-under-construction concept already on file is
  correct — keep it. For the redesign, push the palette slightly darker/cooler (more
  obsidian, less charcoal-brown) and make the single violet light column the clear focal
  point so it reads immediately at low contrast on a dark page background. Keep the one
  acid-lime/yellow cursor spark as the only warm note — it is the "rarest color" beat for
  this view.
- **Constraints:** must still read at both crop ratios (16:9 wide desktop plate and the same
  16:9 image stacked full-width on mobile — no separate portrait crop needed since the plate
  keeps its aspect ratio at all sizes). No text/UI/logos. The video loop (Kling) should stay
  near-static (gentle pulse + tile materialization only) — no camera movement, to avoid
  fighting the parallax applied via `ParallaxMedia` (±24px scroll-linked translateY).

## 2. Studio principles plate — `nobilix/principles-plate.webp`

- **Component:** `src/components/public/studio-principles.tsx`
- **Rendered size:** desktop ~38vw sticky column (`position: sticky; top: 6rem`) inside a
  `minmax(16rem, .78fr)` track, 16:9 crop at `1536x864`; mobile 100vw, static (sticky is
  dropped under 768px), same crop.
- **Crop/overlay:** plain `object-fit: cover`, neon-border frame, small mono caption below
  ("Studio archive, plate 02") — no overlay on the image itself.
- **Mood/content:** current macro drafting-table/blueprint-corner concept is on-brand for
  "operating principles as infrastructure." Keep the left two-thirds as calm negative space
  per the original prompt, but shift the accent light from acid-lime to a restrained violet
  or cyan hairline to match the new palette discipline (yellow should not appear twice in
  this view — the eyebrow dot already uses yellow above the fold).
- **Constraints:** because the plate is `position: sticky` next to a scrolling text column,
  the image must hold visual interest at a fixed height for longer than a normal viewport
  scroll — avoid a composition that looks "finished" only at one exact crop; a diagonal or
  layered composition reads better while pinned.

## 3. Project showcase transition — `nobilix/project-transition.webp`

- **Component:** `src/components/public/project-showcase.tsx`
- **Rendered size:** desktop ~44vw in a `minmax(16rem, .74fr)` track, native 1440x900 (8:5)
  crop; mobile 100vw, same crop, ordered after the copy (`order: 2`).
- **Crop/overlay:** `object-fit: cover`, neon-border frame, no text overlay — this plate is
  purely the "studio → TrapMan world" visual bridge next to the `ProjectCard`.
  copy block.
- **Mood/content:** keep the existing concept (left obsidian studio space dissolving into
  pixel-art city fragments on the right) — it's the clearest embodiment of "Nobilix holds
  the frame, TrapMan supplies the energy" in the whole page. Tighten the gradient seam to
  cyan→violet (currently violet→cyan) so it reads as a handoff from the calmer studio palette
  into TrapMan's cooler neon, and keep the right-third city fragments desaturated relative to
  actual TrapMan hero art (this is a preview, not the real thing).
- **Constraints:** avoid brightness in the left two-thirds — the `ProjectCard` and CTA text
  sit in the copy column beside it, not on top of the image, so no scrim is needed, but the
  image must not compete for attention with the adjacent copy.

## 4. Contact plate — `nobilix/contact-plate.webp`

- **Component:** `src/app/(public)/page.tsx` (`#contact` section)
- **Rendered size:** desktop ~40vw in a `minmax(18rem, .82fr)` track (order: 2, right side),
  16:9 crop at 1536x864; mobile 100vw, reordered above the copy (`order: -1`).
- **Crop/overlay:** `object-fit: cover`, neon-border frame, no overlay — sits beside (not
  behind) the new contact CTA row (`Open console` / `Company legal` buttons), so the "right
  half must stay empty" constraint from the original prompt is now less critical since there
  is no overlaid form — the image is a standalone plate in its own grid column.
- **Mood/content:** the existing "single lime light beam in a black corridor" concept
  should shift its accent color from acid-lime to violet or cyan to match the page's revised
  restraint (yellow is reserved for the eyebrow dot in this same section — don't double up).
  Keep the "a door is open" quiet/spacious mood; this is the calmest plate on the page and
  should stay that way.
- **Constraints:** none beyond standard contrast/no-clipping; this slot no longer needs a
  guaranteed-empty half since there is no overlaid form field in the new layout.

## 5. Legal header plate — `nobilix/legal-header-plate.webp`

- **Component:** `src/app/(public)/legal/_shell/nobilix-legal-shell.tsx` (shared by
  `/legal`, `/legal/privacy-policy`, `/legal/terms-of-use`)
- **Rendered size:** full shell width (max 82rem container) x capped `max-height: 14rem`,
  1440x480 (3:1) source crop, same crop at all breakpoints (no mobile-specific variant).
- **Crop/overlay:** `object-fit: cover`, now wrapped in `.neon-border` (previously a plain
  hairline border) — a thin traveling gradient seam is a good match for the existing "single
  faint violet hairline" concept, so minimal regeneration is needed here; just confirm the
  base tone is dark enough to sit on `--ink-900` rather than the old warm-neutral canvas.
- **Mood/content:** keep as-is conceptually — extremely quiet architectural cross-section,
  almost entirely negative space, no signage/gavel/scales clichés. This page intentionally
  stays text-first (see the "Nobilix legal pages" comment in `globals.css`) — do not increase
  visual density here even under the new palette.
- **Constraints:** must stay legible with legal metadata (breadcrumb, title, "last updated")
  rendered as plain typography beneath it, never on top of it — no overlay text.

---

## Slot changes

**No slots added or dropped.** All five existing image plates and the one hero video
continue to be used at their current paths, dimensions, and `sizes` values. The redesign is
a palette/mood regrade (light warm-neutral → dark arcade-luxury) plus new frame treatment
(neon-border, CRT scanline on the hero only), not a new information architecture. If a future
pass wants a distinct "console teaser" image behind the new `Open console` contact CTA, that
would be an additive sixth slot — not required for this pass; the CTA currently ships as
plain button chrome.
