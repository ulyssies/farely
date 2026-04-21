'use client'

import Image from 'next/image'
import { formatDuration, buildSkyscannerLink } from '@/lib/tequila'

interface FlightCardProps {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  countryTo: { name: string; code: string }
  price: number
  dTime: number
  aTime: number
  duration: { total: number }
  airlines: string[]
  photo?: string | null
  ranking?: { score?: number; reason?: string; tags?: string[] }
  isBestDeal?: boolean
  compact?: boolean
}

function priceColor(price: number): string {
  if (price < 150) return 'text-[#1D9E75]'
  if (price < 350) return 'text-[#BA7517]'
  return 'text-[#993C1D]'
}

export default function FlightCard(props: FlightCardProps) {
  const { flyFrom, flyTo, cityTo, countryTo, price, dTime, aTime, duration, airlines, photo, ranking, isBestDeal, compact } = props

  const bookingLink = buildSkyscannerLink(flyFrom, flyTo, dTime)
  const departTime = new Date(dTime * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const arriveTime = new Date(aTime * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const stops = airlines.length > 1 ? `${airlines.length - 1} stop` : 'Nonstop'

  // Compact = results sidebar (no image, just times + price)
  if (compact) {
    return (
      <div className="px-2.5 py-2.5 border-b border-stroke-light last:border-b-0">
        {isBestDeal && (
          <div className="text-[9px] font-semibold text-[#0F6E56] mb-1.5">BEST DEAL</div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="bg-surface-2 border border-stroke rounded text-[8px] text-ink-muted px-1.5 py-0.5 inline-block mb-1.5">
              {airlines[0] ?? 'Airline'}
            </div>
            <div className="text-[12px] font-semibold text-ink">{departTime} → {arriveTime}</div>
            <div className="text-[10px] text-ink-muted">{stops} · {formatDuration(duration.total)}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-[20px] font-semibold leading-none ${priceColor(price)}`}>${price}</div>
            <a href={bookingLink} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center justify-center w-[68px] h-[26px] bg-[#1D9E75] text-white text-[10px] font-medium rounded-lg hover:bg-[#179968] transition-colors">
              Book →
            </a>
            <div className="text-[8px] text-ink-muted mt-1">via Skyscanner</div>
          </div>
        </div>
      </div>
    )
  }

  // Default = chat card (small image + city/price row)
  return (
    <div className="border border-stroke-card rounded-lg overflow-hidden bg-surface">
      <div className="h-[50px] bg-placeholder relative overflow-hidden flex items-center justify-center">
        {photo ? (
          <Image src={photo} alt={cityTo} fill className="object-cover" />
        ) : (
          <span className="text-[9px] text-ink-muted">{cityTo}</span>
        )}
      </div>
      <div className="px-2 py-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-ink truncate">{cityTo}, {countryTo.code}</div>
          <div className="text-[9px] text-ink-muted">{ranking?.tags?.[0] ?? stops} · {formatDuration(duration.total)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-[14px] font-semibold leading-none ${priceColor(price)}`}>${price}</div>
          <a href={bookingLink} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-flex items-center justify-center w-[50px] h-[22px] bg-[#1D9E75] text-white text-[9px] font-medium rounded-lg hover:bg-[#179968] transition-colors">
            Book →
          </a>
        </div>
      </div>
    </div>
  )
}
