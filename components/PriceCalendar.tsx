'use client'

import { useEffect, useState } from 'react'

interface DayPrice { date: string; price: number | null }

interface PriceCalendarProps {
  flyFrom: string
  flyTo: string
  baseDate?: Date
}

function cellStyle(price: number, min: number, max: number): { bg: string; color: string } {
  const ratio = (price - min) / (max - min || 1)
  if (ratio < 0.2)  return { bg: '#E1F5EE', color: '#0F6E56' }
  if (ratio < 0.4)  return { bg: '#EAF3DE', color: '#3B6D11' }
  if (ratio < 0.65) return { bg: '#FAEEDA', color: '#854F0B' }
  return               { bg: '#FAECE7', color: '#993C1D' }
}

function getDatesForWeek(base: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export default function PriceCalendar({ flyFrom, flyTo, baseDate }: PriceCalendarProps) {
  const [days, setDays] = useState<DayPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [cheapestDate, setCheapestDate] = useState<string | null>(null)

  useEffect(() => {
    const base = baseDate ?? new Date()
    base.setDate(base.getDate() + 7)
    const dates = getDatesForWeek(base)
    setDays(dates.map(date => ({ date, price: null })))
    setLoading(true)

    const fetchPrices = async () => {
      const results = await Promise.allSettled(
        dates.map(async date => {
          const params = new URLSearchParams({ fly_from: flyFrom, fly_to: flyTo, date_from: date, date_to: date, limit: '1' })
          const res = await fetch(`/api/flights?${params}`)
          if (!res.ok) return { date, price: null }
          const data = await res.json() as { flights: Array<{ price: number }> }
          return { date, price: data.flights[0]?.price ?? null }
        }),
      )
      const resolved = results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { date: dates[i], price: null },
      )
      setDays(resolved)
      const withPrice = resolved.filter(d => d.price !== null)
      if (withPrice.length) {
        setCheapestDate(withPrice.reduce((a, b) => a.price! < b.price! ? a : b).date)
      }
      setLoading(false)
    }
    fetchPrices()
  }, [flyFrom, flyTo, baseDate])

  const prices = days.map(d => d.price).filter((p): p is number => p !== null)
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return (
    <div className="bg-surface-3 border border-stroke-light rounded-lg p-2.5">
      <div className="text-[10px] font-semibold text-ink mb-1.5">Price calendar</div>
      <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[8px] text-ink-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {loading
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-8 rounded bg-placeholder animate-pulse" />
            ))
          : days.map(day => {
              const s = day.price ? cellStyle(day.price, min, max) : null
              return (
                <div key={day.date} className="text-center py-[2px] rounded text-[8px]"
                  style={s ? { background: s.bg, color: s.color } : { color: 'var(--color-ink-muted)' }}>
                  {day.price ? `$${day.price}` : '—'}
                </div>
              )
            })}
      </div>
      {cheapestDate && (
        <div className="text-[8px] text-ink-muted mt-1.5">
          Tip: {new Date(cheapestDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} is cheapest
        </div>
      )}
    </div>
  )
}
