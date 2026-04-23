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
- **Flight data:** Amadeus API (`https://test.api.amadeus.com`) for classic search; Kiwi Tequila API stubbed for AI discovery
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
AMADEUS_API_KEY=         # Amadeus test API key (classic route search)
AMADEUS_API_SECRET=      # Amadeus test API secret
TEQUILA_API_KEY=coming_soon   # Stubbed; set to real key when available
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
│       ├── flights/route.ts   # Amadeus /v2/shopping/flight-offers proxy
│       ├── anywhere/route.ts  # Tequila stub (mock data) + Unsplash photos
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
│   ├── amadeus.ts           # Amadeus API client — token caching + normalizeAmadeusOffer
│   ├── tequila.ts           # Tequila stub — FlightResult type + searchAnywhere (mock)
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
- **Search URL params:** SearchBar (non-compact) pushes `/results?from={IATA}&to={IATA}&depart={date}&return={date}`. Validates that both `from` and `to` are non-empty before navigating; shows inline error in `#D85A30` if either is missing.
- **Nav links (page.tsx):** All links use Next.js `<Link>`. "Deals" → `#deals` anchor, "Explore map" + "Get started" → `/discover`, "Sign in" → `/signin`. page.tsx is a client component (`'use client'`).
- **Unsplash fallback:** If no API key or rate-limited, `getGradientFallback(cityName)` returns a deterministic Tailwind gradient.
- **fly_to=anywhere:** `/api/anywhere` calls `searchAnywhere` from `lib/tequila.ts`. When `TEQUILA_API_KEY` is missing or equals `'coming_soon'`, it returns 10 hardcoded mock destinations (Cancún, Miami, New York, etc.). Set a real key to get live Tequila data.
- **Amadeus integration:** `lib/amadeus.ts` handles OAuth2 `client_credentials` token fetching and caches the token in module scope (refreshed 60s before expiry). `normalizeAmadeusOffer` maps raw Amadeus offers to `{ id, price, currency, origin, destination, departureTime, arrivalTime, duration, stops, airline, bookingLink }`. `results/page.tsx` is a client component that fetches `/api/flights?from=&to=&departureDate=&returnDate=&adults=` and renders inline `FlightRow` cards (not `FlightCard` — shapes are incompatible).
- **results/page.tsx is a client component** — uses `useSearchParams` to read `from/to/depart/return/adults` URL params from SearchBar. Shows spinner while loading. FlightRow renders destination, time, duration, stops, airline, price with Skyscanner booking link.
- **discover/page.tsx** — fetches `/api/anywhere` on mount to populate map arcs with mock destinations. Chat results from ChatPanel override the arcs when present.

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

**Restyled components (all):** SearchBar, AIPromptBar, WorldMap, FlightCard (compact + chat variants), DealCard, PriceCalendar, ChatPanel, page.tsx, results/page.tsx, discover/page.tsx

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

1. Add `AMADEUS_API_KEY` + `AMADEUS_API_SECRET` to `.env.local` — needed for `/results` classic search
2. Add `UNSPLASH_ACCESS_KEY` to `.env.local` — deal card images load via `/api/unsplash?city=`
3. Test classic search: navigate to `/results?from=ATL&to=JFK&depart=2026-06-01`
4. Test AI search: open `/discover?q=somewhere warm with beaches under $400`
5. Implement geolocation (`navigator.geolocation` + ipapi.co fallback) to auto-detect origin airport
6. Mobile responsive pass — layout breaks below ~700px (sidebar overflow, nav wrapping)
7. Replace hardcoded `DEALS` array in `page.tsx` with live data (Amadeus or Tequila) when keys are available

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
