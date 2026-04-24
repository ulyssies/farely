<div align="center">

# Farely

**Find flights you'll love — with AI and live prices.**

[![Status](https://img.shields.io/badge/Status-Active%20development-1D9E75?style=for-the-badge)](.)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Claude](https://img.shields.io/badge/Anthropic-Claude-c96442?style=for-the-badge)](https://anthropic.com)
[![Travelpayouts](https://img.shields.io/badge/Travelpayouts-API-1D9E75?style=for-the-badge)](https://travelpayouts.com)

> **Note:** Active development — add API keys, test all three screens, and review [known limitations](#known-limitations--roadmap) before shipping.

</div>

---

## What it does

**Farely** is an AI-powered flight search web app. Search with a real airport autocomplete like a traditional metasearch, or describe what you want — *"somewhere warm with great beaches under $400"* — and **Claude** suggests destinations and ranks results by vibe. The UI shows **live Travelpayouts prices**, an **interactive D3 world map** with great-circle arcs, hero **deal cards** with city photos, and **Aviasales** affiliate deep links for booking.

```
Airport autocomplete search  →  Travelpayouts prices  →  map + cards  →  book on Aviasales
Natural-language AI prompt   →  Claude parse + rank   →  map + cards  →  book on Aviasales
```

---

## Features

| Feature | Description |
|--------|-------------|
| **Classic search** | Airport autocomplete (origin + destination), dates — Travelpayouts `/v1/prices/cheap` via `/api/flights` |
| **AI discovery** | `/discover` — chat panel + map; Claude parses intent and re-ranks results by vibe (`/api/ai-search`) |
| **Surprise deals** | Homepage fetches cheapest live destinations from ATL via `/api/anywhere` |
| **Airport autocomplete** | Real-time city/airport suggestions from `autocomplete.travelpayouts.com` with 250ms debounce |
| **World map** | D3 + TopoJSON (Natural Earth), great-circle arcs; client-only dynamic import |
| **Price cues** | Mean-relative coloring: ≤80% of mean → green, ≤110% → amber, >110% → red |
| **Price calendar** | 7-day price heat map on results page via `/api/calendar` |
| **City photos** | Unsplash images per destination; region-specific gradient fallbacks when unavailable |
| **Price alerts** | Email signup via SendGrid (`/api/alert`) |
| **Light / dark** | Theme toggle with persisted preference |
| **Prompt caching** | Ephemeral cache on Claude system prompt to reduce repeat latency |

---

## How it works

1. **Search** — Browser calls Next.js **Route Handlers** under `app/api/*`; secrets stay server-side.
2. **Flights** — `lib/travelpayouts.ts` calls the **Travelpayouts API** (`/v1/prices/cheap`, `/v1/prices/calendar`) for live fares and falls back to mock data when the token is missing.
3. **AI (two-step)** — `lib/claude.ts` uses **Anthropic Claude Haiku** for (1) parsing the natural-language query into origin/budget/vibes, then (2) re-ranking `searchAnywhere` results by vibe relevance before returning the top 6.
4. **City names** — `lib/iata-meta.ts` provides a shared ~100-code lookup table. Unknown IATAs are resolved via the public Travelpayouts autocomplete endpoint (`Promise.allSettled` so failures never block rendering).
5. **Imagery** — `lib/unsplash.ts` fetches Unsplash photos by city name; `DealCard` falls back to region-specific CSS gradients if the fetch fails.
6. **Map** — `components/WorldMap.tsx` renders arcs in the browser only (no SSR for D3).
7. **Booking** — Aviasales affiliate links in `DDMM` date format: `aviasales.com/search/{FROM}{DDMM}{TO}1?marker={MARKER}&utm_source=farely`.

---

## Project structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, ThemeToggle
│   ├── globals.css             # Tailwind + CSS variables
│   ├── page.tsx                # Landing — live deal cards, map strip, search toggle
│   ├── results/page.tsx        # Classic search results — split map + flight rows + calendar
│   ├── discover/page.tsx       # AI discovery — chat panel + map
│   └── api/
│       ├── flights/route.ts    # Proxy Travelpayouts searchRoute (Screen 2)
│       ├── anywhere/route.ts   # Proxy Travelpayouts searchAnywhere (Screen 3)
│       ├── calendar/route.ts   # Proxy Travelpayouts getPriceCalendar (heat map)
│       ├── ai-search/route.ts  # Two-step Claude flow: parse → rank → photos
│       ├── unsplash/route.ts   # Unsplash proxy with 24hr cache
│       └── alert/route.ts      # SendGrid price alert signup
├── components/
│   ├── SearchBar.tsx           # Full / compact mode with AirportInput
│   ├── AirportInput.tsx        # Airport autocomplete (Travelpayouts public API)
│   ├── AIPromptBar.tsx         # Natural-language query input
│   ├── WorldMap.tsx            # D3 + TopoJSON — dynamic import only
│   ├── MapSection.tsx          # Homepage map strip (collapsible)
│   ├── FlightCard.tsx          # AI discovery result card
│   ├── DealCard.tsx            # Homepage deal card with photo + gradient fallback
│   ├── PriceCalendar.tsx       # 7-day price heat map
│   ├── ChatPanel.tsx           # AI discovery chat interface
│   └── ThemeToggle.tsx         # Fixed bottom-right theme toggle
├── lib/
│   ├── travelpayouts.ts        # searchRoute + searchAnywhere + getPriceCalendar + mock fallback
│   ├── iata-meta.ts            # Shared IATA → city/country lookup (~100 codes)
│   ├── claude.ts               # parseAISearchQuery (Haiku)
│   └── unsplash.ts             # City photo fetcher with gradient fallback
├── CLAUDE.md                   # Maintainer / agent source of truth
└── .env.local.example
```

---

## Getting started

### Prerequisites

- **Node.js 18+** and **npm**
- [Travelpayouts](https://travelpayouts.com/) API token + affiliate marker
- [Anthropic](https://console.anthropic.com/) API key
- [Unsplash](https://unsplash.com/developers) access key (optional — gradients used as fallback)
- [SendGrid](https://sendgrid.com/) API key (optional — for price alert emails)

### Install and run

```bash
cp .env.local.example .env.local
# Fill in your keys — never commit .env.local

npm install
npm run dev
```

Open **http://localhost:3000**

Test all three screens:
- **Screen 1 (deals):** http://localhost:3000
- **Screen 2 (results):** http://localhost:3000/results?from=ATL&to=JFK&depart=2026-06-01
- **Screen 3 (AI):** http://localhost:3000/discover?q=somewhere+warm+with+beaches+under+%24400

### Production build

```bash
npm run build
npm start
```

---

## Environment variables

Set these in **`.env.local`** (copy from `.env.local.example`). **Never commit `.env.local`.**

| Variable | Required | Description |
|----------|----------|-------------|
| `TRAVELPAYOUTS_TOKEN` | **Yes** | API token — flight search, anywhere deals, price calendar |
| `TRAVELPAYOUTS_MARKER` | **Yes** | Affiliate marker — included in all Aviasales booking links |
| `ANTHROPIC_API_KEY` | **Yes** | Claude Haiku — query parsing and vibe ranking |
| `UNSPLASH_ACCESS_KEY` | No | City photos; app falls back to region gradients if missing |
| `SENDGRID_API_KEY` | No | Price alert emails via `/api/alert` |

Without `TRAVELPAYOUTS_TOKEN` the app runs on mock flight data. Without `ANTHROPIC_API_KEY` the AI search and discover screens are unavailable.

---

## Deployment

- **Target:** **Vercel** — `next build` output, zero config needed.
- Set the same env vars in the Vercel project dashboard.
- For SendGrid, verify the **from** domain (`alerts@farely.app`) before relying on production mail delivery.
- `TRAVELPAYOUTS_MARKER` must be set for affiliate commission tracking on Aviasales clicks.

---

## Known limitations & roadmap

- **Origin hardcoded to ATL** — geolocation not yet implemented (`// TODO` comments mark every call site).
- **Map coordinates** — `COORD_MAP` covers ~37 airports; destinations outside it render arcs to map center `[0, 0]`. A geocoding API would fix this.
- **Responsive** — Layout needs a pass below ~700px (sidebar overflow, nav wrapping).
- **WorldMap flash** — D3 re-renders the full SVG on arc prop changes.
- **SendGrid sender** — DNS and sender identity must be verified for production mail.

---

## Acknowledgments

- [Anthropic Claude](https://anthropic.com/) — natural language parsing and vibe ranking
- [Travelpayouts](https://travelpayouts.com/) — flight price API and airport autocomplete
- [Aviasales](https://aviasales.com/) — booking affiliate partner
- [Unsplash](https://unsplash.com/) — city photography
- [SendGrid](https://sendgrid.com/) — transactional email
- [Next.js](https://nextjs.org/) — App Router and API routes
- [D3.js](https://d3js.org/) & [TopoJSON](https://github.com/topojson/topojson) — map and arcs

---

<div align="center">
<sub>See <code>CLAUDE.md</code> for implementation conventions and agent instructions</sub>
</div>
