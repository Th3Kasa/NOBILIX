# Nobilix and TrapMan Full Redesign

## Status

Approved visual direction, pending user review of this written specification.

This specification replaces the current surface-level presentation across the Nobilix public site, TrapMan public and player experiences, and the Nobilix console. Existing authentication, authorization, Firebase data boundaries, deletion behavior, and working business logic remain intact unless a UI requirement explicitly needs a compatible extension.

Legal content in this project is product copy, not legal advice. Nobilix must obtain qualified legal review before treating policies as final.

## Product Architecture

Nobilix is the parent company and durable studio brand. TrapMan is its main current project. Future games and digital products must be addable without inheriting TrapMan's visual identity or restructuring the company website and console.

The redesign has three coordinated systems:

1. **Nobilix studio:** neutral, editorial, professional, and suitable for a growing project portfolio.
2. **TrapMan:** an original premium web world inspired by the game's pixel-art synthwave language.
3. **Nobilix console:** calm, project-aware operational software optimized for fast administrative decisions.

The systems share accessibility, interaction, spacing, performance, and engineering standards. They do not share the same decorative styling.

## Routes in Scope

### Nobilix

- `/`
- `/legal`
- Public 404 page

### TrapMan public and player experience

- `/trapman`
- `/trapman/account/login`
- `/trapman/account`
- `/trapman/privacy-policy`
- `/trapman/terms-of-use`
- `/trapman/data-compliance`
- `/trapman/delete-account`
- Player loading and error states

### Nobilix console

- `/console/login`
- `/console/enroll`
- `/console`
- `/console/trapman`
- `/console/trapman/users`
- `/console/trapman/users/[uid]`
- `/console/trapman/leaderboard`
- `/console/trapman/messaging`
- `/console/trapman/analytics`
- `/console/trapman/purchases`
- `/console/trapman/gameplay`
- `/console/trapman/ads`
- `/console/trapman/exports`
- `/console/trapman/audit`
- `/console/trapman/settings`

## Nobilix Studio Direction

Nobilix uses a neutral editorial identity that can frame projects with unrelated art directions.

### Visual language

- Obsidian and graphite foundations
- Warm bone primary text
- Muted steel secondary text
- One restrained acid-lime company signal
- Occasional ember accent for editorial markers
- Large variable display typography paired with a highly readable sans serif
- Asymmetric layouts, generous negative space, and precise grid alignment
- Tactile surfaces, subtle grain, controlled light, and sculptural abstract media
- No generic purple SaaS gradients, equal three-card feature rows, or excessive glass panels

### Homepage structure

1. Animated studio statement
2. Current-project feature led by TrapMan
3. Studio principles and working philosophy
4. Expandable project portfolio designed for future entries
5. Company information and legal routes
6. Restrained footer with ownership, location, support, and legal links

### Nobilix motion

Every Nobilix page receives motion, but it remains architectural rather than game-like:

- Typographic mask reveals
- Slow material and lighting loops
- Gentle depth response to pointer movement
- Project artwork revealed through directional crops
- Shared-element transitions between portfolio entries
- Editorial dividers and index markers that animate with reading progress
- Navigation transitions that preserve orientation
- Focus, hover, and pressed feedback within 120–240 milliseconds

Motion must never delay access to content. Legal pages use quieter versions of the same system.

## TrapMan Direction

The supplied screenshots are art-direction evidence, not website layouts. The site must create original compositions from the game's visual grammar.

### Visual source language

- Pixel characters and collectibles
- Neon Sydney skyline
- Cyan and magenta HUD geometry
- Starfields and deep-space texture
- Grid floors and glowing route rails
- Arcade score typography
- Character presentation platforms
- Music-player and leaderboard motifs
- Black, violet, cyan, magenta, and selective score yellow

### Transformation into a website

- The skyline becomes a wide layered environment rather than a mobile screenshot background.
- Character platforms become interactive hero stages and shared visual anchors.
- HUD geometry becomes a custom component vocabulary for navigation, feature modules, progress, and calls to action.
- Pixel typography is limited to scores, short labels, and game moments.
- Body copy, forms, account pages, and legal content use a modern readable sans serif.
- Real screenshots appear selectively as product evidence in gameplay stories, not as the page composition.
- Generated media may extend scenes and atmosphere but must not redesign official characters, logos, or established game identity.

### TrapMan homepage structure

1. Immersive city hero with game statement, primary action, and account action
2. The Run: gameplay loop and level progression
3. Characters: interactive selector and character stories
4. World system: obstacles, collectibles, hearts, shields, boosts, and routes
5. Music: soundtrack-led visual sequence without autoplay audio
6. Shop: confirmed products and coming-soon states
7. Leaderboard: safe public fields and personal-rank sign-in path
8. Account invitation
9. Support and project legal routes

### TrapMan motion

Every TrapMan public page uses scene-based motion:

- Multi-speed starfield and skyline parallax
- Character idle and reaction loops
- Energy-portal and platform charge sequences
- Reactive HUD borders and route rails
- Pixel-mask section transitions
- Collectible particles tied to scroll progress
- Music visualizers synchronized only to user-initiated audio
- Shared-element transitions between character views
- Scan sweeps, window flickers, and distant city light movement
- Mobile-specific vertical-run choreography with reduced density

Motion for React will control interface state, scroll progress, layout transitions, and spring feedback. CSS handles inexpensive ambient loops where it is more efficient.

## Generated Asset Pipeline

The project may use MuAPI and the Open Generative AI repository as an isolated authoring reference. The full Open Generative AI application and dependency tree must not be installed into the Nobilix production repository.

### Credential boundary

- Read `MUAPI_API_KEY` only from ignored local environment configuration.
- Never expose the key through `NEXT_PUBLIC_*`, browser code, source maps, screenshots, logs, generated metadata, or committed files.
- Never upload Firebase exports, player data, receipts, administrator data, credentials, or private analytics.
- Upload only approved first-party artwork needed as visual references.

### Assets to generate

#### Nobilix

- Abstract studio hero material, 16:9 and mobile portrait crops
- Seamless low-motion studio atmosphere loop
- Portfolio transition plate
- Neutral grain and light textures
- Project-placeholder artwork that does not imitate TrapMan

#### TrapMan

- Original wide neon-city hero plate informed by the supplied game captures
- Separate foreground, midground, and far-skyline layers where model output permits clean separation
- Five-to-eight-second city-light atmosphere loop
- Pixel-energy portal loop
- Route-map and collectible transition plates
- Section backgrounds for gameplay, characters, music, leaderboard, and support
- Mobile portrait variants

### Generation and review rules

- Start with still key art before generating motion.
- Use image-to-image or multi-reference generation where visual continuity matters.
- Reject outputs that alter official logos, invent misleading gameplay, distort supplied characters, or become generic photorealistic cyberpunk.
- Manually review every output for visual quality, rights risk, unwanted text, anatomy defects, and brand inconsistency.
- Store accepted masters separately from delivery assets.
- Convert final website images to AVIF or WebP with explicit dimensions.
- Encode silent video loops as WebM and MP4 fallbacks with poster images.
- Strip unnecessary metadata.
- Record prompt, model, seed where available, source references, output purpose, and approval status in an asset manifest.

## Motion and Performance Architecture

Install `motion` as the only new runtime animation dependency.

- Server Components remain the default.
- Client boundaries stay limited to interactive motion islands, menus, filters, forms, and charts.
- Motion provider uses the user's reduced-motion preference.
- Transform and opacity are the default animated properties.
- Layout animation uses explicit dependencies where needed.
- Continuous animation pauses when hidden or outside the viewport.
- Below-fold media lazy loads.
- Heavy generated video never blocks the largest-contentful paint.
- Hero media has an optimized poster and a static fallback.
- Small screens receive fewer particles, simpler scene depth, and shorter sequences.
- No autoplay audio.
- The complete page remains usable without animation.

Performance targets:

- LCP below 2.5 seconds at the 75th percentile
- CLS below 0.1
- Responsive interaction feedback within 100 milliseconds
- No decorative client bundle on legal pages beyond the shared lightweight motion shell

## Responsive Navigation

### Public site

- Desktop uses a concise horizontal navigation.
- Mobile uses an accessible animated sheet with labeled destinations.
- Navigation remains reachable from deep legal and account pages.
- Active location is visible.
- All targets are at least 44 by 44 pixels.

### Console

- Desktop uses a project-aware navigation rail.
- Mobile uses a fixed top bar and slide-over navigation.
- The console must not disappear into an unusable desktop sidebar at 375 pixels.
- Tables become card rows or controlled horizontal data regions only where semantics require a table.
- Primary actions remain visible without crowding.

## Console Redesign

The console is Nobilix operational software, not a TrapMan game menu.

### Shell

- Graphite canvas with warm high-contrast text
- Compact but comfortable information density
- Project identity shown through artwork, one contextual accent, and project name
- Persistent orientation between platform and project levels
- Keyboard-accessible navigation and command affordances
- User identity and sign-out grouped away from primary navigation

### Overview hierarchy

Each overview answers:

1. Is the project connected and healthy?
2. What changed recently?
3. What requires attention?
4. What action should an administrator take?

Unavailable data remains explicit. No invented metric appears as live data.

### Components

- Metric panels with clear comparison context
- Attention queue
- Live connection status
- Responsive charts with text summaries and table alternatives
- Filter bars that collapse cleanly on mobile
- Accessible sortable tables
- Slide-over detail panels where they preserve context
- Designed loading, empty, stale, partial, permission, and error states
- Confirmed destructive actions with recovery or support guidance

### Authentication

Admin login and enrollment use the Nobilix company identity, not TrapMan branding. The multi-step authentication flow keeps visible progress, inline errors, password visibility controls, proper autocomplete, and clear return paths.

## Player Account

The player account visually belongs to TrapMan but prioritizes clarity over arcade decoration.

- Progression, purchases, and identity use readable modular panels.
- Pixel styling appears only in labels, scores, and small accents.
- Account actions are clearly separated from deletion.
- Loading, empty, error, and unavailable-data states are fully designed.
- Mobile navigation and forms are touch friendly.
- Existing server-side player-session guards remain mandatory.

## Legal Pages and Confirmed Collection

Nobilix company legal pages remain separate from TrapMan project legal pages.

TrapMan legal pages must clearly disclose this confirmed collection:

### Firestore per user

| Data | Location |
|---|---|
| User name | `users/{uid}` |
| User email | `users/{uid}` |
| User country | `users/{uid}` |
| Competitions won | `users/{uid}` or `player_progress/{uid}` |
| Purchases made | Receipt records in `purchases/{purchaseId}` |
| Purchased item | Product ID in `purchases/{purchaseId}` |

### Firebase Analytics

| Data | Event |
|---|---|
| Time played | `session_end` with `duration_ms` |
| Ads watched or closed | `ad_closed` |
| Ads clicked | `ad_clicked` |

The copy must not state that `ad_closed` proves a full advertisement was watched unless engineering verifies that exact trigger. It may describe the event as an ad-close event and explain how it is used.

The privacy policy and data-compliance page must distinguish database records from aggregate analytics events and explain that analytics deletion follows Firebase and Google processes rather than promising immediate row-level deletion.

Legal pages use calm Nobilix/TrapMan theming, strong reading measures, a contents rail on wide screens, predictable back navigation, printable styling, and minimal motion.

## Accessibility

- WCAG 2.2 AA contrast
- Visible keyboard focus
- Skip links and semantic landmarks
- Correct heading hierarchy
- Accessible names for icon controls
- Form labels, inline errors, and error summaries
- Screen-reader announcements for asynchronous status
- Color never acts as the only signal
- Minimum 44-pixel touch targets
- Captions or descriptive alternatives for meaningful video
- Full `prefers-reduced-motion` support
- Legal and account content remains readable with animation, images, fonts, or JavaScript unavailable

## Testing and Quality Gates

### Automated

- Existing route, authentication, Firebase-boundary, deletion, legal, and console tests remain passing.
- Add design-contract tests for route sections, generated asset manifests, navigation, reduced-motion support, and legal inventory.
- Run ESLint, TypeScript through the production build, Node tests, and production build.

### Browser QA

Verify at minimum:

- 375 by 812
- 768 by 1024
- 1440 by 900
- Mobile landscape
- Keyboard-only navigation
- Reduced motion
- Slow network and disabled media
- Authenticated and unauthenticated routes
- Connected and disconnected Firebase states

### Visual QA

- No horizontal overflow
- No hidden fixed-bar content
- No unreadable text over generated media
- No motion blocking interaction
- No layout shift from media
- Project and company brands remain visibly distinct
- Every interactive element has hover, focus, pressed, disabled, loading, and error behavior where applicable

## Delivery Sequence

1. Generate and approve the asset set and manifest.
2. Add Motion and shared interaction foundations.
3. Redesign Nobilix homepage, header, footer, legal directory, and 404 page.
4. Redesign TrapMan public website and generated-media sequences.
5. Redesign TrapMan player login, account, loading, error, and deletion flows.
6. Update TrapMan legal inventory and all project legal pages.
7. Redesign Nobilix console authentication and responsive shell.
8. Redesign every TrapMan console module and state.
9. Run automated, visual, responsive, accessibility, and performance verification.
10. Complete security and QA gates.
11. Commit intentional changes, push the branch to GitHub, and report the pushed commit.

## Out of Scope

- Redesigning official TrapMan characters or logo
- Inventing gameplay, products, metrics, or supported platforms
- Adding a runtime generative-AI feature to the website
- Installing the full Open Generative AI repository into the application
- Replacing existing Firebase authentication or authorization
- Publishing legal copy as final professional legal advice
- Deploying to production unless separately requested

