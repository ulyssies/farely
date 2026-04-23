import { NextRequest, NextResponse } from 'next/server'
import { fetchCityPhoto } from '@/lib/unsplash'

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city')
  if (!city) {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  const imageUrl = await fetchCityPhoto(city)

  return NextResponse.json(
    { imageUrl },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    },
  )
}
