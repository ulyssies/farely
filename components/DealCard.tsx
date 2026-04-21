'use client'

import Image from 'next/image'
import { buildSkyscannerLink } from '@/lib/tequila'

interface DealCardProps {
  flyFrom: string
  flyTo: string
  cityTo: string
  countryTo: string
  price: number
  dTime: number
  stops?: number
  photo?: string | null
}

function priceColor(price: number): string {
  if (price < 150) return 'text-[#1D9E75]'
  if (price < 350) return 'text-[#BA7517]'
  return 'text-[#993C1D]'
}

export default function DealCard({ flyFrom, flyTo, cityTo, countryTo, price, dTime, stops = 0, photo }: DealCardProps) {
  const bookingLink = buildSkyscannerLink(flyFrom, flyTo, dTime)
  const stopsLabel = stops === 0 ? 'nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`

  return (
    <a href={bookingLink} target="_blank" rel="noopener noreferrer"
      className="block border border-stroke-card rounded-lg overflow-hidden bg-surface hover:border-stroke transition-colors">
      <div className="h-[72px] bg-placeholder relative flex items-center justify-center overflow-hidden">
        {photo ? (
          <Image src={photo} alt={cityTo} fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-ink-muted text-sm">📷</span>
            <span className="text-[9px] text-ink-muted">{cityTo}</span>
            <span className="text-[8px] font-medium px-[7px] py-[2px] rounded-full bg-[#FAEEDA] text-[#854F0B]">Unsplash</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="text-[11px] font-semibold text-ink">{cityTo}</div>
        <div className={`text-[12px] font-semibold ${priceColor(price)}`}>from ${price}</div>
        <div className="text-[9px] text-ink-muted">{flyFrom} · {stopsLabel}</div>
      </div>
    </a>
  )
}
