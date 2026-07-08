# Product

## Register

brand

> Split-register project: the public surfaces (`/`, `/legal/*`, `/trapman/{privacy-policy,
> terms-of-use,data-compliance}`) are **brand**; the admin console (`/console/*`) is **product**.
> Commands targeting console files must load the product register.
>
> **2026-07 scope change**: the TrapMan marketing landing page and the player self-service
> account (login, dashboard, data export/deletion) have been removed. TrapMan's only public
> surface now is its three legal pages, kept because they're linked from app stores and are a
> legal requirement. Account/data-rights requests route to help.nobilix@outlook.com instead.
> The admin console is unaffected and still manages the live game.

## Users

- **Reviewers** — app-store and privacy reviewers verifying that the site's legal disclosures
  (privacy, data compliance, account deletion) match reality. Accuracy is non-negotiable.
- **Nobilix admins** — a small internal team operating the console: monitoring players,
  purchases, and analytics, sending push campaigns, managing the leaderboard. Non-technical
  operators; plain language over jargon.

## Product Purpose

Nobilix Pty Ltd (NSW, Australia) is an independent technology studio. This site is its public
face and operations hub: a calm studio homepage, TrapMan's legal disclosures (a live neon
pixel-art city-chase mobile game, no longer marketed from this site), and the internal admin
console. Success = the studio homepage represents Nobilix honestly; reviewers find every legal
promise true; admins can operate the game without confusion.

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
