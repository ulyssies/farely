const BASE_URL = 'https://tequila.kiwi.com/v2'

export interface FlightResult {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  countryFrom: { name: string; code: string }
  countryTo: { name: string; code: string }
  price: number
  currency: string
  dTime: number
  aTime: number
  duration: { departure: number; return: number; total: number }
  airlines: string[]
  deep_link: string
  route: Array<{
    flyFrom: string
    flyTo: string
    airline: string
    flight_no: number
    dTime: number
    aTime: number
  }>
}

export interface TequilaSearchParams {
  fly_from: string
  fly_to?: string
  date_from: string
  date_to: string
  return_from?: string
  return_to?: string
  adults?: number
  children?: number
  infants?: number
  selected_cabins?: 'M' | 'W' | 'C' | 'F'
  curr?: string
  locale?: string
  sort?: 'price' | 'duration' | 'quality' | 'date'
  limit?: number
  max_stopovers?: number
  price_from?: number
  price_to?: number
}

interface TequilaResponse {
  data: FlightResult[]
  currency: string
  fx_rate: number
  search_id: string
  _results: number
}

async function tequilaFetch<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = process.env.TEQUILA_API_KEY
  if (!apiKey) throw new Error('TEQUILA_API_KEY is not set')

  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const res = await fetch(url.toString(), {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tequila API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function searchFlights(params: TequilaSearchParams): Promise<FlightResult[]> {
  const searchParams: Record<string, string | number | undefined> = {
    fly_from: params.fly_from,
    fly_to: params.fly_to ?? 'anywhere',
    date_from: params.date_from,
    date_to: params.date_to,
    adults: params.adults ?? 1,
    curr: params.curr ?? 'USD',
    locale: params.locale ?? 'en',
    sort: params.sort ?? 'price',
    limit: params.limit ?? 20,
    selected_cabins: params.selected_cabins ?? 'M',
    max_stopovers: params.max_stopovers,
    price_from: params.price_from,
    price_to: params.price_to,
  }

  if (params.return_from) searchParams.return_from = params.return_from
  if (params.return_to) searchParams.return_to = params.return_to
  if (params.children) searchParams.children = params.children
  if (params.infants) searchParams.infants = params.infants

  const data = await tequilaFetch<TequilaResponse>('/search', searchParams)
  return data.data ?? []
}

export async function searchAnywhere(
  flyFrom: string,
  dateFrom: string,
  dateTo: string,
  limit = 12,
): Promise<FlightResult[]> {
  return searchFlights({
    fly_from: flyFrom,
    fly_to: 'anywhere',
    date_from: dateFrom,
    date_to: dateTo,
    limit,
    sort: 'price',
  })
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function buildSkyscannerLink(
  from: string,
  to: string,
  departDate: number,
): string {
  const date = new Date(departDate * 1000)
  const formatted = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${formatted}/?adults=1&utm_source=farely`
}
