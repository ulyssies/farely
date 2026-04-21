import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ParsedQuery {
  origin: string | null
  destination: string | null
  departDate: string | null
  returnDate: string | null
  passengers: number
  cabin: 'M' | 'W' | 'C' | 'F'
  budget: number | null
  vibes: string[]
  isOpenDestination: boolean
}

export interface RankedDestination {
  iataCode: string
  cityName: string
  score: number
  reason: string
  tags: string[]
}

const PARSE_SYSTEM_PROMPT = `You are a flight search assistant. Parse natural language travel queries into structured JSON.

Extract the following fields from the user's query:
- origin: IATA airport code or null if not specified
- destination: IATA airport code or city name or null if open destination
- departDate: ISO date string (YYYY-MM-DD) or null
- returnDate: ISO date string (YYYY-MM-DD) or null
- passengers: number of adults (default 1)
- cabin: "M" (economy), "W" (premium economy), "C" (business), "F" (first) — default "M"
- budget: max price in USD per person or null
- vibes: array of mood/vibe keywords (e.g. ["beach", "adventure", "culture", "romantic", "family"])
- isOpenDestination: true if user is flexible on destination

Today's date for reference: ${new Date().toISOString().slice(0, 10)}

Respond ONLY with valid JSON matching this schema. No explanation, no markdown.`

const RANK_SYSTEM_PROMPT = `You are a travel curator with deep knowledge of global destinations.

Given a list of flight destinations and a user's vibe/mood query, rank and explain the top destinations.

For each destination, provide:
- iataCode: the IATA code
- cityName: full city name
- score: 0-100 match score for the vibe
- reason: one compelling sentence explaining why this destination matches the vibe
- tags: 2-4 relevant tags (e.g. ["beach", "nightlife", "affordable", "adventure"])

Sort by score descending. Return ONLY valid JSON array. No markdown, no explanation.`

export async function parseNLQuery(query: string): Promise<ParsedQuery> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: PARSE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as ParsedQuery
  } catch {
    return {
      origin: null,
      destination: null,
      departDate: null,
      returnDate: null,
      passengers: 1,
      cabin: 'M',
      budget: null,
      vibes: [],
      isOpenDestination: true,
    }
  }
}

export interface DestinationInput {
  iataCode: string
  cityName: string
  country: string
  price: number
}

export async function rankByVibe(
  destinations: DestinationInput[],
  vibe: string,
): Promise<RankedDestination[]> {
  if (destinations.length === 0) return []

  const destList = destinations
    .map(d => `${d.iataCode}: ${d.cityName}, ${d.country} ($${d.price})`)
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: RANK_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `User vibe: "${vibe}"\n\nDestinations:\n${destList}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as RankedDestination[]
  } catch {
    return destinations.map(d => ({
      iataCode: d.iataCode,
      cityName: d.cityName,
      score: 50,
      reason: `${d.cityName} is a great destination to explore.`,
      tags: ['travel'],
    }))
  }
}
