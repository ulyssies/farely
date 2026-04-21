import dynamic from 'next/dynamic'
import FlightCard from '@/components/FlightCard'
import SearchBar from '@/components/SearchBar'
import PriceCalendar from '@/components/PriceCalendar'
import NavTabs from '@/components/NavTabs'
import { searchFlights } from '@/lib/tequila'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

interface SearchParams {
  fly_from?: string; fly_to?: string; date_from?: string
  date_to?: string; adults?: string; cabin?: string; sort?: string
}

async function fetchResults(params: SearchParams) {
  try {
    const today = new Date()
    const defaultFrom = new Date(today)
    defaultFrom.setDate(defaultFrom.getDate() + 14)
    const defaultTo = new Date(defaultFrom)
    defaultTo.setDate(defaultTo.getDate() + 14)

    const flights = await searchFlights({
      fly_from: params.fly_from ?? 'LAX',
      fly_to: params.fly_to,
      date_from: params.date_from ?? defaultFrom.toISOString().slice(0, 10),
      date_to: params.date_to ?? defaultTo.toISOString().slice(0, 10),
      adults: parseInt(params.adults ?? '1', 10),
      selected_cabins: (params.cabin as 'M' | 'W' | 'C' | 'F') ?? 'M',
      sort: (params.sort as 'price' | 'duration' | 'quality') ?? 'price',
      limit: 20,
    })

    const cities = Array.from(new Set(flights.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)
    return flights.map(f => ({ ...f, photo: photos[f.cityTo] ?? null }))
  } catch (err) {
    console.error('Results fetch error:', err)
    return []
  }
}

const COORD_MAP: Record<string, [number, number]> = {
  'MX': [-99.1, 19.4], 'JP': [139.7, 35.7], 'FR': [2.3, 48.9], 'GB': [-0.1, 51.5],
  'TH': [100.5, 13.8], 'IT': [12.5, 41.9], 'ES': [-3.7, 40.4], 'AU': [151.2, -33.9],
  'BR': [-43.2, -22.9], 'DE': [13.4, 52.5], 'PE': [-77.0, -12.0], 'CR': [-84.1, 9.9],
  'US': [-95.7, 37.1], 'CA': [-79.4, 43.7], 'CL': [-70.7, -33.5], 'CO': [-74.1, 4.7],
  'PT': [-9.1, 38.7], 'GR': [23.7, 37.9],
}

export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const flights = await fetchResults(searchParams)
  const flyFrom = searchParams.fly_from ?? 'LAX'
  const flyTo = searchParams.fly_to

  const originCoord: [number, number] = [-118.2, 33.9]
  const arcs = flights.slice(0, 8).map(f => ({
    from: originCoord,
    to: (COORD_MAP[f.countryTo.code] ?? [0, 0]) as [number, number],
    label: f.cityTo,
  }))

  const sortOptions = ['Cheapest', 'Best', 'Fastest']
  const activeSort = searchParams.sort === 'quality' ? 'Best' : searchParams.sort === 'duration' ? 'Fastest' : 'Cheapest'

  return (
    <main className="min-h-screen bg-page py-5 px-4 pb-20">
      <NavTabs />
      <div className="max-w-[900px] mx-auto border border-stroke rounded-xl overflow-hidden bg-surface">

        {/* Condensed nav */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stroke-light flex-wrap">
          <div className="w-14 h-6 bg-surface-2 border border-stroke rounded-lg flex items-center justify-center text-[10px] font-semibold text-ink flex-shrink-0">
            LOGO
          </div>
          <SearchBar compact defaultOrigin={flyFrom} defaultDest={flyTo ?? ''}
            defaultDateFrom={searchParams.date_from ?? ''} defaultDateTo={searchParams.date_to ?? ''}
            defaultPassengers={parseInt(searchParams.adults ?? '1', 10)} />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-stroke-light flex-wrap">
          <span className="text-[10px] text-ink-muted">Filter:</span>
          {['Stops', 'Airlines', 'Price', 'Departure time', 'Duration'].map(f => (
            <span key={f} className="bg-surface-2 border border-stroke rounded-full px-[10px] py-[3px] text-[10px] text-ink cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors">{f}</span>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] text-ink-muted">Sort:</span>
            {sortOptions.map(s => (
              <span key={s} className={`rounded-full px-[10px] py-[3px] text-[10px] cursor-pointer transition-colors ${
                s === activeSort
                  ? 'bg-surface-2 border border-[#1D9E75] text-[#1D9E75]'
                  : 'bg-surface-2 border border-stroke text-ink hover:border-[#1D9E75] hover:text-[#1D9E75]'
              }`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Split layout */}
        <div className="flex" style={{ minHeight: 420 }}>
          {/* Map */}
          <div className="flex-1 bg-page border-r border-stroke-light flex flex-col items-center justify-center gap-2 p-5">
            <WorldMap arcs={arcs} origin={originCoord} className="w-full" style={{ height: 300 } as React.CSSProperties} />
            <div className="flex gap-1.5 flex-wrap justify-center">
              <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E6F1FB] text-[#185FA5]">Mapbox / D3.js</span>
              <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56]">Kiwi Tequila</span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-[300px] flex-shrink-0 overflow-y-auto bg-surface">
            <div className="px-2.5 py-1.5 border-b border-stroke-light text-[10px] text-ink-muted">
              Showing <strong className="text-ink">{flights.length} flights</strong>
              {flyTo && ` · ${flyFrom} → ${flyTo}`}
            </div>
            {flights.length === 0 ? (
              <div className="text-center py-12 text-[11px] text-ink-muted">
                No flights found.<br /><span className="text-[10px]">Try different dates or destination.</span>
              </div>
            ) : (
              <>
                {flights.map((flight, index) => (
                  <FlightCard key={flight.id} {...flight} photo={flight.photo} compact isBestDeal={index === 0} />
                ))}
                {flyTo && <div className="p-2.5"><PriceCalendar flyFrom={flyFrom} flyTo={flyTo} /></div>}
              </>
            )}
          </div>
        </div>

        {/* AI search bottom pill */}
        <div className="px-3 py-2 border-t border-stroke-light flex justify-end">
          <a href={`/discover?q=show me the cheapest beach in May from ${flyFrom}`}
            className="inline-flex items-center gap-2 bg-surface-2 border border-stroke rounded-full px-3.5 py-[7px] hover:border-[#1D9E75] transition-colors">
            <span className="text-[13px]">✨</span>
            <span className="text-[11px] font-medium text-ink">Try AI search — "show me the cheapest beach in May"</span>
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#EEEDFE] text-[#534AB7]">Claude API</span>
          </a>
        </div>

      </div>
    </main>
  )
}
