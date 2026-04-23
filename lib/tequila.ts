// FlightResult — kept for components that depend on this type (ChatPanel, FlightCard, discover page)
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

// Helpers kept for FlightCard compatibility
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function buildSkyscannerLink(from: string, to: string, departDate: number): string {
  const date = new Date(departDate * 1000)
  const formatted = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${formatted}/?adults=1&utm_source=farely`
}

// Stubbed until TEQUILA_API_KEY arrives — returns mock data when key is missing or 'coming_soon'
export async function searchAnywhere({
  from,
  budget,
  durationMin,
  durationMax,
  dateFrom,
  dateTo,
}: {
  from: string
  budget: number
  durationMin: number
  durationMax: number
  dateFrom: string
  dateTo: string
}) {
  if (!process.env.TEQUILA_API_KEY || process.env.TEQUILA_API_KEY === 'coming_soon') {
    return MOCK_ANYWHERE_RESULTS
  }

  const res = await fetch(
    `https://tequila.kiwi.com/v2/search?` +
    `fly_from=${from}&fly_to=anywhere` +
    `&date_from=${dateFrom}&date_to=${dateTo}` +
    `&nights_in_dst_from=${durationMin}` +
    `&nights_in_dst_to=${durationMax}` +
    `&price_to=${budget}&curr=USD&limit=20&sort=price`,
    { headers: { apikey: process.env.TEQUILA_API_KEY } }
  )
  const data = await res.json()
  return data.data || []
}

const MOCK_ANYWHERE_RESULTS = [
  { city_to: 'Cancún',      fly_to: 'CUN', price: 189, nightsInDest: 5, duration: { departure: '3h 45m' }, route: [{ airline: 'AA' }] },
  { city_to: 'Miami',       fly_to: 'MIA', price: 58,  nightsInDest: 5, duration: { departure: '1h 40m' }, route: [{ airline: 'DL' }] },
  { city_to: 'New York',    fly_to: 'JFK', price: 67,  nightsInDest: 5, duration: { departure: '2h 15m' }, route: [{ airline: 'DL' }] },
  { city_to: 'San Juan',    fly_to: 'SJU', price: 214, nightsInDest: 5, duration: { departure: '3h 10m' }, route: [{ airline: 'UA' }] },
  { city_to: 'Los Angeles', fly_to: 'LAX', price: 129, nightsInDest: 5, duration: { departure: '4h 30m' }, route: [{ airline: 'AA' }] },
  { city_to: 'Mexico City', fly_to: 'MEX', price: 187, nightsInDest: 5, duration: { departure: '3h 45m' }, route: [{ airline: 'AM' }] },
  { city_to: 'London',      fly_to: 'LHR', price: 312, nightsInDest: 5, duration: { departure: '9h 10m' }, route: [{ airline: 'BA' }] },
  { city_to: 'Paris',       fly_to: 'CDG', price: 389, nightsInDest: 5, duration: { departure: '9h 45m' }, route: [{ airline: 'AF' }] },
  { city_to: 'Tokyo',       fly_to: 'NRT', price: 589, nightsInDest: 5, duration: { departure: '14h 30m' }, route: [{ airline: 'JL' }] },
  { city_to: 'Vancouver',   fly_to: 'YVR', price: 198, nightsInDest: 5, duration: { departure: '6h 20m' }, route: [{ airline: 'AC' }] },
]
