import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/lib/amadeus'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const departureDate = searchParams.get('departureDate')
  const returnDate = searchParams.get('returnDate') || undefined
  const adults = parseInt(searchParams.get('adults') || '1')

  if (!from || !to || !departureDate) {
    return NextResponse.json({ error: 'from, to, and departureDate are required' }, { status: 400 })
  }

  try {
    const flights = await searchFlights({ from, to, departureDate, returnDate, adults })
    return NextResponse.json({ flights })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
