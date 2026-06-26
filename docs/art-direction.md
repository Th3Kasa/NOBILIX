# Nobilix × TrapMan — Art Direction Brief

> Phase 0 deliverable. This is the single source of truth for the redesign. Every later
> phase (design tokens, public hub, console, imagery, responsive) must trace back here.
> Goal: a bespoke, award-tier result that reads as **premium retro-arcade**, not AI-generic.

## 1. Brand essence

Nobilix is a **retro-arcade game studio**. The identity is Pac-Man / Mario / 16-bit:
neon mazes, CRT glow, pixel wordmarks, coin-op optimism — but executed with restraint,
depth, and craft so it feels like a $50k–$100k flagship, not a template.

**One line:** _Premium execution of a retro-arcade soul._

Two moods, one universe (shared dark substrate so scroll feels continuous):
- **Nobilix (studio):** calmer, more spacious, "arcade-luxury." Lower neon density, more
  black, confident negative space, editorial pacing.
- **TrapMan (game):** saturated, kinetic, playful. Full neon, maze grids, glow pulses,
  HUD framing — the energy of the in-game screenshots.

## 2. Color system

Dark substrate first; neon used as accent light, never as flat fills behind text.

| Token | Value | Use |
|---|---|---|
| `--ink-void` | `#030207` | deepest background |
| `--ink-900` | `#07090d` | base page background (public shell already uses this) |
| `--ink-800` | `#0b0e14` | raised surface base |
| `--neon-violet` | `#8c27ff` | primary accent / structure |
| `--neon-magenta` | `#f144ff` | hot accent / hover / energy |
| `--neon-cyan` | `#39e9ff` | maze lines / data / links |
| `--neon-yellow` | `#ffd436` | rare highlight / coin / CTA spark |
| `--paper` | `#f4f0e8` | primary text on dark |

Rules:
- **Max 5 colors** active in any one view (console included).
- Neon appears as **light**: glows, thin borders, line-art, glints — not large solid areas.
- Yellow is the rarest color: reserve for the single most important spark per screen.
- Maintain the existing scoped `.trapman-site` OKLCH identity; map the hex ramp above to
  matching custom properties in `globals.css` so both systems agree.

### Glow ramp (drop-shadow / box-shadow tokens)
- `--glow-violet`, `--glow-magenta`, `--glow-cyan`, `--glow-yellow`: layered soft + tight
  shadows, e.g. `0 0 1px <c>, 0 0 8px color-mix(in oklch, <c> 60%, transparent)`.

## 3. Typography

Three roles, strict separation:

1. **Display / brand (pixel):** `Press Start 2P` (Google Fonts, via `next/font/google`),
   variable `--font-pixel`. Use ONLY for: logo/wordmark, hero word(s), section kickers,
   score-style numerals, console module labels. Short strings only. Generous letter
   spacing, large sizes, never wrapped past ~2 lines.
2. **Body / UI:** `Geist` (already loaded), `--font-geist-sans`. All paragraphs, buttons,
   labels, nav, forms. Min 16px body, line-height ≥ 1.6, measure capped ~68ch.
3. **Telemetry / data (mono):** `Geist Mono`, `--font-geist-mono`. Console stats, counts,
   timestamps, status text, code-like values — the "technical, precise, secure" signal.

**Legibility (non-negotiable):**
- Pixel type is decorative-but-readable: large, high contrast, never for sentences.
- Any text over imagery sits on a scrim/overlay or solid panel (target contrast ≥ 4.5:1).
- Nothing clips or overflows at any breakpoint; test 320–1920px.

## 4. Surfaces, borders, texture

- **Glassmorphism (console + overlays):** translucent panels, `backdrop-filter: blur(12px)`,
  1px neon-tinted hairline border, soft inner vignette.
- **Thin animated borders:** 1px gradient borders that slowly travel (cyan→violet→magenta);
  used sparingly on hero frames and key panels.
- **CRT / scanline accent:** very subtle scanline overlay + faint chromatic edge on hero and
  console backdrop only — low opacity, must never hurt text legibility. Respect reduced motion.
- **Grid mesh:** animated perspective grid (the floor in the game screenshots) as a low-opacity
  background for the console and section transitions.

## 5. Motion vocabulary (motion v12)

Reuse `Reveal`, `ParallaxMedia`, `CityMotion`. Add:
- Scroll-scrubbed reveals + parallax depth layers (3 planes: far skyline, mid, foreground).
- Section-to-section "scroll frame" depth (CSS+motion; **no Three.js**).
- Magnetic / glow-on-hover micro-interactions on CTAs and tiles.
- Staggered entrances; arcade pulse/blink on status dots and the coin/yellow spark.
- Everything gated behind `prefers-reduced-motion: reduce`.

## 6. Console aesthetic ("control station")

- Strict asymmetric **12-column CSS grid**, modular widget panels.
- Glass panels over animated grid-mesh; neon accent lines; SVG status elements with glowing
  pulses (`filter: drop-shadow()`); mono telemetry type; **max 5 colors**.
- Calm by default; neon reserved for live/alert states. It must feel secure and precise,
  not noisy — luxury restraint over the public site's higher energy.
- Reuse `--console-*` tokens already in `globals.css`.

## 7. MuAPI master prompt language (Flux 2 Dev)

Extend `scripts/generate-design-assets.mjs` using this shared spine:

> _Original 16-bit / HD-2D pixel-art [subject] for a premium retro-arcade studio website.
> Deep indigo-black base, neon violet/magenta/cyan accents with restrained amber spark, wet
> reflective pixel highlights, layered parallax depth, crisp hard pixel edges, limited color
> clusters, cinematic but handcrafted sprite aesthetic, generous clean negative space for web
> typography. No readable text, letters, numbers, glyphs, logos, signage, UI, scores,
> characters (unless explicitly requested), copyrighted landmarks, photorealism, or smooth
> glossy 3D render._

- Keep prompts text-free (the pipeline already forbids embedded text/credentials).
- Generate at 2K where it's a hero/backdrop; provide portrait variants for mobile.
- Always review candidates before `--approve`.

## 8. Acceptance bar per screen

1. On-brand: reads as premium retro-arcade at a glance.
2. Legible: every text element passes contrast + no clipping, 320–1920px.
3. Responsive: graceful mobile *and* desktop; touch targets ≥ 44px.
4. Motion: purposeful, smooth, reduced-motion safe.
5. Restraint: ≤ 5 colors, neon as light, yellow rare.

## References (last-30-days + direct research)
- Awwwards — Retro / Pixelated gaming aesthetic collections.
- Pixel revival 2026: Press Start 2P / bitmap marks, neon-on-dark, modular pixel UI systems,
  HD-2D (pixel over modern lighting/shaders).
- Pixel display paired with clean sans body (Space Grotesk/Chakra Petch family thinking;
  we use Geist for consistency with the existing stack).
- SCENESCAPES / sci-fi FUI + 2026 glassmorphism for the console control-station language.
</content>
