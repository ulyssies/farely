# CLAUDE.md

This file is the source of truth for Claude Code in this project. Read it fully before acting. Agents must read it before scoped work.

---

## Project Overview

**Farely** is an AI-powered flight search web app. Users can search for flights with traditional IATA codes or describe a vibe ("somewhere warm with great beaches") and have Claude find matching destinations. The app shows real-time Tequila/Kiwi flight prices, an interactive D3.js world map, and deep-links to Skyscanner for booking.

**Status:** Active development (baseline build)

---

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI:** Anthropic Claude API (`claude-sonnet-4-5`) via `@anthropic-ai/sdk` with prompt caching
- **Flight data:** Travelpayouts API (`https://api.travelpayouts.com`) — sole flight data source for both Screen 2 and Screen 3
- **Photos:** Unsplash API with gradient fallbacks
- **Email:** SendGrid (price alert signups)
- **Maps:** D3.js + TopoJSON (Natural Earth projection, great-circle arcs)
- **Package manager:** npm

---

## Deployment

- **Frontend:** Vercel (planned) — `next build` output
- **Environment:** Copy `.env.local.example` → `.env.local`. Never commit `.env.local`.

Required env vars:
```
TRAVELPAYOUTS_TOKEN=     # Travelpayouts API token (Profile → API token)
TRAVELPAYOUTS_MARKER=    # Travelpayouts affiliate marker (dashboard bottom-left)
ANTHROPIC_API_KEY=       # Anthropic Claude API key (AI search / discover)
UNSPLASH_ACCESS_KEY=     # Unsplash API access key (city photos)
SENDGRID_API_KEY=        # SendGrid API key (price alert emails)
```

---

## Project Structure

```
Flight App/
├── app/
│   ├── layout.tsx           # Root layout with Inter font
│   ├── globals.css          # Tailwind + custom animations
│   ├── page.tsx             # Home/Landing — hero + deal cards
│   ├── results/page.tsx     # Search results — split map+cards
│   ├── discover/page.tsx    # AI Discovery — chat + map
│   └── api/
│       ├── flights/route.ts   # Travelpayouts searchRoute proxy (Screen 2)
│       ├── anywhere/route.ts  # Travelpayouts searchAnywhere proxy (Screen 3)
│       ├── calendar/route.ts  # Travelpayouts getPriceCalendar proxy (heat map)
│       ├── ai-search/route.ts # 5-step Claude AI flow
│       ├── alert/route.ts     # SendGrid email signup
│       └── unsplash/route.ts  # Unsplash proxy with 24hr cache
├── components/
│   ├── SearchBar.tsx        # Full/compact mode IATA search form
│   ├── AIPromptBar.tsx      # NL query input with suggestions
│   ├── WorldMap.tsx         # D3 + TopoJSON map (client-only)
│   ├── MapSection.tsx       # Homepage map strip with expand/collapse toggle (280px ↔ 520px)
│   ├── FlightCard.tsx       # Flight result card with AI ranking
│   ├── DealCard.tsx         # Homepage deal preview card with relative price coloring
│   ├── PriceCalendar.tsx    # 7-day price heat map
│   ├── ChatPanel.tsx        # AI discovery chat interface
│   ├── ThemeToggle.tsx      # Fixed bottom-right dark/light toggle (lives in root layout)
│   └── WelcomeModal.tsx     # First-visit onboarding modal (localStorage key: farely-welcome)
├── lib/
│   ├── travelpayouts.ts     # Travelpayouts client — searchRoute + searchAnywhere + getPriceCalendar + mock fallback
│   ├── claude.ts            # Claude NL parsing + vibe ranking
│   └── unsplash.ts          # Unsplash photo fetcher
├── .claude/                 # Claude Code config
└── CLAUDE.md
```

---

## Conventions

- **Naming:** camelCase for JS/TS variables, PascalCase for React components
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`)
- **Error handling:** Never swallow errors silently. API routes return `{ error: string }` with appropriate status codes.
- **Comments:** Only for non-obvious WHY. No what-comments.
- **Server vs Client:** API routes and data fetching in server components. Map and interactive UI in client components (`'use client'`). WorldMap must use `dynamic(..., { ssr: false })`.

---

## Key Implementation Notes

- **WorldMap** must always be imported via `dynamic(() => import('@/components/WorldMap'), { ssr: false })` — D3 uses browser APIs.
- **ThemeToggle** uses `createPortal(button, document.body)` with `position: fixed` on the button itself. It is rendered in `layout.tsx` after `{children}`. **Do not add `height: 100%` + `overflow-y: auto` to `body` in globals.css** — that makes `<body>` a scroll container which breaks `position: fixed` on iOS Safari and some Chromium builds (the button scrolls with the page). Let `<body>` grow naturally; viewport scrolling keeps fixed positioning viewport-relative.
- **Prompt caching:** `claude.ts` uses `cache_control: { type: 'ephemeral' }` on the system prompt to reduce latency on repeated AI searches.
- **Price color tiers (DealCard):** relative to mean of `allPrices` prop — ≤80% of mean → green `#1D9E75`, ≤110% → amber `#BA7517`, >110% → red `#D85A30`. Parent computes `allPrices = DEALS.map(d => d.price)` and passes to every card. FlightCard still uses absolute $150/$350 thresholds.
- **Skyscanner deep links:** `https://www.skyscanner.com/transport/flights/{from}/{to}/{YYYYMMDD}/?adults=1&utm_source=farely`
- **Search URL params:** SearchBar pushes `/results?from={IATA}&to={IATA}&fromName={name}&toName={name}&depart={date}&return={date}`. Validates that both IATA codes are set before navigating; shows inline error if missing.
- **AirportInput:** `components/AirportInput.tsx` — airport/city autocomplete via `https://autocomplete.travelpayouts.com/places2` (public, no API key). 250ms debounce, min 2 chars. Stores display name and IATA code separately. Supports `compact` prop for the results page nav bar. `useEffect` syncs `query` state when `value` prop changes (handles URL-driven navigation).
- **Nav links (page.tsx):** All links use Next.js `<Link>`. "Deals" → `#deals` anchor, "Explore map" + "Get started" → `/discover`, "Sign in" → `/signin`. page.tsx is a client component (`'use client'`).
- **Unsplash fallback:** If no API key or rate-limited, `getGradientFallback(cityName)` returns a deterministic Tailwind gradient.
- **Travelpayouts is the sole flight data source.** `lib/travelpayouts.ts` exports three functions: `searchRoute({ from, to, departDate?, returnDate? })` for Screen 2, `searchAnywhere({ from, budget })` for Screen 3 AI discovery, and `getPriceCalendar({ from, to, month })` for the price heat map. All fall back to mock data when `TRAVELPAYOUTS_TOKEN` is missing.
- **API response shape (`/v1/prices/cheap`):** `data.data` is keyed by destination IATA. Each value is an object keyed by stop count ("0", "1", "2") whose values are ticket objects `{ price, airline, departure_at, return_at, duration, flight_number, transfers }`. `searchAnywhere` picks the cheapest ticket per destination (one result per IATA). `searchRoute` returns all stop-count options for the route sorted by price.
- **`TravelpayoutsTicket` shape:** `{ origin, destination, price, airline, flightNumber, stops, duration, departureAt, returnAt, bookingLink }`. Used by `results/page.tsx` FlightRow and the `/api/flights` route.
- **results/page.tsx is a client component** — reads `from/to/depart/return` URL params from SearchBar, fetches `/api/flights`, renders `FlightRow` cards with mean-based price color, BEST DEAL badge on first result, airline badge, departure time, Aviasales book button. Spinner uses "Searching {from} → {to}…" italic text. Also passes `month` to `PriceCalendar`. `departDate` defaults to 30 days out when not in URL. `setFlights([])` is called at the start of each new search to clear stale results.
- **Booking links:** All Aviasales links are resolved to full URLs before use — `link.startsWith('http') ? link : 'https://www.aviasales.com' + link`. Book buttons use `window.open(..., '_blank', 'noopener,noreferrer')` (not `<a href>`) so Next.js router doesn't intercept the navigation.
- **PriceCalendar** calls `/api/calendar?from=&to=&month=YYYY-MM` (single request) instead of 7 parallel calls.
- **page.tsx** fetches `/api/anywhere?from=ATL&budget=800` on mount. Shows 10 animated skeleton cards while loading. Falls back to `FALLBACK_DEALS` on error. `IATA_META` object maps IATA codes → city+country for DealCard display.
- **discover/page.tsx** — fetches `/api/anywhere` on mount to seed map arcs. Chat results from ChatPanel override the arcs when present.
- **ai-search/route.ts** — uses Claude Haiku (`claude-haiku-4-5-20251001`) to parse query into `{ origin, budget, vibes }`, calls `searchAnywhere`, fetches Unsplash photos, returns top 6 results. Uses `IATA_CITY` lookup for city names.
- **Origin is hardcoded to ATL** on all three screens with `// TODO: detect user location via IP geolocation` comments. Replace these when geolocation is implemented.
- **Price color** on all screens uses relative-to-mean logic: ≤80% of mean → green, ≤110% → amber, >110% → red. `getPriceColor(price, mean)` implemented locally in results page and DealCard.
- **Affiliate links:** Aviasales format `https://www.aviasales.com/search/{FROM}{MMDD}{TO}1?marker={MARKER}&utm_source=farely`. `TRAVELPAYOUTS_MARKER` must be set for commission tracking.

---

## Design System

**Light theme (applied — matches wireframe reference):**
- Page background: `#f0f0ed`
- Surface (cards/containers): `#ffffff`
- Surface-2 (inputs): `#f5f5f5`
- Surface-3 (AI prompt bg): `#f9f9f9`
- Border: `#d0d0d0` (inputs/cards), `#e8e8e8` (section dividers), `#e0e0e0` (deal cards)
- Text primary: `#1a1a1a`, muted: `#888`

**Brand colors:**
- Green: `#1D9E75` (buttons, CTAs, cheap prices)
- Green dark: `#0F6E56` (BEST DEAL badge, green text on green bg)
- Amber: `#BA7517` (mid-range prices)
- Red: `#993C1D` (expensive prices)

**Price tiers:** green < $150, amber $150–350, red > $350

**Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui` (weights 400 and 600 only)

**Outer container pattern:** `max-w-[900px] mx-auto border border-[#d0d0d0] rounded-xl overflow-hidden bg-white`

**Component patterns:**
- Card: `border border-[#e0e0e0] rounded-lg bg-white`
- Input: `bg-[#f5f5f5] border border-[#d0d0d0] rounded-lg h-9 px-3 text-[10px]`
- CTA button: `bg-[#1D9E75] text-white rounded-lg font-semibold hover:bg-[#179968]`
- Chip: `bg-[#f5f5f5] border border-[#d0d0d0] rounded-full px-[10px] py-[3px] text-[10px]`
- AI prompt bar: `border-dashed border-[#c0c0c0] rounded-lg bg-[#f9f9f9]` (1.5px border)

**API tag colors (decorative badges):**
- Kiwi Tequila: bg `#E1F5EE`, text `#0F6E56`
- Claude API: bg `#EEEDFE`, text `#534AB7`
- Mapbox/D3: bg `#E6F1FB`, text `#185FA5`
- Unsplash: bg `#FAEEDA`, text `#854F0B`
- SendGrid: bg `#FAECE7`, text `#993C1D`
- Skyscanner: bg `#F1EFE8`, text `#5F5E5A`

**Restyled components (all):** SearchBar, AirportInput, AIPromptBar, WorldMap, FlightCard (compact + chat variants), DealCard, PriceCalendar, ChatPanel, page.tsx, results/page.tsx, discover/page.tsx

**Homepage redesign (2026-04-22):** Replaced wireframe placeholder boxes in hero with real typography (h1 + badge + subtext). Nav has real logo + "Get started" CTA. SearchBar non-compact mode uses inline styles with 48px inputs, shadow container, and "Round trip" chip active by default. AIPromptBar always shows "Search →" green button; tech API tags removed from visible UI. Map section has "POPULAR ROUTES FROM ATL" label and bordered container. Page container widened to max-w-[1100px].

**Tab bar removed (2026-04-22):** NavTabs ("1 — Home / Landing" etc.) removed from all three pages. LOGO placeholder boxes replaced with farely wordmark on results and discover. Tech label badges (Mapbox/D3, Kiwi Tequila, Claude API) removed from map canvas on results and discover. Bullet-point annotation box removed from discover map panel.

**Search mode toggle (2026-04-22):** Homepage hero has a pill toggle ("Classic search" / "✦ AI search") that conditionally renders either `<SearchBar />` or `<AIPromptBar />`. State: `searchMode: 'classic' | 'ai'`, default `'classic'`.

**Tailwind config additions:** `brand.green-dark`, `page`, `surface`, `surface-2`, `surface-3`, `border.light`, `border.card`, `ink`, `ink.muted` custom colors.

The frontend-design skill (`/.claude/skills/frontend-design/SKILL.md`) enforces these standards.

---

## Do Not Touch

- `.env.local` — never read, never modify, never commit
- `.next/` — generated build artifacts
- `node_modules/` — never hand-edit

---

## Current Priorities

1. Add `TRAVELPAYOUTS_TOKEN` + `TRAVELPAYOUTS_MARKER` to `.env.local`
2. Add `UNSPLASH_ACCESS_KEY` to `.env.local` — city photos in deal cards and chat results
3. Test all three screens:
   - Screen 1: homepage auto-fetches `ATL` deals on load
   - Screen 2: `/results?from=ATL&to=JFK&depart=2026-06-01`
   - Screen 3: `/discover?q=somewhere warm with beaches under $400`
4. Implement geolocation (`navigator.geolocation` + ipapi.co fallback) — replace all `// TODO: detect user location via IP geolocation` comments
5. Mobile responsive pass — layout breaks below ~700px (sidebar overflow, nav wrapping)

---

## Known Issues

- `COORD_MAP` in `page.tsx` uses IATA-keyed coordinates — city-level precision needs a geocoding API
- Tequila `fly_to=anywhere` returns IATA codes; city names come from `cityTo` field in response
- SendGrid `from` address (`alerts@farely.app`) needs DNS verification before production
- Price calendar cells retain light-mode colors in dark mode (intentional but slightly jarring)
- WorldMap may flash on arc prop change — D3 re-renders full SVG on each `useEffect` run
- No geolocation — origin hardcoded to ATL on homepage (LAX elsewhere)
- DEALS array in `page.tsx` is hardcoded — TODO: replace with Tequila /v2/flights once key arrives

---

## Session Notes

Detailed session history lives in `.claude/session-notes.md`. Run `/session-end` at the end of every work session.
