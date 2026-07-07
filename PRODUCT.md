# Product

## Register

brand

> Split-register project: the public surfaces (`/`, `/trapman`, `/legal/*`) are **brand**;
> the admin console (`/console/*`) and player account (`/trapman/account`) are **product**.
> Commands targeting console/account files must load the product register.

## Users

- **TrapMan players** — mobile gamers arriving from the game or a store listing. They come to
  feel the game's world, check the leaderboard, manage their account (data export, deletion),
  or read legal terms. Casual context, often on a phone.
- **Nobilix admins** — a small internal team operating the console: monitoring players,
  purchases, and analytics, sending push campaigns, managing the leaderboard. Non-technical
  operators; plain language over jargon.
- **Reviewers** — app-store and privacy reviewers verifying that the site's legal disclosures
  (privacy, data compliance, account deletion) match reality. Accuracy is non-negotiable.

## Product Purpose

Nobilix Pty Ltd (NSW, Australia) is an independent technology studio. This site is its public
face and operations hub: a calm studio homepage, the loud neon marketing site for TrapMan
(a live neon pixel-art city-chase mobile game), self-service player accounts built around
privacy compliance, and the internal admin console. Success = visitors feel the game's world
and can get the game; players can serve themselves; admins can operate without confusion;
reviewers find every promise true.

## Brand Personality

Premium execution of a retro-arcade soul. Three words: **crafted, electric, honest.**
Two moods on one dark substrate: Nobilix is quiet arcade-luxury; TrapMan is saturated neon
energy. The console is a calm control station. The quiet company frames the loud project.

## Anti-references

- The generic AI-SaaS template: Inter-everywhere, purple-to-blue gradient heroes, cards nested
  in cards, icon-tile stacks, hero-metric rows, cream defaults.
- Fake anything: invented gameplay stats, placeholder products, mock testimonials, dead CTAs.
  Where data is absent the UI says so honestly (see `docs/superpowers/specs/2026-06-24-full-site-console-redesign-design.md`).
- Autoplay audio; motion that ignores `prefers-reduced-motion`; spectacle that costs legibility.

## Design Principles

1. **Quiet company, loud project** — Nobilix editorial calm and TrapMan neon never blend;
   the console shares standards, not decoration.
2. **Neon as light, not fill** — max 5 active colors per view; yellow rarest spark.
3. **Honest data or honest empty states** — never fabricate; caps, disconnections, and
   coming-soon states are stated plainly.
4. **Motion is purposeful** — marketing may be expressive; product surfaces stay under 300ms,
   ease-out, transform/opacity only; everything reduced-motion safe.
5. **Legibility beats spectacle** — WCAG 2.2 AA, 44px targets, no clipping 320–1920px.

## Accessibility & Inclusion

WCAG 2.2 AA across all surfaces. `prefers-reduced-motion` respected by every animation
(gentler, not zero). Touch targets ≥ 44×44px. Visible `:focus-visible` on every interactive
element. Contrast ≥ 4.5:1 body / 3:1 large text. Keyboard-complete: no hover-only controls.
