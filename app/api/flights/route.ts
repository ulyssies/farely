import { NextRequest, NextResponse } from 'next/server'
import { searchFlights, type TequilaSearchParams } from '@/lib/tequila'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const fly_from = searchParams.get('fly_from')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  if (!fly_from || !date_from || !date_to) {
    return NextResponse.json(
      { error: 'fly_from, date_from, and date_to are required' },
      { status: 400 },
    )
  }

  try {
    const params: TequilaSearchParams = {
      fly_from,
      fly_to: searchParams.get('fly_to') ?? undefined,
      date_from,
      date_to,
      return_from: searchParams.get('return_from') ?? undefined,
      return_to: searchParams.get('return_to') ?? undefined,
      adults: parseInt(searchParams.get('adults') ?? '1', 10),
      selected_cabins: (searchParams.get('cabin') as TequilaSearchParams['selected_cabins']) ?? 'M',
      curr: 'USD',
      sort: (searchParams.get('sort') as TequilaSearchParams['sort']) ?? 'price',
      limit: parseInt(searchParams.get('limit') ?? '20', 10),
      max_stopovers: searchParams.has('max_stopovers')
        ? parseInt(searchParams.get('max_stopovers')!, 10)
        : undefined,
      price_to: searchParams.has('price_to')
        ? parseInt(searchParams.get('price_to')!, 10)
        : undefined,
    }

    const flights = await searchFlights(params)
    return NextResponse.json({ flights, count: flights.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
