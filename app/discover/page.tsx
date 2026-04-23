'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ChatPanel from '@/components/ChatPanel'
import type { FlightResult } from '@/lib/tequila'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

type EnrichedFlight = FlightResult & {
  photo?: string | null
  ranking?: { score?: number; reason?: string; tags?: string[] }
}

// IATA → [lng, lat] for mock anywhere results
const DEST_COORDS: Record<string, [number, number]> = {
  'CUN': [-86.9, 21.0], 'MIA': [-80.3, 25.8], 'JFK': [-73.8, 40.6],
  'SJU': [-66.0, 18.4], 'LAX': [-118.4, 33.9], 'MEX': [-99.1, 19.4],
  'LHR': [-0.5, 51.5],  'CDG': [2.5, 49.0],   'NRT': [140.4, 35.8],
  'YVR': [-123.2, 49.2],
}

const ORIGIN_COORD: [number, number] = [-84.4, 33.7] // ATL

function DiscoverInner() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  const [results, setResults] = useState<EnrichedFlight[]>([])
  const [anywhereFlights, setAnywhereFlights] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/anywhere')
      .then(r => r.json())
      .then(data => setAnywhereFlights(data.flights || []))
      .catch(() => {})
  }, [])

  const arcs = (results.length > 0 ? results : anywhereFlights).slice(0, 8).map((f: any) => {
    const iata = f.flyTo ?? f.fly_to ?? ''
    const coord = DEST_COORDS[iata] ?? [0, 0]
    return {
      from: ORIGIN_COORD,
      to: coord as [number, number],
      label: f.cityTo ?? f.city_to ?? iata,
    }
  })

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
          <div className="flex-1 min-w-[100px] h-8 border border-dashed border-stroke rounded-lg bg-surface-3 flex items-center px-2.5 gap-1.5"
            style={{ borderWidth: '1.5px' }}>
            <span className="text-[11px]">✨</span>
            <span className="text-[10px] text-ink-muted italic truncate">
              {initialQuery ?? '"I have $400 and 5 days — where can I go from ATL?"'}
            </span>
          </div>
          <a href="/results"
            className="h-8 px-2.5 border border-stroke rounded-lg flex items-center text-[10px] text-ink gap-1 hover:border-[#1D9E75] transition-colors flex-shrink-0">
            ← Classic search
          </a>
        </div>

        {/* Split layout: map left, chat right */}
        <div className="flex" style={{ minHeight: 460 }}>
          {/* Map */}
          <div className="flex-1 bg-page border-r border-stroke-light flex flex-col items-center justify-center gap-2 p-5">
            <WorldMap arcs={arcs} origin={ORIGIN_COORD} className="w-full" style={{ height: 320 } as React.CSSProperties} />
          </div>

          {/* Chat panel */}
          <div className="w-[300px] flex-shrink-0 flex flex-col">
            <ChatPanel initialQuery={initialQuery} onResultsChange={setResults} />
          </div>
        </div>

      </div>
    </main>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <DiscoverInner />
    </Suspense>
  )
}
