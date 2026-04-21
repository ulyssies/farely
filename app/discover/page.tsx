'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import ChatPanel from '@/components/ChatPanel'
import NavTabs from '@/components/NavTabs'
import type { FlightResult } from '@/lib/tequila'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

type EnrichedFlight = FlightResult & {
  photo?: string | null
  ranking?: { score?: number; reason?: string; tags?: string[] }
}

const COORD_MAP: Record<string, [number, number]> = {
  'MX': [-99.1, 19.4], 'JP': [139.7, 35.7], 'FR': [2.3, 48.9], 'GB': [-0.1, 51.5],
  'TH': [100.5, 13.8], 'IT': [12.5, 41.9], 'ES': [-3.7, 40.4], 'AU': [151.2, -33.9],
  'BR': [-43.2, -22.9], 'DE': [13.4, 52.5], 'PE': [-77.0, -12.0], 'CR': [-84.1, 9.9],
  'US': [-95.7, 37.1], 'CA': [-79.4, 43.7], 'CL': [-70.7, -33.5], 'CO': [-74.1, 4.7],
  'PT': [-9.1, 38.7], 'GR': [23.7, 37.9],
}

function DiscoverInner() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? undefined
  const [results, setResults] = useState<EnrichedFlight[]>([])

  const originCoord: [number, number] = [-118.2, 33.9]
  const arcs = results.slice(0, 8).map(f => ({
    from: originCoord,
    to: (COORD_MAP[f.countryTo.code] ?? [0, 0]) as [number, number],
    label: f.cityTo,
  }))

  return (
    <main className="min-h-screen bg-page py-5 px-4 pb-20">
      <NavTabs />
      <div className="max-w-[900px] mx-auto border border-stroke rounded-xl overflow-hidden bg-surface">

        {/* Nav */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stroke-light flex-wrap">
          <div className="w-14 h-6 bg-surface-2 border border-stroke rounded-lg flex items-center justify-center text-[10px] font-semibold text-ink flex-shrink-0">
            LOGO
          </div>
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
            <WorldMap arcs={arcs} origin={originCoord} className="w-full" style={{ height: 320 } as React.CSSProperties} />
            <div className="flex flex-col gap-1 p-3 bg-surface border border-stroke-light rounded-lg self-start w-full max-w-[200px]">
              <div className="text-[9px] text-[#1D9E75]">• Multiple destination pins</div>
              <div className="text-[9px] text-ink-muted">• Color-coded by price tier</div>
              <div className="text-[9px] text-ink-muted">• Filtering updates map in real time</div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E6F1FB] text-[#185FA5]">Mapbox / D3</span>
              <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56]">Kiwi Tequila</span>
              <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#EEEDFE] text-[#534AB7]">Claude API</span>
            </div>
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
