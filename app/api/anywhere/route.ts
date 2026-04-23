import { NextRequest, NextResponse } from 'next/server'
import { searchAnywhere } from '@/lib/tequila'
import { fetchMultipleCityPhotos } from '@/lib/unsplash'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? 'ATL'
  const budget = parseInt(searchParams.get('budget') || '500')
  const durationMin = parseInt(searchParams.get('durationMin') || '3')
  const durationMax = parseInt(searchParams.get('durationMax') || '14')

  const today = new Date()
  const twoWeeks = new Date(today)
  twoWeeks.setDate(twoWeeks.getDate() + 14)
  const threeMonths = new Date(today)
  threeMonths.setDate(threeMonths.getDate() + 90)

  const dateFrom = searchParams.get('dateFrom') ?? twoWeeks.toISOString().slice(0, 10)
  const dateTo = searchParams.get('dateTo') ?? threeMonths.toISOString().slice(0, 10)

  try {
    const flights = await searchAnywhere({ from, budget, durationMin, durationMax, dateFrom, dateTo })

    const cities = Array.from(new Set(flights.map((f: any) => f.city_to).filter(Boolean)))
    const photos = cities.length > 0 ? await fetchMultipleCityPhotos(cities as string[]) : {}

    const enriched = flights.map((f: any) => ({ ...f, photo: photos[f.city_to] ?? null }))
    return NextResponse.json({ flights: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
