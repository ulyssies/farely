import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { parseAISearchQuery } from '@/lib/claude'
import { searchAnywhere, type TravelpayoutsTicket } from '@/lib/travelpayouts'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'
import { IATA_META } from '@/lib/iata-meta'

// Normalize TravelpayoutsTicket to FlightResult shape for ChatPanel/FlightCard
function normalize(f: TravelpayoutsTicket) {
  const cityName = IATA_META[f.destination]?.city ?? f.destination
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

    // Step 3: Rank results by vibe relevance with Claude Haiku
    let ranked = flights.slice(0, 6)
    try {
      const client = new Anthropic()
      const rankingPrompt = `You are a travel expert. The user asked: "${query}"

Here are available flights from ATL:
${JSON.stringify(flights.map(r => ({ destination: r.flyTo, city: r.cityTo, price: r.price, duration: r.duration.departure })))}

Return ONLY a JSON array of the top 6 destination IATA codes that best match the user's request, sorted by relevance. Consider destination type, geography, and vibe. Example: ["MIA","CUN","SJU","NAS","MBJ","PUJ"]
No markdown, no explanation, just the JSON array.`

      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{ role: 'user', content: rankingPrompt }],
      })
      const raw = (msg.content[0] as any).text?.trim() ?? ''
      const codes: string[] = JSON.parse(raw)
      const flightMap = new Map(flights.map(f => [f.flyTo, f]))
      const reranked = codes.filter(c => flightMap.has(c)).map(c => flightMap.get(c)!)
      if (reranked.length > 0) ranked = reranked.slice(0, 6)
    } catch {
      // ranking failed — fall back to cheapest-first order
    }

    // Step 4: Fetch city photos
    const cities = Array.from(new Set(ranked.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)

    // Step 5: Return ranked results with photos
    const results = ranked.map(f => ({
      ...f,
      photo: photos[f.cityTo] ?? null,
    }))

    return NextResponse.json({ results, parsed, count: results.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
