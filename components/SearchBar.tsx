'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  compact?: boolean
  defaultOrigin?: string
  defaultDest?: string
  defaultDateFrom?: string
  defaultDateTo?: string
  defaultPassengers?: number
}

export default function SearchBar({
  compact = false,
  defaultOrigin = '',
  defaultDest = '',
  defaultDateFrom = '',
  defaultDateTo = '',
  defaultPassengers = 1,
}: SearchBarProps) {
  const router = useRouter()
  const [from, setFrom] = useState(defaultOrigin)
  const [to, setTo] = useState(defaultDest)
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)
  const [passengers, setPassengers] = useState(defaultPassengers)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !dateFrom) return
    const params = new URLSearchParams({
      fly_from: from.toUpperCase(),
      date_from: dateFrom,
      date_to: dateTo || dateFrom,
      adults: String(passengers),
      ...(to && { fly_to: to.toUpperCase() }),
    })
    router.push(`/results?${params.toString()}`)
  }

  const inputCls = `bg-surface-2 border border-stroke rounded-lg text-[10px] text-ink placeholder-ink-muted focus:outline-none focus:border-[#1D9E75] transition-colors`

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 flex-1">
        <input value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="From" maxLength={3}
          className={`${inputCls} h-8 px-2 w-14 text-center font-medium`} />
        <span className="text-ink-muted text-xs">→</span>
        <input value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="To" maxLength={3}
          className={`${inputCls} h-8 px-2 w-14 text-center font-medium`} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className={`${inputCls} h-8 px-2 w-[82px]`} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className={`${inputCls} h-8 px-2 w-[82px]`} />
        <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
          className={`${inputCls} h-8 px-2 w-[70px] cursor-pointer`}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>
          ))}
        </select>
        <button type="submit"
          className="h-8 w-[70px] bg-[#1D9E75] text-white text-[11px] font-semibold rounded-lg hover:bg-[#179968] transition-colors flex-shrink-0">
          Search
        </button>
      </form>
    )
  }

  return (
    <div className="w-full">
      <div className="border border-stroke rounded-xl p-2.5 flex items-center gap-2 bg-surface flex-wrap">
        <input value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="✈ From (origin)"
          required maxLength={3} className={`${inputCls} flex-1 min-w-[100px] h-9 px-3`} />
        <input value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="To (destination)"
          maxLength={3} className={`${inputCls} flex-1 min-w-[100px] h-9 px-3`} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          required className={`${inputCls} w-[90px] h-9 px-2`} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className={`${inputCls} w-[90px] h-9 px-2`} />
        <button type="submit" onClick={handleSubmit}
          className="w-20 h-9 bg-[#1D9E75] text-white text-[11px] font-semibold rounded-lg hover:bg-[#179968] transition-colors flex-shrink-0">
          Search
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-2.5 justify-center">
        {['One way', 'Round trip', 'Multi-city', '1 adult', 'Economy'].map(label => (
          <span key={label}
            className="bg-surface-2 border border-stroke rounded-full px-[10px] py-[3px] text-[10px] text-ink cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
