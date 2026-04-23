import { NextRequest, NextResponse } from 'next/server'
import { parseAISearchQuery } from '@/lib/claude'
import { searchAnywhere, IATA_CITY, type TravelpayoutsTicket } from '@/lib/travelpayouts'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

// Normalize TravelpayoutsTicket to FlightResult shape for ChatPanel/FlightCard
function normalize(f: TravelpayoutsTicket) {
  const cityName = IATA_CITY[f.destination] ?? f.destination
  const marker = process.env.TRAVELPAYOUTS_MARKER ?? ''
  const markerParam = marker ? `marker=${marker}&` : ''
  const bookingLink = f.bookingLink !== '#'
    ? f.bookingLink
    : `https://www.aviasales.com/search/${f.origin}${f.destination}1?${markerParam}utm_source=farely`

  return {
    id: f.destination,
    flyFrom: f.origin,
    flyTo: f.destination,
    cityFrom: f.origin,
    cityTo: cityName,
    countryFrom: { name: '', code: '' },
    countryTo: { name: '', code: '' },
    price: f.price,
    currency: 'USD',
    dTime: 0,
    aTime: 0,
    duration: { departure: f.duration as any, return: 0, total: 0 },
    airlines: f.airline ? [f.airline] : [],
    deep_link: bookingLink,
    route: [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, origin } = await request.json() as { query: string; origin?: string }

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    // Step 1: Parse query with Claude Haiku
    const parsed = await parseAISearchQuery(query)
    // TODO: detect user location via IP geolocation
    const flyFrom = parsed.origin || origin || 'ATL'

    // Step 2: Fetch cheapest destinations from Travelpayouts
    const rawFlights = await searchAnywhere({
      from: flyFrom,
      budget: parsed.budget ?? 500,
    })

    const flights = rawFlights.map(normalize)

    if (flights.length === 0) {
      return NextResponse.json({ results: [], parsed, message: 'No flights found for this query.' })
    }

    // Step 3: Fetch city photos
    const cities = Array.from(new Set(flights.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)

    // Step 4: Return top 6 results with photos
    const results = flights.slice(0, 6).map(f => ({
      ...f,
      photo: photos[f.cityTo] ?? null,
    }))

    return NextResponse.json({ results, parsed, count: results.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
