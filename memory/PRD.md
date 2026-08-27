# PRD — dontblink (personal link-in-bio pages)

## Renamed 2026-08-27 (iteration 4): brand is now "dontblink" (was "sanctuary") — UI, tab title, claim prefixes, footer, profile badge, and Stripe product name all updated. Internal storage path and localStorage key unchanged (invisible).

## Original problem statement
"Build a landing page: can you build me a social media page, make me a setting to link my discord, when i link my discord display my profile photo + banner (if user has a banner) and name. + make a option for people to add their social media (make it auto detect the social media websites favicon) + add a last.fm option to track my music plays"

User choices: Discord linked by pasting user ID (no OAuth keys); Last.fm API key provided (in backend/.env); login-protected settings with per-user public page at /username; vibe: chill and simplistic.

## Architecture
- FastAPI + MongoDB (motor), JWT bearer auth (bcrypt hashing), all routes under /api
- Discord lookup: backend proxy to japi.rest public user API, cached 15 min in Mongo (`discord_cache`)
- Last.fm: backend proxy to ws.audioscrobbler.com user.getrecenttracks (key server-side only), 30s in-memory cache
- React + Tailwind + framer-motion + lenis smooth scroll; favicon autodetect client-side (Google s2 favicons → DuckDuckGo icons → brand glyph fallback)
- Design: warm Japanese tea & matte ceramic (design_guidelines.json), Cabinet Grotesk + Cormorant Garamond + Plus Jakarta Sans

## Implemented (2026-08-27)
- Landing page: masked-line hero, username claim box, live demo card, slow marquee, feature bento, live playground (real Discord ID fetch + favicon chip demo)
- Auth: register (username availability check), login (email or username), JWT in localStorage
- Settings: profile (name/bio), Discord ID with live test fetch, Last.fm username with test, social links editor (add/reorder/remove, auto label + favicon), live preview pane
- Public profile /:username: avatar (Discord avatar if linked), bio, Discord card (banner + avatar + name + copy ID), Last.fm card (spinning vinyl now playing + recent scrobbles, polls 45s), social chips, 404 claim page
- Test user: wren / wren@example.com / sanctuary123 (see /app/memory/test_credentials.md)

## Implemented (2026-08-27, iteration 2)
- Live Discord presence: Lanyard proxy (/api/lanyard/{id}, 15s cache) — "online now" badge, status dot, current activity/Spotify on the Discord card; falls back to static "connected" when user isn't in the Lanyard server
- Link click counts: POST /api/profile/{username}/click increments per-link counters (preserved across saves); shown as tap counts in the settings link editor
- Page themes: 5 themes (Paper + Charcoal free; Moss, Ember, Dusk paid). Settings shows live mini-previews per theme; profile renders via scoped data-theme CSS vars
- Paid theme pack via Stripe claimable sandbox ($4.99 one-time, tax handled by Stripe managed payments w/ automatic-tax fallback): checkout → success redirect → status poll grants entitlement; webhook at /api/stripe/webhook; server blocks paid themes with 403 before purchase
- Profile photo upload: object storage via Emergent integration proxy (sanctuary/avatars/...), served through /api/files/{path}; overrides Discord avatar; remove supported

## Implemented (2026-08-27, iteration 3)
- Page view counter: POST /api/profile/{username}/view on every public page load; settings "Your stats" shows total visits + top referrers (host-normalized, favicon per source, top 6); stats only visible to owner
- Spotify vinyl art: Lanyard proxy now passes album_art_url; Discord card shows spinning vinyl with live album cover + song/artist while listening to Spotify (falls back to activity pill otherwise)

## Implemented (2026-08-27, iteration 5)
- Blink favicon: custom eye SVG favicon; on tab hide it swaps to a closed-eye "wink" icon and the title changes to "don't blink…", restoring on return
- Theme scheduling: settings "auto day / night" switch (theme_auto field); profile resolves Paper 06:00-18:00, Charcoal otherwise, on the visitor's clock
- View sparkline: views tracked per day (views_by_day); settings stats shows a 14-day SVG sparkline above the total

## Implemented (2026-08-27, iteration 6)
- Landing redesign inspired by guns.lol (dark plum, glowing purple CTAs, floating glass pill nav, centered masked headline "Everything you are, right here.", tilted overlapping product mock cards — stats sparkline, live profile w/ online badge + Spotify vinyl, theme picker — purple glow shadows, dark marquee/features/playground). New component LandingDark.jsx; playground Discord card inherits dusk theme. Profile/auth/settings pages unchanged.

## Implemented (2026-08-27, iteration 7)
- App-wide dark plum reskin: root palette now deep plum + purple (#8B5CF6) accent; login/register and settings fully restyled (dark cards, purple CTAs, purple sparkline/focus rings/toggles). Public profile pages still honor the visitor-facing per-user theme (Paper/Charcoal/Moss/Ember/Dusk + auto day/night); settings live-preview pane renders the selected page theme.

## Implemented (2026-08-27, iteration 8)
- Nav links swapped: features/try-it removed (still on-page via scroll), now compare / leaderboard / pricing anchors
- Compare section: dontblink vs Linktree vs Carrd table (pricing + feature rows, checks/crosses)
- Leaderboard: GET /api/leaderboard (top 10 by views, public); landing section with medal-colored ranks, avatars, view counts, links to pages
- Pricing section: Free vs Premium ($4.99 one-time) cards; unlock button starts Stripe checkout when logged in, sends guests to register; shows "unlocked" state when owned

## Implemented (2026-08-27, iteration 9)
- Compare, Leaderboard, Pricing moved off the landing into standalone routes /compare, /leaderboard, /pricing (shared dark shell in InfoPages.jsx; Nav + sections exported from LandingDark.jsx; landing keeps hero, showcase, marquee, features, playground)

## Implemented (2026-08-27, iteration 10)
- Dashboard redesign (guns.lol-inspired, not copied): /settings now a sidebar dashboard — search sections (⌘K wired), tabs: Overview (stat cards: username/views/link taps/premium, profile-completion checklist with progress bar, quick actions, analytics sparkline + referrers), Customize (profile/photo/theme + live preview), Links, Connections (Discord + Last.fm with linked badges), Premium (unlock/owned states). Sidebar has my-page + share-profile buttons. New Dashboard.jsx; old Settings.jsx unused.

## Implemented (2026-08-27, iteration 11)
- Role system (Discord-style pills: colored dot + label + icon): V1 auto-assigned to all signups before 2027-01-01 (from created_at); Owner/Developer assigned via OWNER_USERNAMES / DEVELOPER_USERNAMES env lists. Roles on public profiles, leaderboard entries, and dashboard overview. Current: @test = Owner, @wren = Developer.
- RolePills component (crown/code/zap icons; colors purple/blue/gold)

## Backlog
- P1: Custom avatar upload / profile photo override — DONE
- P1: Page view analytics (click counts per link) — DONE (per-link taps; page views still open)
- P2: Dark mode toggle — DONE (as free Charcoal theme)
- P2: Discord presence/status via Lanyard — DONE
- P2: Custom themes per profile — DONE (paid pack)
- P3: Custom domain support
- P3: Total page view counter + referrers
