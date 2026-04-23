'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DealCardProps {
  city: string
  country: string
  iata: string
  price: number
  stops: number
  duration: string
  origin?: string
  allPrices: number[]
  index: number
}

function getPriceColor(price: number, allPrices: number[]): string {
  const mean = allPrices.reduce((a, b) => a + b, 0) / allPrices.length
  const pct = price / mean
  if (pct <= 0.8) return '#1D9E75'
  if (pct <= 1.1) return '#BA7517'
  return '#D85A30'
}

type ImageState = 'loading' | 'loaded' | 'empty'

export default function DealCard({
  city, country, iata, price, stops, duration, origin = 'ATL', allPrices, index,
}: DealCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState>('loading')
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/unsplash?city=${encodeURIComponent(city)}`)
        const data: { imageUrl: string | null } = await res.json()
        setImageUrl(data.imageUrl)
        setImageState(data.imageUrl ? 'loaded' : 'empty')
      } catch {
        setImageState('empty')
      }
    }, index * 100)
    return () => clearTimeout(timer)
  }, [city, index])

  const color = getPriceColor(price, allPrices)
  const stopsLabel = stops === 0 ? 'nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`

  return (
    <div
      className="border border-[#e0e0e0] rounded-lg bg-white overflow-hidden cursor-pointer hover:border-[#c8c8c8] transition-colors"
      onClick={() => router.push(`/results?from=${origin}&to=${iata}&city=${encodeURIComponent(city)}`)}
    >
      <div className="h-20 relative overflow-hidden bg-[#e8e8e8]">
        {imageState === 'loading' && (
          <div className="w-full h-full bg-[#e8e8e8] animate-pulse" />
        )}
        {imageState === 'loaded' && imageUrl && (
          <img src={imageUrl} alt={city} className="w-full h-full object-cover" />
        )}
        {imageState === 'empty' && (
          <div className="w-full h-full bg-[#e8e8e8]" />
        )}
      </div>
      <div className="p-2">
        <div className="text-[12px] font-semibold text-[#1a1a1a]">{city}</div>
        <div className="text-[10px] text-[#888] mb-1">{country}</div>
        <div className="text-[13px] font-semibold" style={{ color }}>from ${price}</div>
        <div className="text-[9px] text-[#888]">{origin} · {stopsLabel} · {duration}</div>
      </div>
    </div>
  )
}
