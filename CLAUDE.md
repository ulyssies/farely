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
- **Flight data:** Kiwi Tequila API (`https://tequila.kiwi.com/v2`)
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
TEQUILA_API_KEY=     # Kiwi Tequila API key
ANTHROPIC_API_KEY=   # Anthropic Claude API key
UNSPLASH_ACCESS_KEY= # Unsplash API access key
SENDGRID_API_KEY=    # SendGrid API key for alerts
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
│       ├── flights/route.ts   # Tequila /v2/search proxy
│       ├── anywhere/route.ts  # fly_to=anywhere + Unsplash
│       ├── ai-search/route.ts # 5-step Claude AI flow
│       └── alert/route.ts     # SendGrid email signup
├── components/
│   ├── SearchBar.tsx        # Full/compact mode IATA search form
│   ├── AIPromptBar.tsx      # NL query input with suggestions
│   ├── WorldMap.tsx         # D3 + TopoJSON map (client-only)
│   ├── FlightCard.tsx       # Flight result card with AI ranking
│   ├── DealCard.tsx         # Homepage deal preview card
│   ├── PriceCalendar.tsx    # 7-day price heat map
│   └── ChatPanel.tsx        # AI discovery chat interface
├── lib/
│   ├── tequila.ts           # Kiwi Tequila API client
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
- **Prompt caching:** `claude.ts` uses `cache_control: { type: 'ephemeral' }` on the system prompt to reduce latency on repeated AI searches.
- **Price color tiers:** green `#1D9E75` < $150, amber `#BA7517` $150–350, red `#D85A30` > $350
- **Skyscanner deep links:** `https://www.skyscanner.com/transport/flights/{from}/{to}/{YYYYMMDD}/?adults=1&utm_source=farely`
- **Unsplash fallback:** If no API key or rate-limited, `getGradientFallback(cityName)` returns a deterministic Tailwind gradient.
- **fly_to=anywhere:** Tequila supports this natively — the anywhere API route uses it for "surprise me" deals.

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

**Tailwind config additions:** `brand.green-dark`, `page`, `surface`, `surface-2`, `surface-3`, `border.light`, `border.card`, `ink`, `ink.muted` custom colors.

The frontend-design skill (`/.claude/skills/frontend-design/SKILL.md`) enforces these standards.

---

## Do Not Touch

- `.env.local` — never read, never modify, never commit
- `.next/` — generated build artifacts
- `node_modules/` — never hand-edit

---

## Current Priorities

1. Add API keys to `.env.local` and test live data end-to-end (Tequila → Claude → Unsplash)
2. Test AI search: open `/discover?q=somewhere warm with beaches under $400`
3. Implement geolocation (`navigator.geolocation` + ipapi.co fallback) to auto-detect origin airport
4. Mobile responsive pass — layout breaks below ~700px (sidebar overflow, nav wrapping)
5. Add loading skeletons to FlightCard and DealCard

---

## Known Issues

- `COORD_MAP` in pages uses approximate country-level coordinates — city-level precision needs a geocoding API
- Tequila `fly_to=anywhere` returns IATA codes; city names come from `cityTo` field in response
- SendGrid `from` address (`alerts@farely.app`) needs DNS verification before production
- Price calendar cells retain light-mode colors in dark mode (intentional but slightly jarring)
- WorldMap may flash on arc prop change — D3 re-renders full SVG on each `useEffect` run
- No geolocation — origin defaults to LAX on all pages

---

## Session Notes

Detailed session history lives in `.claude/session-notes.md`. Run `/session-end` at the end of every work session.
