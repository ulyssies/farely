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

const REGION_GRADIENTS: Record<string, string> = {
  MIA: 'linear-gradient(135deg, #0077B6, #00B4D8)',
  FLL: 'linear-gradient(135deg, #0077B6, #00B4D8)',
  TPA: 'linear-gradient(135deg, #0077B6, #48CAE4)',
  CUN: 'linear-gradient(135deg, #0096C7, #48CAE4)',
  SJU: 'linear-gradient(135deg, #023E8A, #0077B6)',
  MBJ: 'linear-gradient(135deg, #0096C7, #90E0EF)',
  NAS: 'linear-gradient(135deg, #00B4D8, #90E0EF)',
  PUJ: 'linear-gradient(135deg, #0077B6, #48CAE4)',
  AUA: 'linear-gradient(135deg, #023E8A, #00B4D8)',
  LHR: 'linear-gradient(135deg, #6B705C, #A5A58D)',
  CDG: 'linear-gradient(135deg, #8B5E3C, #C49A6C)',
  BCN: 'linear-gradient(135deg, #C1121F, #E76F51)',
  FCO: 'linear-gradient(135deg, #8B5E3C, #F4A261)',
  LIS: 'linear-gradient(135deg, #457B9D, #A8DADC)',
  NRT: 'linear-gradient(135deg, #D62828, #F77F00)',
  BKK: 'linear-gradient(135deg, #6A0572, #D4A5A5)',
  DXB: 'linear-gradient(135deg, #C9A84C, #E8C547)',
  MEX: 'linear-gradient(135deg, #2D6A4F, #74C69D)',
  BOG: 'linear-gradient(135deg, #1B4332, #52B788)',
  default: 'linear-gradient(135deg, #1D9E75, #0a4a35)',
}

export default function DealCard({
  city, country, iata, price, stops, duration, origin = 'ATL', allPrices, index,
}: DealCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState>('loading')
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const searchTerm = city.length > 3 ? city : 'travel destination'
        const res = await fetch(`/api/unsplash?city=${encodeURIComponent(searchTerm)}`)
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
  const gradient = REGION_GRADIENTS[iata] ?? REGION_GRADIENTS.default

  return (
    <div
      className="border border-[#e0e0e0] rounded-lg bg-white overflow-hidden cursor-pointer hover:border-[#c8c8c8] transition-colors"
      onClick={() => router.push(`/results?from=${origin}&to=${iata}&city=${encodeURIComponent(city)}`)}
    >
      <div className="h-20 relative overflow-hidden bg-[#e8e8e8]">
        {imageState === 'loading' && (
          <div className="w-full h-full bg-[#e8e8e8] animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-[#aaa]">{city}</span>
          </div>
        )}
        {imageState === 'loaded' && imageUrl && (
          <img
            src={imageUrl}
            alt={city}
            className="w-full h-full object-cover"
            onError={() => setImageState('empty')}
          />
        )}
        {imageState === 'empty' && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <span className="text-[10px] font-medium text-white opacity-90">{city}</span>
          </div>
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
