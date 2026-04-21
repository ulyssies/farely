<div align="center">

# Farely

**Find flights you’ll love — with AI and live prices.**

[![Status](https://img.shields.io/badge/Status-Active%20development-1D9E75?style=for-the-badge)](.)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Claude](https://img.shields.io/badge/Anthropic-Claude-c96442?style=for-the-badge)](https://anthropic.com)
[![Kiwi Tequila](https://img.shields.io/badge/Kiwi-Tequila-85EA2D?style=for-the-badge)](https://tequila.kiwi.com/portal/docs/tequila_api)

> **Note:** Baseline build — not production-hardened. Add keys, test end-to-end, and review [known limitations](#known-limitations--roadmap) before shipping.

</div>

---

## What it does

**Farely** is an AI-powered flight search web app. Search with **IATA airport codes** like a traditional metasearch, or describe what you want — *“somewhere warm with great beaches under $400”* — and **Claude** suggests destinations and ranks results to match the vibe. The UI shows **live Tequila (Kiwi) prices**, an **interactive D3 world map** with great-circle arcs, hero **deal cards**, and **Skyscanner** deep links for booking.

```
IATA search or natural-language prompt → Tequila prices + Claude ranking → map + cards → book on Skyscanner
```

---

## Features

| Feature | Description |
|--------|-------------|
| **Classic search** | Origin, destination, dates — Tequila `/v2/search` via `/api/flights` |
| **AI discovery** | `/discover` — chat-style panel + map; Claude parses intent and ranks flights (`/api/ai-search`) |
| **Surprise deals** | `fly_to=anywhere` — homepage and `/api/anywhere` for open-ended cheap trips |
| **World map** | D3 + TopoJSON (Natural Earth), great-circle arcs; client-only, dynamic import |
| **Price cues** | Tiered colors: green &lt; $150, amber $150–350, red &gt; $350 |
| **Price calendar** | 7-day heat-style view on results |
| **Photos** | Unsplash city imagery with deterministic gradient fallbacks |
| **Price alerts** | Email signup via SendGrid (`/api/alert`) |
| **Light / dark** | Theme toggle with persisted preference |
| **Prompt caching** | Ephemeral cache on Claude system prompt to reduce repeat latency |

---

## How it works

1. **Search** — Browser calls Next.js **Route Handlers** under `app/api/*`; secrets stay server-side (`TEQUILA_API_KEY`, etc.).
2. **Flights** — `lib/tequila.ts` talks to Kiwi **Tequila API** (`https://tequila.kiwi.com/v2`).
3. **AI** — `lib/claude.ts` uses **Anthropic Claude** (`@anthropic-ai/sdk`) for natural-language parsing, destination ideas, and ranking copy.
4. **Imagery** — `lib/unsplash.ts` fetches Unsplash photos; if the key is missing or rate-limited, gradients are used instead.
5. **Map** — `components/WorldMap.tsx` renders arcs in the browser only (no SSR for D3).
6. **Booking** — Links follow the Skyscanner URL pattern documented in `CLAUDE.md` (utm includes `farely`).

---

## Project structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, theme script, ThemeToggle
│   ├── globals.css             # Tailwind + CSS variables (light/dark)
│   ├── page.tsx                # Landing — deals, map strip, search + AI bar
│   ├── results/page.tsx        # Split map + flight cards + calendar
│   ├── discover/page.tsx       # AI discovery — chat + map
│   └── api/
│       ├── flights/route.ts    # Proxy Tequila search
│       ├── anywhere/route.ts   # fly_to=anywhere + Unsplash
│       ├── ai-search/route.ts  # Claude-powered search flow
│       └── alert/route.ts      # SendGrid price alerts
├── components/
│   ├── SearchBar.tsx
│   ├── AIPromptBar.tsx
│   ├── WorldMap.tsx            # dynamic(..., { ssr: false }) only
│   ├── FlightCard.tsx
│   ├── DealCard.tsx
│   ├── PriceCalendar.tsx
│   ├── ChatPanel.tsx
│   ├── NavTabs.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── tequila.ts
│   ├── claude.ts
│   └── unsplash.ts
├── CLAUDE.md                   # Maintainer / agent source of truth
└── .env.local.example
```

---

## Getting started

### Prerequisites

- **Node.js 18+** and **npm**
- [Kiwi Tequila](https://tequila.kiwi.com/portal/) API key  
- [Anthropic](https://console.anthropic.com/) API key  
- [Unsplash](https://unsplash.com/developers) access key (optional but recommended for photos)  
- [SendGrid](https://sendgrid.com/) API key (optional for alert emails)

### Install and run

```bash
cp .env.local.example .env.local
# Add your keys to .env.local — never commit this file

npm install
npm run dev
```

Open **http://localhost:3000** · Try AI discovery at **http://localhost:3000/discover?q=somewhere warm with beaches under $400**

### Production build

```bash
npm run build
npm start
```

---

## Environment variables

Set these in **`.env.local`** (see `.env.local.example`). **Do not commit** `.env.local`.

| Variable | Required | Description |
|----------|----------|-------------|
| `TEQUILA_API_KEY` | **Yes** | Kiwi Tequila API — flight search and anywhere deals |
| `ANTHROPIC_API_KEY` | **Yes** | Claude — AI search, parsing, and ranking |
| `UNSPLASH_ACCESS_KEY` | No* | City photos; app falls back to gradients if missing |
| `SENDGRID_API_KEY` | No* | Price alert emails via `/api/alert` |

\*App runs without them, but features degrade (no real photos / no email sends).

---

## Deployment

- **Target:** **Vercel** (or any Node host that runs `next build` / `next start`).
- Set the same env vars in the host dashboard.
- For SendGrid, verify the **from** domain (e.g. `alerts@farely.app`) before relying on production mail delivery.

---

## Known limitations & roadmap

From the current baseline (see `CLAUDE.md` for detail):

- **Origin defaults** — No geolocation yet; defaults such as LAX until auto-detect is added.
- **Map coordinates** — `COORD_MAP` is approximate; geocoding would improve arc accuracy.
- **Responsive** — Layout needs a pass below ~700px (sidebar overflow, nav wrapping).
- **Loading UX** — Skeletons for cards are not in place yet.
- **WorldMap** — Full SVG can re-render when arcs change (possible flash).
- **SendGrid** — DNS and sender identity must be verified for production mail.

---

## Acknowledgments

- [Anthropic Claude](https://anthropic.com/) — natural language and ranking  
- [Kiwi Tequila](https://tequila.kiwi.com/) — flight search API  
- [Unsplash](https://unsplash.com/) — photography  
- [SendGrid](https://sendgrid.com/) — transactional email  
- [Next.js](https://nextjs.org/) — App Router and API routes  
- [D3.js](https://d3js.org/) & [TopoJSON](https://github.com/topojson/topojson) — map and arcs  
- [Skyscanner](https://www.skyscanner.com/) — booking deep links (third-party site)

---

<div align="center">
<sub>Baseline build · See <code>CLAUDE.md</code> for implementation conventions</sub>
</div>
