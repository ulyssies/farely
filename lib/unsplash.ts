const BASE_URL = 'https://api.unsplash.com'

export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    links: { html: string }
  }
}

const GRADIENT_FALLBACKS = [
  'from-indigo-900 to-purple-900',
  'from-blue-900 to-teal-900',
  'from-rose-900 to-orange-900',
  'from-emerald-900 to-cyan-900',
  'from-violet-900 to-fuchsia-900',
  'from-amber-900 to-red-900',
  'from-sky-900 to-indigo-900',
  'from-green-900 to-emerald-900',
]

export function getGradientFallback(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return GRADIENT_FALLBACKS[Math.abs(hash) % GRADIENT_FALLBACKS.length]
}

export async function fetchCityPhoto(cityName: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null

  try {
    const url = new URL(`${BASE_URL}/search/photos`)
    url.searchParams.set('query', `${cityName} city travel`)
    url.searchParams.set('per_page', '1')
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('content_filter', 'high')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return null

    const data = await res.json() as { results: UnsplashPhoto[] }
    if (!data.results.length) return null

    return data.results[0].urls.regular
  } catch {
    return null
  }
}

export async function fetchMultipleCityPhotos(
  cities: string[],
): Promise<Record<string, string | null>> {
  const results = await Promise.allSettled(
    cities.map(async city => ({
      city,
      url: await fetchCityPhoto(city),
    })),
  )

  const map: Record<string, string | null> = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      map[result.value.city] = result.value.url
    }
  }
  return map
}
