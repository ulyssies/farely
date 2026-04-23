const BASE = 'https://test.api.amadeus.com'

// Token is valid for 1799 seconds — cache it in module scope
let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY!,
      client_secret: process.env.AMADEUS_API_SECRET!,
    }),
  })
  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken!
}

export function normalizeAmadeusOffer(offer: any) {
  const itinerary = offer.itineraries[0]
  const segments = itinerary.segments
  const firstSeg = segments[0]
  const lastSeg = segments[segments.length - 1]

  return {
    id: offer.id,
    price: parseFloat(offer.price.grandTotal),
    currency: offer.price.currency,
    origin: firstSeg.departure.iataCode as string,
    destination: lastSeg.arrival.iataCode as string,
    departureTime: firstSeg.departure.at as string,
    arrivalTime: lastSeg.arrival.at as string,
    duration: itinerary.duration as string,
    stops: segments.length - 1,
    airline: firstSeg.carrierCode as string,
    bookingLink: `https://www.skyscanner.com/transport/flights/${firstSeg.departure.iataCode}/${lastSeg.arrival.iataCode}/${(firstSeg.departure.at as string).slice(0, 10).replace(/-/g, '')}/?adults=1&utm_source=farely`,
  }
}

export type AmadeusFlight = ReturnType<typeof normalizeAmadeusOffer>

export async function searchFlights({
  from,
  to,
  departureDate,
  returnDate,
  adults = 1,
}: {
  from: string
  to: string
  departureDate: string
  returnDate?: string
  adults?: number
}): Promise<AmadeusFlight[]> {
  const token = await getToken()
  const params = new URLSearchParams({
    originLocationCode: from,
    destinationLocationCode: to,
    departureDate,
    adults: adults.toString(),
    max: '10',
    currencyCode: 'USD',
  })
  if (returnDate) params.append('returnDate', returnDate)

  const res = await fetch(
    `${BASE}/v2/shopping/flight-offers?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.errors?.[0]?.detail || 'Amadeus search failed')
  }

  const data = await res.json()
  return (data.data || []).map(normalizeAmadeusOffer)
}
