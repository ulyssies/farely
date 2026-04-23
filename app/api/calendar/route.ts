import { NextRequest, NextResponse } from 'next/server'
import { getPriceCalendar } from '@/lib/travelpayouts'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  try {
    const calendar = await getPriceCalendar({ from, to, month })
    return NextResponse.json({ calendar })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
