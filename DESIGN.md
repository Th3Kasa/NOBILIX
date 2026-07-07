---
name: Nobilix / TrapMan
description: Retro-arcade soul, premium execution. Dark ink substrate carrying neon as light, not fill. Three coordinated systems — editorial studio, neon arcade, graphite control station — sharing standards, never decoration.

# Values mirror src/app/globals.css, src/app/(public)/trapman/trapman.css, and
# docs/art-direction.md verbatim. Those files are the source of truth; this
# frontmatter is the portable export. If a token changes there, update both.
colors:
  # Ink substrate (all surfaces)
  ink-void: "#030207"        # deepest ground (TrapMan --tm-black)
  ink-900: "#07090d"         # page ground
  ink-800: "#0b0e14"         # raised panels
  paper: "#f4f0e8"           # primary text

  # Neon accents (light, not fill — max 5 active colors per view)
  neon-violet: "#8c27ff"     # primary accent
  neon-magenta: "#f144ff"    # hover / energy
  neon-cyan: "#39e9ff"       # lines, data, links
  neon-yellow: "#ffd436"     # rarest spark

  # TrapMan calm variant (utility content inside the loud page)
  tm-calm-ink: "#d7f6ff"
  tm-calm-border: "rgb(57 233 255 / .16)"

  # Console (scoped to .console-shell — never leaks to public surfaces)
  console-live: "#9de43a"    # healthy / positive
  console-action: "#ff632f"  # needs attention / destructive
  console-violet: "#9b5cff"  # console primary
---

# Design

Source of truth: `docs/art-direction.md` (canonical direction), `src/app/globals.css`
(studio + console tokens), `src/app/(public)/trapman/trapman.css` (TrapMan tokens).
Strategy and register live in `PRODUCT.md`.

## Color

- Dark-first. The `dark` class is the only theme; light tokens are unreachable by design.
- **Max 5 active colors per view.** Neon is applied as glow, hairline, or text — not fills.
- Yellow is the rarest color on any page. Console status colors stay inside `.console-shell`.
- No pure `#000`/`#fff` for new surfaces; use the ink ramp. No gray text on colored grounds.

## Typography (three strict roles + one editorial voice)

- **Press Start 2P** (`--font-pixel`) — logo, hero words, kickers, scores. Short strings only.
- **Geist** (`--font-sans`) — all body/UI. ≥16px, line-height ≥1.6, measure ~65–75ch.
- **Geist Mono** (`--font-mono`) — telemetry, data, timestamps.
- **Fraunces** (`--font-display`) — Nobilix editorial headlines only; never on TrapMan or console.

## Surfaces & texture

Glassmorphism panels (blur 12px + 1px neon hairline), slow traveling gradient borders,
subtle CRT scanline (reduced-motion safe), perspective grid mesh. Cards are never nested.

## Motion — two-tier budget

| Tier | Surfaces | Rules |
|---|---|---|
| **Expressive** | `/`, `/trapman`, `/legal/*` heroes and section reveals | Entrances/scroll reveals up to ~700ms; ease-out only; stagger 30–80ms; parallax and SVG path draws allowed |
| **Strict** | `/console/*`, `/trapman/account/*`, all controls everywhere | <300ms; feedback 100–160ms; dropdowns/dialogs 150–250ms; no decorative loops; no page-load choreography |

Both tiers: animate **only `transform` and `opacity`**; never `ease-in`; no bounce/elastic;
never `scale(0)` entrances (start ≥0.95); popovers origin-aware, modals center-origin;
interruptible (transitions/springs, not keyframes) for rapidly-triggered elements;
`prefers-reduced-motion` = gentler not zero (keep opacity/color, drop movement);
hover motion gated behind `@media (hover:hover) and (pointer:fine)`.

## Layout & spacing

4pt base scale. Tight groups 8–12px; section separation 48–96px (TrapMan sections use
`clamp(5rem,10vw,10rem)` vertical padding). `min-h-[100dvh]` not `h-screen`. Grid for 2D,
flex for 1D. Console uses the 12-col `console-page-grid` system.

## Components

Console/UI primitives live in `src/components/ui/*` (button with loading state, modal with
focus trap, switch, input, badge, card, label, textarea) — reuse them; don't hand-roll
controls. Motion primitives: `src/components/motion/{reveal,parallax-media,cinematic-video}`.
Every interactive element ships all 8 states (default/hover/focus/active/disabled/loading/
error/success). Skeletons, not spinners. Destructive actions always confirm and are never
hover-only.

## States & honesty

Loading (layout-matching skeleton), empty, error, disconnected, and coming-soon states are
designed, not defaulted. Data that doesn't exist is never faked — caps ("first 1,000 scanned
players"), disconnected sources, and pending store listings say so in plain language.

## Accessibility

WCAG 2.2 AA. Contrast ≥4.5:1 body / ≥3:1 large. 44×44px targets. Visible `:focus-visible`
(2–3px, offset). `scope="col"` on table headers, `aria-sort` when sortable, `aria-current`
for location, `sr-only` text wherever meaning is conveyed by color/emoji alone.
