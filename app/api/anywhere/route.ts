import { NextRequest, NextResponse } from 'next/server'
import { searchAnywhere } from '@/lib/travelpayouts'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || 'ATL'
  const budget = parseInt(searchParams.get('budget') || '500')

  try {
    const results = await searchAnywhere({ from, budget })
    return NextResponse.json({ flights: results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
