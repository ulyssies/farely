'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import PriceCalendar from '@/components/PriceCalendar'
import type { AmadeusFlight } from '@/lib/amadeus'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

const COORD_MAP: Record<string, [number, number]> = {
  'MEX': [-99.1, 19.4], 'NRT': [140.4, 35.8], 'CDG': [2.5, 49.0], 'LHR': [-0.5, 51.5],
  'BKK': [100.5, 13.8], 'FCO': [12.5, 41.9], 'MAD': [-3.7, 40.4], 'SYD': [151.2, -33.9],
  'GIG': [-43.2, -22.9], 'TXL': [13.4, 52.5], 'LIM': [-77.0, -12.0], 'SJO': [-84.1, 9.9],
  'LAX': [-118.4, 33.9], 'YYZ': [-79.4, 43.7], 'SCL': [-70.7, -33.5], 'BOG': [-74.1, 4.7],
  'LIS': [-9.1, 38.7], 'ATH': [23.7, 37.9], 'MIA': [-80.3, 25.8], 'JFK': [-73.8, 40.6],
  'CUN': [-86.9, 21.0], 'SJU': [-66.0, 18.4], 'ORD': [-87.9, 41.9], 'DFW': [-97.0, 32.9],
  'ATL': [-84.4, 33.7], 'YVR': [-123.2, 49.2],
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return iso
  const h = m[1] ? `${m[1]}h ` : ''
  const min = m[2] ? `${m[2]}m` : ''
  return `${h}${min}`.trim()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function FlightRow({ flight }: { flight: AmadeusFlight }) {
  const priceColor = flight.price < 150 ? '#1D9E75' : flight.price < 350 ? '#BA7517' : '#D85A30'
  return (
    <a
      href={flight.bookingLink}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
      className="block px-2.5 py-2 border-b border-stroke-light hover:bg-surface-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] font-semibold text-ink">{flight.origin} → {flight.destination}</span>
        <span className="text-[12px] font-bold" style={{ color: priceColor }}>${flight.price}</span>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-ink-muted">
        <span>{formatTime(flight.departureTime)} – {formatTime(flight.arrivalTime)}</span>
        <span>·</span>
        <span>{formatDuration(flight.duration)}</span>
        <span>·</span>
        <span>{flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
        <span className="ml-auto">{flight.airline}</span>
      </div>
    </a>
  )
}

function ResultsInner() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? 'LAX'
  const to = searchParams.get('to') ?? ''
  const departureDate = searchParams.get('depart') ?? ''
  const returnDate = searchParams.get('return') ?? ''
  const adults = searchParams.get('adults') ?? '1'

  const [flights, setFlights] = useState<AmadeusFlight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to || !departureDate) return
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ from, to, departureDate, adults })
    if (returnDate) params.append('returnDate', returnDate)

    fetch(`/api/flights?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setFlights(data.flights || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [from, to, departureDate, returnDate, adults])

  const originCoord: [number, number] = COORD_MAP[from] ?? [-95.7, 37.1]
  const destCoord = to ? COORD_MAP[to] : null
  const arcs = destCoord
    ? [{ from: originCoord, to: destCoord, label: to }]
    : flights.slice(0, 8).map(f => ({
        from: originCoord,
        to: (COORD_MAP[f.destination] ?? [0, 0]) as [number, number],
        label: f.destination,
      }))

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
          <SearchBar compact defaultOrigin={from} defaultDest={to}
            defaultDateFrom={departureDate} defaultDateTo={returnDate}
            defaultPassengers={parseInt(adults)} />
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
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>Showing <strong className="text-ink">{flights.length} flights</strong>{to && ` · ${from} → ${to}`}</span>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
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

            {!loading && flights.map(f => <FlightRow key={f.id} flight={f} />)}

            {to && !loading && <div className="p-2.5"><PriceCalendar flyFrom={from} flyTo={to} /></div>}
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
