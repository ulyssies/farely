'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import AIPromptBar from '@/components/AIPromptBar'
import DealCard from '@/components/DealCard'
import MapSection from '@/components/MapSection'

const DEALS = [
  { city: 'Cancún',       country: 'Mexico',        iata: 'CUN', price: 189, stops: 0, duration: '3h 45m' },
  { city: 'Miami',        country: 'Florida',        iata: 'MIA', price: 58,  stops: 0, duration: '1h 40m' },
  { city: 'New York',     country: 'New York',       iata: 'JFK', price: 67,  stops: 0, duration: '2h 15m' },
  { city: 'London',       country: 'England',        iata: 'LHR', price: 312, stops: 1, duration: '9h 10m' },
  { city: 'Paris',        country: 'France',         iata: 'CDG', price: 389, stops: 1, duration: '9h 45m' },
  { city: 'Tokyo',        country: 'Japan',          iata: 'NRT', price: 589, stops: 1, duration: '14h 30m' },
  { city: 'San Juan',     country: 'Puerto Rico',    iata: 'SJU', price: 214, stops: 0, duration: '3h 10m' },
  { city: 'Los Angeles',  country: 'California',     iata: 'LAX', price: 129, stops: 0, duration: '4h 30m' },
  { city: 'Mexico City',  country: 'Mexico',         iata: 'MEX', price: 187, stops: 0, duration: '3h 45m' },
  { city: 'Vancouver',    country: 'Canada',         iata: 'YVR', price: 198, stops: 1, duration: '6h 20m' },
]

const ALL_PRICES = DEALS.map(d => d.price)

const COORD_MAP: Record<string, [number, number]> = {
  'CUN': [-86.9, 21.0], 'MIA': [-80.3, 25.8], 'JFK': [-73.8, 40.6],
  'LHR': [-0.5, 51.5],  'CDG': [2.5, 49.0],   'NRT': [140.4, 35.8],
  'SJU': [-66.0, 18.4], 'LAX': [-118.4, 33.9], 'MEX': [-99.1, 19.4],
  'YVR': [-123.2, 49.2],
}

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'classic' | 'ai'>('classic')
  const sampleArcs = DEALS.slice(0, 6).map(d => ({
    from: [-84.4, 33.7] as [number, number],
    to: (COORD_MAP[d.iata] ?? [0, 0]) as [number, number],
    label: d.city,
  }))

  return (
    <main className="min-h-screen bg-page py-5 px-4 pb-20">
      <div className="max-w-[1100px] mx-auto border border-stroke rounded-xl overflow-hidden bg-surface">

        {/* Nav */}
        <div className="flex items-center justify-between bg-white" style={{ padding: '14px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px', color: '#0a0a0a' }}>
            fare<span style={{ color: '#1D9E75' }}>ly</span>
          </span>
          <div className="flex items-center" style={{ gap: '20px' }}>
            <div className="flex items-center" style={{ gap: '28px' }}>
              <Link href="#deals" className="text-[13px] text-[#888] font-normal hover:text-[#0a0a0a] transition-colors" style={{ textDecoration: 'none' }}>Deals</Link>
              <Link href="/discover" className="text-[13px] text-[#888] font-normal hover:text-[#0a0a0a] transition-colors" style={{ textDecoration: 'none' }}>Explore map</Link>
              <Link href="/signin" className="text-[13px] text-[#888] font-normal hover:text-[#0a0a0a] transition-colors" style={{ textDecoration: 'none' }}>Sign in</Link>
            </div>
            <Link href="/discover" className="border border-[#0a0a0a] text-[#0a0a0a] bg-transparent hover:bg-[#0a0a0a] hover:text-white transition-colors" style={{ borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Get started
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '48px 24px 32px', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#E1F5EE',
            border: '1px solid #9FE1CB',
            borderRadius: '99px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#0F6E56',
            marginBottom: '20px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
            Real-time flight prices · AI-powered
          </div>

          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#0a0a0a',
            letterSpacing: '-1px',
            lineHeight: 1.15,
            marginBottom: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            Find flights<br />
            <span style={{ color: '#1D9E75' }}>you'll actually love</span>
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#888',
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto 32px',
          }}>
            Tell us where you want to feel. Our AI finds the
            flights that match your vibe and budget.
          </p>

          <div style={{
            display: 'flex',
            gap: '4px',
            background: '#f5f5f5',
            border: '1px solid #e5e5e5',
            borderRadius: '99px',
            padding: '3px',
            width: 'fit-content',
            margin: '0 auto 16px',
          }}>
            <button
              onClick={() => setSearchMode('classic')}
              style={{
                padding: '6px 18px',
                borderRadius: '99px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: searchMode === 'classic' ? 'white' : 'transparent',
                color: searchMode === 'classic' ? '#0a0a0a' : '#888',
                boxShadow: searchMode === 'classic' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Classic search
            </button>
            <button
              onClick={() => setSearchMode('ai')}
              style={{
                padding: '6px 18px',
                borderRadius: '99px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                background: searchMode === 'ai' ? '#1D9E75' : 'transparent',
                color: searchMode === 'ai' ? 'white' : '#888',
                boxShadow: searchMode === 'ai' ? '0 1px 4px rgba(29,158,117,0.3)' : 'none',
              }}
            >
              ✦ AI search
            </button>
          </div>

          {searchMode === 'classic' && <SearchBar />}
          {searchMode === 'ai' && <AIPromptBar />}
        </div>

        {/* Map strip */}
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#aaa',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            margin: '0 0 12px',
          }}>
            Popular Routes from ATL
          </p>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '12px', overflow: 'hidden' }}>
            <MapSection arcs={sampleArcs} />
          </div>
        </div>

        {/* Deal cards */}
        <div id="deals" className="px-4 py-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-semibold text-ink">Popular deals from Atlanta</span>
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56]">
              Live prices · ATL
            </span>
          </div>
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {DEALS.map((deal, i) => (
              <DealCard
                key={deal.iata}
                city={deal.city}
                country={deal.country}
                iata={deal.iata}
                price={deal.price}
                stops={deal.stops}
                duration={deal.duration}
                origin="ATL"
                allPrices={ALL_PRICES}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Price alert */}
        <div className="px-4 py-2.5 border-t border-stroke-light flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-semibold text-ink">Get price drop alerts</div>
            <div className="text-[10px] text-ink-muted">We'll email you when fares drop on your saved routes</div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#FAECE7] text-[#993C1D]">SendGrid</span>
            <div className="w-40 h-8 bg-surface-2 border border-stroke rounded-lg flex items-center px-3 text-[10px] text-ink-muted">
              Email input
            </div>
            <button className="h-8 px-4 bg-[#1D9E75] text-white text-[11px] font-semibold rounded-lg hover:bg-[#179968] transition-colors">
              Notify me
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
