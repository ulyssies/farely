'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import AIPromptBar from '@/components/AIPromptBar'
import DealCard from '@/components/DealCard'
import MapSection from '@/components/MapSection'

// TODO: detect user location via IP geolocation
const ORIGIN = 'ATL'
const ORIGIN_COORD: [number, number] = [-84.4, 33.7]

// City+country metadata for IATA codes returned by Travelpayouts
const IATA_META: Record<string, { city: string; country: string }> = {
  MIA: { city: 'Miami',         country: 'Florida'      },
  JFK: { city: 'New York',      country: 'New York'     },
  LAX: { city: 'Los Angeles',   country: 'California'   },
  MEX: { city: 'Mexico City',   country: 'Mexico'       },
  CUN: { city: 'Cancún',        country: 'Mexico'       },
  SJU: { city: 'San Juan',      country: 'Puerto Rico'  },
  LHR: { city: 'London',        country: 'England'      },
  CDG: { city: 'Paris',         country: 'France'       },
  NRT: { city: 'Tokyo',         country: 'Japan'        },
  YVR: { city: 'Vancouver',     country: 'Canada'       },
  ORD: { city: 'Chicago',       country: 'Illinois'     },
  DFW: { city: 'Dallas',        country: 'Texas'        },
  DEN: { city: 'Denver',        country: 'Colorado'     },
  SFO: { city: 'San Francisco', country: 'California'   },
  BOS: { city: 'Boston',        country: 'Massachusetts'},
  SEA: { city: 'Seattle',       country: 'Washington'   },
  LIS: { city: 'Lisbon',        country: 'Portugal'     },
  BCN: { city: 'Barcelona',     country: 'Spain'        },
  FCO: { city: 'Rome',          country: 'Italy'        },
  AMS: { city: 'Amsterdam',     country: 'Netherlands'  },
  BKK: { city: 'Bangkok',       country: 'Thailand'     },
  SYD: { city: 'Sydney',        country: 'Australia'    },
}

const COORD_MAP: Record<string, [number, number]> = {
  CUN: [-86.9, 21.0], MIA: [-80.3, 25.8], JFK: [-73.8, 40.6],
  LHR: [-0.5, 51.5],  CDG: [2.5, 49.0],   NRT: [140.4, 35.8],
  SJU: [-66.0, 18.4], LAX: [-118.4, 33.9], MEX: [-99.1, 19.4],
  YVR: [-123.2, 49.2], ORD: [-87.9, 41.9], DFW: [-97.0, 32.9],
  DEN: [-104.9, 39.7], SFO: [-122.4, 37.8], BOS: [-71.1, 42.4],
  SEA: [-122.3, 47.6], LIS: [-9.1, 38.7], BCN: [2.1, 41.4],
  FCO: [12.5, 41.9], AMS: [4.9, 52.3], BKK: [100.5, 13.8], SYD: [151.2, -33.9],
}

interface Deal {
  city: string
  country: string
  iata: string
  price: number
  stops: number
  duration: string
}

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'classic' | 'ai'>('classic')
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)

  useEffect(() => {
    // TODO: detect user location via IP geolocation
    fetch(`/api/anywhere?from=${ORIGIN}&budget=800`)
      .then(r => r.json())
      .then(data => {
        const flights: any[] = data.flights || []
        if (flights.length === 0) return
        const mapped: Deal[] = flights.slice(0, 10).map(f => {
          const meta = IATA_META[f.destination] ?? { city: f.destination, country: '' }
          return {
            city: meta.city,
            country: meta.country,
            iata: f.destination,
            price: f.price,
            stops: f.stops,
            duration: f.duration,
          }
        })
        setDeals(mapped)
      })
      .catch(() => {})
      .finally(() => setDealsLoading(false))
  }, [])

  const allPrices = deals.map(d => d.price)

  const sampleArcs = deals.slice(0, 6).map(d => ({
    from: ORIGIN_COORD,
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
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: '99px',
            padding: '4px 12px', fontSize: '11px', fontWeight: 500, color: '#0F6E56', marginBottom: '20px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
            Real-time flight prices · AI-powered
          </div>

          <h1 style={{
            fontSize: '42px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-1px',
            lineHeight: 1.15, marginBottom: '12px', fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            Find flights<br />
            <span style={{ color: '#1D9E75' }}>you'll actually love</span>
          </h1>

          <p style={{
            fontSize: '15px', color: '#888', fontWeight: 400, lineHeight: 1.6,
            maxWidth: '400px', margin: '0 auto 32px',
          }}>
            Tell us where you want to feel. Our AI finds the
            flights that match your vibe and budget.
          </p>

          <div style={{
            display: 'flex', gap: '4px', background: '#f5f5f5', border: '1px solid #e5e5e5',
            borderRadius: '99px', padding: '3px', width: 'fit-content', margin: '0 auto 16px',
          }}>
            <button
              onClick={() => setSearchMode('classic')}
              style={{
                padding: '6px 18px', borderRadius: '99px', border: 'none', fontSize: '12px',
                fontWeight: 500, cursor: 'pointer',
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
                padding: '6px 18px', borderRadius: '99px', border: 'none', fontSize: '12px',
                fontWeight: 500, cursor: 'pointer',
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
            fontSize: '11px', fontWeight: 600, color: '#aaa',
            textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px',
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
              {dealsLoading ? 'Loading prices…' : 'Live prices · ATL'}
            </span>
          </div>
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {dealsLoading
              ? Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="border border-[#e0e0e0] rounded-lg bg-white overflow-hidden animate-pulse">
                    <div className="h-20 bg-[#e8e8e8]" />
                    <div className="p-2 flex flex-col gap-1.5">
                      <div className="h-3 bg-[#e8e8e8] rounded w-3/4" />
                      <div className="h-2.5 bg-[#e8e8e8] rounded w-1/2" />
                      <div className="h-3 bg-[#e8e8e8] rounded w-1/3" />
                    </div>
                  </div>
                ))
              : deals.length === 0
                ? <p className="text-[11px] text-[#888] col-span-full py-6 text-center">No deals available right now. Check back soon.</p>
                : deals.map((deal, i) => (
                    <DealCard
                      key={deal.iata}
                      city={deal.city}
                      country={deal.country}
                      iata={deal.iata}
                      price={deal.price}
                      stops={deal.stops}
                      duration={deal.duration}
                      origin={ORIGIN}
                      allPrices={allPrices}
                      index={i}
                    />
                  ))
            }
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
