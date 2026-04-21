import { NextRequest, NextResponse } from 'next/server'
import { parseNLQuery, rankByVibe } from '@/lib/claude'
import { searchFlights, searchAnywhere } from '@/lib/tequila'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

function getDateRange(offsetDays = 7, windowDays = 7): { from: string; to: string } {
  const from = new Date()
  from.setDate(from.getDate() + offsetDays)
  const to = new Date(from)
  to.setDate(to.getDate() + windowDays)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, origin } = await request.json() as { query: string; origin?: string }

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    // Step 1: Parse natural language query
    const parsed = await parseNLQuery(query)
    const flyFrom = parsed.origin ?? origin ?? 'LAX'

    // Step 2: Fetch flights from Tequila
    const { from, to } = getDateRange(7, 14)
    const dateFrom = parsed.departDate ?? from
    const dateTo = parsed.departDate ?? to

    let flights
    if (parsed.isOpenDestination || !parsed.destination) {
      flights = await searchAnywhere(flyFrom, dateFrom, dateTo, 20)
    } else {
      flights = await searchFlights({
        fly_from: flyFrom,
        fly_to: parsed.destination,
        date_from: dateFrom,
        date_to: dateTo,
        adults: parsed.passengers,
        selected_cabins: parsed.cabin,
        price_to: parsed.budget ?? undefined,
        limit: 20,
      })
    }

    if (flights.length === 0) {
      return NextResponse.json({ results: [], parsed, message: 'No flights found for this query.' })
    }

    // Step 3: Rank by vibe using Claude
    const vibeString = parsed.vibes.length > 0 ? parsed.vibes.join(', ') : query
    const destinations = flights.map(f => ({
      iataCode: f.flyTo,
      cityName: f.cityTo,
      country: f.countryTo.name,
      price: f.price,
    }))

    const ranked = await rankByVibe(destinations, vibeString)

    // Step 4: Merge ranking data with flight data
    const rankMap = new Map(ranked.map(r => [r.iataCode, r]))
    const mergedFlights = flights
      .map(f => ({
        ...f,
        ranking: rankMap.get(f.flyTo),
      }))
      .sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0))
      .slice(0, 12)

    // Step 5: Fetch photos
    const cities = Array.from(new Set(mergedFlights.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)

    const results = mergedFlights.map(f => ({
      ...f,
      photo: photos[f.cityTo] ?? null,
    }))

    return NextResponse.json({ results, parsed, count: results.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
