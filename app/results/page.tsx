'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import PriceCalendar from '@/components/PriceCalendar'
import type { TravelpayoutsTicket } from '@/lib/travelpayouts'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

const COORD_MAP: Record<string, [number, number]> = {
  'MEX': [-99.1, 19.4], 'NRT': [140.4, 35.8], 'CDG': [2.5, 49.0], 'LHR': [-0.5, 51.5],
  'BKK': [100.5, 13.8], 'FCO': [12.5, 41.9], 'MAD': [-3.7, 40.4], 'SYD': [151.2, -33.9],
  'LAX': [-118.4, 33.9], 'YYZ': [-79.4, 43.7], 'SCL': [-70.7, -33.5], 'BOG': [-74.1, 4.7],
  'LIS': [-9.1, 38.7],  'ATH': [23.7, 37.9],  'MIA': [-80.3, 25.8], 'JFK': [-73.8, 40.6],
  'CUN': [-86.9, 21.0], 'SJU': [-66.0, 18.4], 'ORD': [-87.9, 41.9], 'DFW': [-97.0, 32.9],
  'ATL': [-84.4, 33.7], 'YVR': [-123.2, 49.2], 'BCN': [2.1, 41.4], 'AMS': [4.9, 52.3],
  'DEN': [-104.9, 39.7], 'SFO': [-122.4, 37.8], 'BOS': [-71.1, 42.4], 'SEA': [-122.3, 47.6],
}

function getPriceColor(price: number, mean: number): string {
  const pct = price / mean
  if (pct <= 0.8) return '#1D9E75'
  if (pct <= 1.1) return '#BA7517'
  return '#D85A30'
}

interface FlightRowProps {
  flight: TravelpayoutsTicket
  mean: number
  isBestDeal: boolean
}

function FlightRow({ flight, mean, isBestDeal }: FlightRowProps) {
  const color = getPriceColor(flight.price, mean)
  const departTime = flight.departureAt
    ? new Date(flight.departureAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null
  const stopsLabel = flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
  const fullLink = flight.bookingLink.startsWith('http')
    ? flight.bookingLink
    : `https://www.aviasales.com${flight.bookingLink}`

  return (
    <div
      onClick={() => window.open(fullLink, '_blank', 'noopener,noreferrer')}
      className="block px-2.5 py-2.5 border-b border-stroke-light hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {isBestDeal && (
        <div className="text-[9px] font-semibold mb-1" style={{ color: '#0F6E56' }}>BEST DEAL</div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {flight.airline && (
            <div className="bg-surface-2 border border-stroke rounded text-[8px] text-ink-muted px-1.5 py-0.5 inline-block mb-1">
              {flight.airline}
            </div>
          )}
          {departTime && (
            <div className="text-[12px] font-semibold text-ink">{departTime}</div>
          )}
          <div className="text-[10px] text-ink-muted">
            {stopsLabel} · {flight.duration}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[20px] font-semibold leading-none" style={{ color }}>${flight.price}</div>
          <div className="mt-1 inline-flex items-center justify-center px-3 h-[26px] bg-[#1D9E75] text-white text-[10px] font-medium rounded-lg hover:bg-[#179968] transition-colors">
            Book →
          </div>
          <div className="text-[8px] text-ink-muted mt-0.5">via Aviasales</div>
        </div>
      </div>
    </div>
  )
}

function ResultsInner() {
  const searchParams = useSearchParams()
  // TODO: detect user location via IP geolocation
  const from = searchParams.get('from') ?? 'ATL'
  const to = searchParams.get('to') ?? ''
  const fromName = searchParams.get('fromName') ?? (from ? `${from}` : 'Atlanta (ATL)')
  const toName = searchParams.get('toName') ?? to
  const defaultDepart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const departDate = searchParams.get('depart') ?? searchParams.get('departDate') ?? defaultDepart
  const returnDate = searchParams.get('return') ?? searchParams.get('returnDate') ?? ''

  const [flights, setFlights] = useState<TravelpayoutsTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to) return
    setFlights([])
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ from, to })
    if (departDate) params.append('departDate', departDate)
    if (returnDate) params.append('returnDate', returnDate)

    fetch(`/api/flights?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setFlights(data.flights || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [from, to, departDate, returnDate])

  const allPrices = flights.map(f => f.price)
  const mean = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 300

  const originCoord: [number, number] = COORD_MAP[from] ?? [-95.7, 37.1]
  const destCoord = to ? COORD_MAP[to] : null
  const arcs = destCoord
    ? [{ from: originCoord, to: destCoord, label: to }]
    : flights.slice(0, 8).map(f => ({
        from: originCoord,
        to: (COORD_MAP[f.destination] ?? [0, 0]) as [number, number],
        label: f.destination,
      }))

  const calendarMonth = departDate ? departDate.slice(0, 7) : new Date().toISOString().slice(0, 7)

  return (
    <main className="min-h-screen bg-page py-5 px-4 pb-20">
      <div className="max-w-[900px] mx-auto border border-stroke rounded-xl overflow-hidden bg-surface">

        {/* Nav */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stroke-light flex-wrap">
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px', color: '#0a0a0a' }}>
              fare<span style={{ color: '#1D9E75' }}>ly</span>
            </span>
          </Link>
          <SearchBar compact
            defaultOrigin={from} defaultOriginName={fromName}
            defaultDest={to} defaultDestName={toName}
            defaultDateFrom={departDate} defaultDateTo={returnDate}
            defaultPassengers={1} />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-stroke-light flex-wrap">
          <span className="text-[10px] text-ink-muted">Filter:</span>
          {['Stops', 'Airlines', 'Price', 'Departure time', 'Duration'].map(f => (
            <span key={f} className="bg-surface-2 border border-stroke rounded-full px-[10px] py-[3px] text-[10px] text-ink cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors">{f}</span>
          ))}
        </div>

        {/* Split layout */}
        <div className="flex" style={{ minHeight: 420 }}>
          {/* Map */}
          <div className="flex-1 bg-page border-r border-stroke-light flex flex-col items-center justify-center gap-2 p-5">
            <WorldMap arcs={arcs} origin={originCoord} className="w-full" style={{ height: 300 } as React.CSSProperties} />
          </div>

          {/* Sidebar */}
          <div className="w-[300px] flex-shrink-0 overflow-y-auto bg-surface">
            <div className="px-2.5 py-1.5 border-b border-stroke-light text-[10px] text-ink-muted">
              {loading
                ? <span>Searching {from}{to ? ` → ${to}` : ''}…</span>
                : <span>Showing <strong className="text-ink">{flights.length} flights</strong>{to && ` · ${from} → ${to}`}</span>
              }
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-ink-muted italic text-center animate-pulse">
                  Searching flights…
                </p>
              </div>
            )}

            {error && (
              <div className="px-3 py-4 text-[11px] text-[#D85A30]">{error}</div>
            )}

            {!loading && !error && flights.length === 0 && (
              <div className="text-center py-12 text-[11px] text-ink-muted">
                {to ? 'No flights found.' : 'Enter a destination to search.'}<br />
                <span className="text-[10px]">Try different dates or destination.</span>
              </div>
            )}

            {!loading && flights.map((f, i) => (
              <FlightRow key={`${f.destination}-${i}`} flight={f} mean={mean} isBestDeal={i === 0} />
            ))}

            {to && !loading && (
              <div className="p-2.5">
                <PriceCalendar flyFrom={from} flyTo={to} month={calendarMonth} />
              </div>
            )}
          </div>
        </div>

        {/* AI search bottom pill */}
        <div className="px-3 py-2 border-t border-stroke-light flex justify-end">
          <a href={`/discover?q=show me the cheapest beach in May from ${from}`}
            className="inline-flex items-center gap-2 bg-surface-2 border border-stroke rounded-full px-3.5 py-[7px] hover:border-[#1D9E75] transition-colors">
            <span className="text-[13px]">✨</span>
            <span className="text-[11px] font-medium text-ink">Try AI search — "show me the cheapest beach in May"</span>
          </a>
        </div>

      </div>
    </main>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ResultsInner />
    </Suspense>
  )
}
