const BASE = 'https://api.travelpayouts.com'

// Shared fetch helper — token passed as URL param and header
async function tpFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('token', process.env.TRAVELPAYOUTS_TOKEN!)
  url.searchParams.set('currency', 'usd')

  const res = await fetch(url.toString(), {
    headers: { 'x-access-token': process.env.TRAVELPAYOUTS_TOKEN! },
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`Travelpayouts error: ${res.status}`)
  return res.json()
}

// Unified flight shape returned by all three functions
export interface TravelpayoutsTicket {
  origin: string
  destination: string
  price: number
  airline: string
  flightNumber: string
  stops: number
  duration: string
  departureAt: string
  returnAt: string
  bookingLink: string
}

function normalizeTicket(origin: string, iata: string, ticket: any): TravelpayoutsTicket {
  const durationHrs = Math.floor((ticket.duration || 0) / 60)
  const durationMins = (ticket.duration || 0) % 60
  const marker = process.env.TRAVELPAYOUTS_MARKER ?? ''
  const markerParam = marker ? `marker=${marker}&` : ''
  const dateStr = (ticket.departure_at || '').slice(0, 10).replace(/-/g, '').slice(4, 8)
  return {
    origin,
    destination: iata,
    price: ticket.price,
    airline: ticket.airline || '',
    flightNumber: ticket.flight_number || '',
    stops: ticket.transfers ?? 0,
    duration: ticket.duration ? `${durationHrs}h ${durationMins}m` : 'N/A',
    departureAt: ticket.departure_at || '',
    returnAt: ticket.return_at || '',
    bookingLink: `https://www.aviasales.com/search/${origin}${dateStr}${iata}1?${markerParam}utm_source=farely`,
  }
}

// Screen 2 — specific route search
export async function searchRoute({
  from,
  to,
  departDate,
  returnDate,
}: {
  from: string
  to: string
  departDate?: string
  returnDate?: string
}): Promise<TravelpayoutsTicket[]> {
  if (!process.env.TRAVELPAYOUTS_TOKEN) return MOCK_ROUTE_RESULTS

  const params: Record<string, string> = { origin: from, destination: to }
  if (departDate) params.depart_date = departDate.slice(0, 7)
  if (returnDate) params.return_date = returnDate.slice(0, 7)

  try {
    const data = await tpFetch('/v1/prices/cheap', params)
    const stopGroups = data.data?.[to]
    if (!data.success || !stopGroups) return MOCK_ROUTE_RESULTS

    const marker = process.env.TRAVELPAYOUTS_MARKER ?? ''
    const markerParam = marker ? `marker=${marker}&` : ''

    // One result per stop-count option, sorted cheapest first
    const results = (Object.values(stopGroups) as any[])
      .sort((a, b) => a.price - b.price)
      .map(ticket => {
        const durationMins = ticket.duration_to || ticket.duration || 0
        const hrs = Math.floor(durationMins / 60)
        const mins = durationMins % 60
        const dateStr = (ticket.departure_at || '').slice(0, 10).replace(/-/g, '').slice(4, 8)
        return {
          origin: from,
          destination: to,
          price: ticket.price,
          airline: ticket.airline || '',
          flightNumber: String(ticket.flight_number || ''),
          stops: ticket.transfers ?? 0,
          duration: durationMins > 0 ? `${hrs}h ${mins}m` : 'N/A',
          departureAt: ticket.departure_at || '',
          returnAt: ticket.return_at || '',
          bookingLink: `https://www.aviasales.com/search/${from}${dateStr}${to}1?${markerParam}utm_source=farely`,
        }
      })

    return results.length > 0 ? results : MOCK_ROUTE_RESULTS
  } catch {
    return MOCK_ROUTE_RESULTS
  }
}

// Screen 3 — open destination search for AI discovery
export async function searchAnywhere({
  from,
  budget,
}: {
  from: string
  budget: number
}): Promise<TravelpayoutsTicket[]> {
  if (!process.env.TRAVELPAYOUTS_TOKEN) return MOCK_ANYWHERE_RESULTS

  try {
    const data = await tpFetch('/v1/prices/cheap', { origin: from })
    if (!data.success || !data.data) return MOCK_ANYWHERE_RESULTS

    const marker = process.env.TRAVELPAYOUTS_MARKER ?? ''
    const markerParam = marker ? `marker=${marker}&` : ''

    // One result per destination — cheapest option across all stop counts
    const results = Object.entries(data.data)
      .map(([iata, stopGroups]: [string, any]) => {
        const tickets = Object.values(stopGroups) as any[]
        const cheapest = tickets.sort((a, b) => a.price - b.price)[0]

        const durationMins = cheapest.duration_to || cheapest.duration || 0
        const hrs = Math.floor(durationMins / 60)
        const mins = durationMins % 60
        const dateStr = (cheapest.departure_at || '').slice(0, 10).replace(/-/g, '').slice(4, 8)

        return {
          origin: from,
          destination: iata,
          price: cheapest.price,
          airline: cheapest.airline || '',
          flightNumber: String(cheapest.flight_number || ''),
          stops: cheapest.transfers ?? 0,
          duration: durationMins > 0 ? `${hrs}h ${mins}m` : 'N/A',
          departureAt: cheapest.departure_at || '',
          returnAt: cheapest.return_at || '',
          bookingLink: `https://www.aviasales.com/search/${from}${dateStr}${iata}1?${markerParam}utm_source=farely`,
        }
      })
      .filter(r => r.price <= budget)
      .sort((a, b) => a.price - b.price)
      .slice(0, 10)

    return results.length > 0 ? results : MOCK_ANYWHERE_RESULTS
  } catch {
    return MOCK_ANYWHERE_RESULTS
  }
}

// Price calendar — powers the 7-day heat map on Screen 2
export async function getPriceCalendar({
  from,
  to,
  month,
}: {
  from: string
  to: string
  month: string // YYYY-MM
}): Promise<Array<{ date: string; price: number; stops: number }>> {
  if (!process.env.TRAVELPAYOUTS_TOKEN) return []

  try {
    const data = await tpFetch('/v1/prices/calendar', {
      origin: from,
      destination: to,
      depart_date: month,
      calendar_type: 'departure_date',
    })
    if (!data.success || !data.data) return []

    return Object.entries(data.data).map(([date, ticket]: [string, any]) => ({
      date,
      price: ticket.price,
      stops: ticket.transfers ?? 0,
    }))
  } catch {
    return []
  }
}

// --- Backwards-compat exports for ChatPanel, FlightCard, discover page ---

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
  route: Array<{ flyFrom: string; flyTo: string; airline: string; flight_no: number; dTime: number; aTime: number }>
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Client-safe link builder (no env marker — marker lives in server-built bookingLink)
export function buildAviasalesLink(from: string, to: string, dTime: number): string {
  const date = dTime > 0
    ? new Date(dTime * 1000)
    : (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d })()
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `https://www.aviasales.com/search/${from.toUpperCase()}${dd}${mm}${to.toUpperCase()}1?utm_source=farely`
}

// IATA → city name for mock data photo lookups
export const IATA_CITY: Record<string, string> = {
  MIA: 'Miami', JFK: 'New York', LAX: 'Los Angeles', MEX: 'Mexico City',
  CUN: 'Cancún', SJU: 'San Juan', LHR: 'London', CDG: 'Paris',
  NRT: 'Tokyo', YVR: 'Vancouver', ATL: 'Atlanta', ORD: 'Chicago',
  DFW: 'Dallas', DEN: 'Denver', SFO: 'San Francisco', BOS: 'Boston',
  SEA: 'Seattle', LIS: 'Lisbon', BCN: 'Barcelona', FCO: 'Rome',
  AMS: 'Amsterdam', BKK: 'Bangkok', SYD: 'Sydney', GRU: 'São Paulo',
}

// --- Mock data ---

const MOCK_ROUTE_RESULTS: TravelpayoutsTicket[] = [
  { origin: 'ATL', destination: 'JFK', price: 67,  airline: 'DL', flightNumber: '', stops: 0, duration: '2h 15m', departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'JFK', price: 89,  airline: 'UA', flightNumber: '', stops: 1, duration: '2h 40m', departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'JFK', price: 97,  airline: 'AA', flightNumber: '', stops: 0, duration: '2h 30m', departureAt: '', returnAt: '', bookingLink: '#' },
]

const MOCK_ANYWHERE_RESULTS: TravelpayoutsTicket[] = [
  { origin: 'ATL', destination: 'MIA', price: 58,  airline: 'DL', flightNumber: '', stops: 0, duration: '1h 40m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'JFK', price: 67,  airline: 'DL', flightNumber: '', stops: 0, duration: '2h 15m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'LAX', price: 129, airline: 'AA', flightNumber: '', stops: 0, duration: '4h 30m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'MEX', price: 187, airline: 'AM', flightNumber: '', stops: 0, duration: '3h 45m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'CUN', price: 189, airline: 'AA', flightNumber: '', stops: 0, duration: '3h 45m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'SJU', price: 214, airline: 'UA', flightNumber: '', stops: 0, duration: '3h 10m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'LHR', price: 312, airline: 'BA', flightNumber: '', stops: 1, duration: '9h 10m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'CDG', price: 389, airline: 'AF', flightNumber: '', stops: 1, duration: '9h 45m',  departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'NRT', price: 589, airline: 'JL', flightNumber: '', stops: 1, duration: '14h 30m', departureAt: '', returnAt: '', bookingLink: '#' },
  { origin: 'ATL', destination: 'YVR', price: 198, airline: 'AC', flightNumber: '', stops: 1, duration: '6h 20m',  departureAt: '', returnAt: '', bookingLink: '#' },
]
