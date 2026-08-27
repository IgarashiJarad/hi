# PRD — sanctuary (personal link-in-bio pages)

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

## Backlog
- P1: Custom avatar upload / profile photo override
- P1: Page view analytics (click counts per link)
- P2: Dark mode toggle (palette already defined)
- P2: Discord presence/status via Lanyard (live online status + activity)
- P2: Custom themes per profile
- P3: Custom domain support
