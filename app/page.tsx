import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import AIPromptBar from '@/components/AIPromptBar'
import DealCard from '@/components/DealCard'
import NavTabs from '@/components/NavTabs'
import { searchAnywhere } from '@/lib/tequila'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

async function getTopDeals() {
  try {
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() + 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 30)
    const flights = await searchAnywhere('LAX', from.toISOString().slice(0, 10), to.toISOString().slice(0, 10), 8)
    const cities = Array.from(new Set(flights.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)
    return flights.map(f => ({ ...f, photo: photos[f.cityTo] ?? null }))
  } catch { return [] }
}

const COORD_MAP: Record<string, [number, number]> = {
  'MX': [-99.1, 19.4], 'JP': [139.7, 35.7], 'FR': [2.3, 48.9], 'GB': [-0.1, 51.5],
  'TH': [100.5, 13.8], 'IT': [12.5, 41.9], 'ES': [-3.7, 40.4], 'AU': [151.2, -33.9],
  'BR': [-43.2, -22.9], 'DE': [13.4, 52.5], 'PE': [-77.0, -12.0], 'CR': [-84.1, 9.9],
}

export default async function HomePage() {
  const deals = await getTopDeals()

  const sampleArcs = deals.slice(0, 6).map(d => ({
    from: [-118.2, 33.9] as [number, number],
    to: (COORD_MAP[d.countryTo.code] ?? [0, 0]) as [number, number],
    label: d.cityTo,
  }))

  return (
    <main className="min-h-screen bg-page py-5 px-4 pb-20">
      <NavTabs />
      <div className="max-w-[900px] mx-auto border border-stroke rounded-xl overflow-hidden bg-surface">

        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stroke-light">
          <div className="w-20 h-[26px] bg-surface-2 border border-stroke rounded-lg flex items-center justify-center text-[11px] font-semibold text-ink">
            LOGO
          </div>
          <div className="flex gap-4 text-[11px] text-ink-muted">
            <a href="#deals" className="hover:text-ink transition-colors">Deals</a>
            <a href="#" className="hover:text-ink transition-colors">Explore map</a>
            <a href="#" className="hover:text-ink transition-colors">Sign in</a>
          </div>
        </div>

        {/* Hero */}
        <div className="px-6 pt-9 pb-6 text-center border-b border-stroke-light">
          <div className="bg-surface-2 border border-stroke rounded-lg h-[30px] max-w-[420px] mx-auto mb-2 flex items-center justify-center text-[13px] font-semibold text-ink">
            "Your next flight. Cheaper than you think."
          </div>
          <div className="bg-surface-2 border border-stroke rounded-lg h-[18px] max-w-[260px] mx-auto mb-6 flex items-center justify-center text-[10px] text-ink-muted">
            Real-time deals powered by AI
          </div>
          <div className="mb-2"><SearchBar /></div>
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-stroke-light" />
            <span className="text-[10px] text-ink-muted">or use AI search</span>
            <div className="flex-1 h-px bg-stroke-light" />
          </div>
          <AIPromptBar showTags />
        </div>

        {/* Map strip */}
        <div className="h-48 bg-page">
          <WorldMap arcs={sampleArcs} origin={[-118.2, 33.9]} className="w-full h-full" />
        </div>

        {/* Deal cards */}
        <div id="deals" className="px-4 py-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-semibold text-ink">Popular deals from your location</span>
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56]">
              Kiwi Tequila · fly_to=anywhere
            </span>
          </div>
          {deals.length > 0 ? (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {deals.map(deal => (
                <DealCard key={deal.id} flyFrom={deal.flyFrom} flyTo={deal.flyTo}
                  cityTo={deal.cityTo} countryTo={deal.countryTo.name}
                  price={deal.price} dTime={deal.dTime} photo={deal.photo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-ink-muted text-[11px]">
              Add your Tequila API key to see live deals.
            </div>
          )}
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
