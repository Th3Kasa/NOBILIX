# Nobilix Multi-Project Platform Design

## Status

Approved creative direction, pending user review of this written specification.

This document defines the intended public Nobilix platform, the TrapMan marketing and player-account experience, project-scoped legal pages, and the multi-project administration console. It is a product and implementation specification, not legal advice. All legal documents must receive qualified Australian privacy and consumer-law review before production publication.

## Product Model

Nobilix is the parent company and platform. TrapMan is the first project within that platform. Future games, applications, and CRM products must be addable without restructuring the site or console.

The platform has three distinct experience layers:

1. **Nobilix company layer:** presents the company, its point of view, and its project portfolio.
2. **Project layer:** gives every project its own brand, marketing story, player or customer account area, support experience, and legal documents.
3. **Nobilix console layer:** gives administrators access to every project from one authenticated operational platform.

Project identity is inherited only where useful. Nobilix provides shared architecture, quality standards, legal ownership, authentication boundaries, and console conventions. Each project controls its own visual world, content, data features, and legal disclosures.

## Route Architecture

### Nobilix Company

- `/` - Nobilix company homepage and project portfolio.
- `/legal` - Nobilix corporate website terms, corporate privacy information, and project legal-directory links.

### TrapMan Public Experience

- `/trapman` - full TrapMan marketing website.
- `/trapman/account` - authenticated player account and progression portal.
- `/trapman/account/login` - player sign-in using the same Firebase Authentication identity as the game.
- `/trapman/privacy-policy` - TrapMan-specific Privacy Policy.
- `/trapman/terms-of-use` - TrapMan-specific Terms of Use.
- `/trapman/data-compliance` - TrapMan technical data and compliance summary.
- `/trapman/delete-account` - TrapMan account-deletion explanation and authenticated deletion workflow.

Routes must use lowercase canonical URLs. Existing global product routes redirect permanently:

- `/privacy-policy` to `/trapman/privacy-policy`
- `/terms-of-use` to `/trapman/terms-of-use`
- `/data-compliance` to `/trapman/data-compliance`
- `/delete-account` to `/trapman/delete-account`

### Nobilix Console

- `/console` - authenticated project selector showing every project to every administrator.
- `/console/trapman` - TrapMan operational overview.
- `/console/trapman/users`
- `/console/trapman/leaderboard`
- `/console/trapman/purchases`
- `/console/trapman/analytics`
- `/console/trapman/gameplay`
- `/console/trapman/ads`
- `/console/trapman/messaging`
- `/console/trapman/exports`
- `/console/trapman/audit`
- `/console/trapman/settings`

The current `/console/*` routes redirect to their `/console/trapman/*` equivalents to preserve existing bookmarks.

## Project Registry

A central, typed project registry is the source of truth for project-level navigation and presentation. Each project entry contains:

- Stable project slug
- Display name
- Project type
- Lifecycle status
- Logo and image assets
- Brand color tokens
- Public homepage route
- Account route, if enabled
- Legal routes
- Enabled console modules
- Firestore collection mapping
- Analytics-event mapping
- Support contact

The registry must contain presentation and routing metadata only. Credentials, API keys, service-account data, and secrets are prohibited.

Adding a future project requires a registry entry plus project-specific pages and modules. It must not require editing TrapMan components.

## Visual Direction

### Nobilix

Nobilix uses a monumental editorial design:

- Obsidian, graphite, warm bone, restrained acid-lime signal accents, and minimal ember details
- Large editorial typography and asymmetric compositions
- Sculptural project imagery and tactile material texture
- Projects presented as distinct worlds rather than uniform SaaS cards
- Slow, architectural motion and controlled transitions

Nobilix must not use TrapMan's pixel-art interface as its company-wide design system. The company experience creates a premium neutral stage for projects with different identities.

### TrapMan

TrapMan uses an elevated version of the real game's pixel-art synthwave identity:

- True black and deep violet backgrounds
- Magenta, purple, and electric-cyan neon edges
- Star particles and animated skyline silhouettes
- Authentic pixel characters and item art
- Selective arcade HUD geometry
- Retro grid floors, scanlines, collectible pulses, and music-reactive details
- Pixel display typography for short labels, scores, and game moments only
- A clean modern sans-serif for paragraphs, navigation, accessibility text, and legal content

The existing transparent TrapMan logo at `public/assets/trapman-logo.png` remains the official product mark. It must be used without redrawing, cropping, stretching, or stylistic alteration.

The supplied gameplay screenshots are first-class marketing material. They must be displayed in polished device frames, gameplay galleries, and feature stories rather than replaced by unrelated generated imagery.

### Console

The console is operational mission control, not a game menu:

- Near-black graphite canvas
- Warm-bone primary text and muted-steel labels
- Acid-lime reserved for healthy live status
- Ember orange reserved for TrapMan actions, warnings, and selected states
- Violet and cyan used sparingly as project identity traces
- Compact, information-rich layouts with strong hierarchy
- Tables, charts, filters, alerts, and drawers optimized for administrator speed

The first screen must answer:

1. Is the game healthy now?
2. What changed?
3. What requires attention?
4. What can an administrator do next?

## TrapMan Public Page Structure

The `/trapman` page contains:

1. **Animated hero**
   - Official logo
   - Primary product statement
   - Play and watch-gameplay actions
   - Featured player character on an active neon platform
   - City-world animation described below
2. **The Run**
   - Core gameplay loop
   - Levels, lives, scores, obstacles, and progression
   - Gameplay footage or screenshot sequence
3. **Characters**
   - Character selector inspired by the actual game
   - Character cards or carousel using real character assets
4. **World and collectibles**
   - Hearts, shields, boosts, music, shop items, and level mechanics
5. **Music**
   - Music-player visual language derived from the game
   - Audio samples only where Nobilix owns or licenses the required rights
6. **Leaderboard**
   - Public leaderboard preview using safe public fields
   - Sign-in prompt for the player's own rank and progression
7. **Player account**
   - Progression preview and account CTA
8. **Support and legal**
   - Privacy Policy
   - Terms of Use
   - Data & Compliance
   - Delete Account

## Animated TrapMan City

The city must feel continuously alive without becoming distracting or expensive to render.

### Animation Layers

1. **Sky layer**
   - Slowly drifting star particles
   - Occasional pixel twinkle clusters
   - Subtle atmospheric color movement
2. **Far skyline**
   - Very slow horizontal parallax
   - Randomized office-window flickers
   - Neon skyline outlines with restrained pulse cycles
3. **Near skyline**
   - Faster parallax than the far skyline
   - Animated signage and rooftop beacons
   - Small vehicle-light trails where appropriate
4. **Helicopter**
   - Long looping flight path
   - Slight vertical drift
   - Rotating or frame-animated rotor
   - Searchlight that sweeps city surfaces and occasionally passes behind the hero composition
   - No searchlight over critical body text
5. **Character**
   - Subtle left-right weight shift
   - Small vertical idle bob
   - Occasional blink or accessory movement if source character frames support it
   - Pointer or keyboard interaction may produce a short reaction, but never block navigation
6. **Platform**
   - Rotating or scanning neon ring
   - Horizontal scan pass
   - Soft light reflection under the character
   - Short energy surge when the primary CTA receives focus or hover
7. **Foreground**
   - Sparse collectible particles
   - Pixel streaks linked to scroll position
   - Occasional route-map pulse

### Motion Rules

- Marketing animation may use longer 700-1200 millisecond choreography.
- Interactive feedback remains below 250 milliseconds.
- Animation pauses when the page is hidden.
- Battery-intensive effects are reduced on small devices and low-power contexts.
- No animation may interfere with reading, keyboard focus, or form input.
- `prefers-reduced-motion: reduce` replaces parallax, looping travel, sweeps, and bobbing with static compositions and short opacity transitions.
- The page remains complete and attractive when JavaScript is unavailable.

## TrapMan Player Account

### Identity

Players sign in to `/trapman/account` using the same Firebase Authentication identity they use in the mobile game. The website must not create a parallel account database.

Supported providers must match the production game configuration. If the game supports Google, Apple, email/password, or anonymous accounts, the website exposes only providers that are safe and technically supported on the web.

Anonymous mobile accounts cannot be recovered on the web until linked to a persistent provider. The account page explains this limitation and directs the player to link the account in the game when that functionality exists.

### Session Security

- Firebase client authentication establishes the user identity.
- The server verifies Firebase ID tokens using Firebase Admin.
- Authenticated server operations use secure, HTTP-only session cookies.
- Session cookies use `Secure`, `HttpOnly`, and appropriate `SameSite` settings.
- Every data read is scoped to the verified UID.
- The client never chooses an arbitrary UID for server reads.
- Admin authentication remains separate from player authentication.

### Player Dashboard

The dashboard displays only confirmed data available for the signed-in UID:

- Username
- Email
- Country
- Competitions won
- Current progression fields that actually exist in the game database
- Public leaderboard rank and score when available
- Purchase history and purchased product IDs
- Aggregated playtime
- Ads watched
- Ads clicked

It also provides:

- Profile correction controls for fields players are allowed to edit
- Data-download request
- Privacy and legal links
- Sign out
- Permanent account deletion

### Analytics-to-Account Aggregation

Firebase Analytics is an aggregate analytics product and must not be treated as the direct backing store for a player's account dashboard.

If players are to see playtime and ad statistics, the game or a trusted backend must maintain per-user counters in Firestore:

- `totalPlaytimeMs`
- `adsWatchedCount`
- `adsClickedCount`
- `analyticsUpdatedAt`

Updates must be authenticated and protected against arbitrary client manipulation. The implementation plan must choose between validated game writes, callable server functions, or a trusted event-processing pipeline based on the developer's final Firebase design.

The website may show "not available yet" states until these counters exist. It must not invent values or query GA4 exports by user email.

## Confirmed Data Inventory

The revised legal documents must disclose at minimum the collection supplied by Nobilix.

### Firestore

| Data | Expected location | Purpose |
|---|---|---|
| Username | `users/{uid}` | Player identity, account display, leaderboard |
| Email | `users/{uid}` and Firebase Authentication | Authentication, account recovery, notices, support |
| Country | `users/{uid}` | Country display, rankings, aggregate reporting |
| Competitions won | `users/{uid}` or `player_progress/{uid}` | Progression and competition history |
| Purchase record | `purchases/{purchaseId}` | Entitlement verification, support, accounting, fraud prevention |
| Purchased product ID | `purchases/{purchaseId}` | Identify and restore the purchased item |

### Firebase Analytics Events

| Event | Parameter | Purpose |
|---|---|---|
| `session_end` | `duration_ms` | Measure time played and engagement |
| `ad_closed` | Event occurrence and documented parameters | Count completed or closed ad experiences |
| `ad_clicked` | Event occurrence and documented parameters | Count ad interactions |

The exact semantics of `ad_closed` must be verified. Closing an advertisement does not necessarily prove that the advertisement was watched to completion. Legal copy and dashboard labels must use the technically accurate meaning.

### Verification Requirement

Before legal publication, engineering must produce an SDK and schema inventory covering:

- Firebase Authentication providers
- Firestore collections and fields
- Firebase Analytics automatic events and user properties
- Custom analytics events and parameters
- Advertising SDKs or direct ad delivery
- App Store and Google Play purchase data
- Crash reporting
- Push notifications and FCM tokens
- Device identifiers
- IP-derived location
- Support data
- Data exports and backups

Previously written claims that are not verified must be removed or corrected. This includes broad statements about GAID, device details, guest mode, FCM tokens, ad technology, precise retention periods, character and score fields, and third-party processors.

## Age Policy

- TrapMan is intended for users aged 13 and older.
- No date of birth or age-verification gate is collected or displayed.
- Account creation requires the user to represent that they meet the minimum age.
- The Privacy Policy states that Nobilix does not knowingly collect personal information from children under 13.
- If Nobilix learns that an account belongs to a child under 13, it disables the account and deletes associated personal data, subject to lawful retention.
- A parent or guardian can submit an underage-data deletion request from `/trapman/delete-account`.
- Marketing must not claim that the absence of a date-of-birth field eliminates children's-privacy obligations.
- The final age model requires professional legal and platform-policy review because the game's visual style may appeal to children.

## Project-Scoped Legal Suite

### Privacy Policy

The TrapMan Privacy Policy must state:

- Nobilix identity and contact information
- Scope limited to TrapMan and its player portal
- Exact categories of collected data
- Source of each category
- Purpose of processing
- GDPR/UK GDPR legal bases where applicable
- Public leaderboard disclosure
- Purchases and app-store processors
- Advertising and analytics practices
- Processor and international-transfer information
- Retention criteria
- Security practices
- Player rights by jurisdiction
- Children's and underage-account policy
- Data export, correction, objection, and deletion channels
- Policy-change process

The policy must distinguish Firestore account data from Firebase Analytics event data.

### Terms of Use

The TrapMan Terms must cover:

- 13+ eligibility representation
- Parent or guardian responsibility where local law requires it
- Account security
- Limited game licence
- Fair-play and anti-cheating rules
- Username and leaderboard conduct
- Purchases, entitlements, refunds, and restoration
- Advertising and external destinations
- Intellectual property
- Service changes and availability
- Suspension, termination, and appeals
- Disclaimers and liability limitations subject to non-excludable consumer rights
- Australian Consumer Law savings language
- Dispute and governing-law terms

The Terms must not claim that purchase entitlements are deleted if the platform or legal obligations require transaction retention or restoration.

### Data & Compliance

The technical summary provides a readable matrix of:

- Data fields
- Storage systems
- Visibility
- Purpose
- Retention criteria
- Processors
- Security controls
- Player rights
- Account deletion behavior
- Analytics event names and parameters

It is supplementary and must never contradict the Privacy Policy.

### Delete Account

Authenticated players can initiate deletion from `/trapman/account` or `/trapman/delete-account`.

The deletion flow:

1. Requires recent authentication.
2. Explains exactly what is deleted and what may lawfully be retained.
3. Requires explicit typed confirmation.
4. Revokes the player session.
5. Deletes or anonymizes UID-scoped Firestore data across all documented collections.
6. Removes public leaderboard identity or anonymizes historical competition records where deletion would damage competition integrity and the legal basis supports retention.
7. Deletes the Firebase Authentication user.
8. Records a non-identifying compliance receipt containing request time, completion time, policy version, and deletion outcome.
9. Confirms completion to the user when a contact channel remains lawfully available.

Analytics events already aggregated into Firebase Analytics may not support record-by-record deletion from the application database. The legal documents must accurately explain the available Firebase or Google deletion mechanisms, retention behavior, and de-identification rather than promising technically impossible immediate deletion.

Parents and guardians receive a separate request path for suspected under-13 accounts. Nobilix may request limited information necessary to locate the account and verify the requester, then deletes that verification information when no longer required.

## Console Information Architecture

### `/console`

Every authenticated administrator sees every project.

The project selector displays:

- Project logo and brand
- Lifecycle status
- Environment
- Health summary
- Last data synchronization
- Enabled modules
- Open-console action

### `/console/trapman`

The operational overview prioritizes:

- Players online
- Daily active players
- Retention where available
- Revenue and purchases
- Crash-free sessions if a verified crash source exists
- Ad close/completion and click metrics using accurate event semantics
- Player activity chart
- Needs-attention anomalies
- Recent events
- Suggested administrator actions

All unavailable metrics receive honest empty states identifying the required data source. Placeholder values are prohibited.

### Data Boundaries

- Console queries are project-scoped through the project registry.
- Player routes cannot invoke administrator actions.
- Administrator writes require authorization and audit logging.
- Destructive actions require confirmation and recent authentication where appropriate.
- Personally identifiable information is shown only where necessary for the administrator's task.
- Exports are access-controlled, logged, and time-limited.

## Loading, Empty, Error, and Offline States

Every public account and console module must define:

- Loading skeleton
- Empty state
- Permission-denied state
- Missing-data state
- Partial-data state
- Network failure state
- Retry behavior
- Stale-data indicator

The player portal must never expose raw Firebase errors. Legal and account-deletion failures must provide a recoverable support path and a request reference.

## Accessibility

- WCAG 2.2 AA color contrast
- Full keyboard navigation
- Visible focus treatment
- Semantic landmarks and headings
- Accessible names for icon-only controls
- Alternative text for meaningful imagery
- Captions or transcripts for promotional video
- Screen-reader announcements for live status changes
- No information encoded by color alone
- Minimum 44-by-44-pixel touch targets on mobile
- Reduced-motion design as a complete supported mode
- Legal pages remain readable without animation, custom fonts, or JavaScript

## Performance

- Target LCP below 2.5 seconds at the 75th percentile
- Target CLS below 0.1
- Reserve dimensions for all media
- Use responsive AVIF/WebP where suitable
- Keep the official transparent logo as optimized PNG or lossless WebP only if visual fidelity remains exact
- Lazy-load below-the-fold media
- Pause offscreen animation
- Prefer CSS transforms and opacity for continuous motion
- Use canvas or WebGL only where it materially improves the effect and has a static fallback
- Avoid shipping the full marketing animation runtime to the console

## Security

- Never expose Firebase Admin credentials to the client.
- Never commit service-account JSON files.
- Firestore rules deny cross-user reads and writes.
- Server endpoints independently verify authenticated UID and authorization.
- Purchase records are not trusted solely from client claims.
- Account deletion handles every documented collection and is idempotent.
- Sensitive actions are rate-limited and audited.
- Legal-form submissions use CSRF protection and abuse controls.
- Content security policy permits only required sources.
- Player and administrator sessions use separate cookie namespaces.

## Testing and Acceptance Criteria

### Routing

- Nobilix and project routes resolve without rewrite loops.
- Old legal routes redirect to TrapMan canonical routes.
- Future registry entries do not alter TrapMan routes.

### Account

- A production game account can sign into the website using the same supported provider.
- The signed-in player can read only their own private data.
- Public leaderboard data exposes only approved public fields.
- Missing progression or analytics counters show honest unavailable states.
- Sign-out revokes the website session.

### Deletion

- Recent authentication is required.
- Firestore documents, public identity, and Firebase Authentication are deleted or anonymized according to the approved deletion map.
- Repeated deletion requests are safe.
- Failure midway through deletion can resume without recreating data.
- The user receives a clear completion or support state.

### Marketing Motion

- Helicopter, searchlight, skyline, character, platform, starfield, and foreground loops run smoothly on supported desktop devices.
- Mobile uses reduced effect density.
- Hidden tabs pause continuous animation.
- Reduced-motion mode removes looping spatial movement.
- The hero remains usable with animation disabled.

### Console

- Every admin sees the project selector.
- TrapMan navigation remains project-scoped.
- Metrics match verified Firebase or store sources.
- No demo number is presented as live data.
- Tables and destructive actions are keyboard accessible.

### Legal

- Every disclosed field and event is present in the verified data inventory.
- Every actual field, SDK, processor, and event is disclosed.
- Privacy Policy, Terms, Data & Compliance, deletion behavior, platform disclosures, and app-store forms do not contradict one another.
- Qualified legal review is recorded before launch.

## Delivery Phases

1. **Foundation**
   - Project registry
   - Route migration and redirects
   - Shared design tokens
   - Static asset and font pipeline
2. **Nobilix public site**
   - Company homepage
   - Project portfolio
   - Corporate legal directory
3. **TrapMan marketing**
   - Animated hero
   - Gameplay, characters, music, shop, leaderboard, and support sections
   - Responsive and reduced-motion modes
4. **Player account**
   - Firebase player authentication
   - Private account dashboard
   - Progression and purchase views
   - Analytics-counter integration
5. **Legal suite**
   - Verified data inventory
   - Rewritten project-scoped documents
   - Self-service deletion and export
   - Legal review
6. **Console migration**
   - Project selector
   - `/console/trapman/*` module migration
   - Mission-control visual system
   - Live metrics and empty states
7. **Quality and launch**
   - Security review
   - Accessibility audit
   - Performance profiling
   - Cross-device QA
   - Production deployment and smoke testing

## Out of Scope for Initial Release

- Date-of-birth collection or age gate
- Project-specific administrator permissions
- Player social profiles, direct messages, or public activity feeds
- Player access to raw analytics event streams
- Unverified crash, retention, or ad-completion metrics
- Full 3D city rendering where layered 2D animation provides the intended effect
- Additional Nobilix projects beyond registry readiness and placeholder presentation
