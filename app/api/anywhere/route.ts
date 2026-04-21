import { NextRequest, NextResponse } from 'next/server'
import { searchAnywhere } from '@/lib/tequila'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const fly_from = searchParams.get('fly_from') ?? 'LAX'
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  if (!date_from || !date_to) {
    return NextResponse.json(
      { error: 'date_from and date_to are required' },
      { status: 400 },
    )
  }

  try {
    const flights = await searchAnywhere(fly_from, date_from, date_to, 12)

    const cities = Array.from(new Set(flights.map(f => f.cityTo)))
    const photos = await fetchMultipleCityPhotos(cities)

    const enriched = flights.map(flight => ({
      ...flight,
      photo: photos[flight.cityTo] ?? null,
    }))

    return NextResponse.json({ flights: enriched, count: enriched.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
