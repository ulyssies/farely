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
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !to) {
      setError('Please enter an origin and destination')
      return
    }
    setError('')
    const params = new URLSearchParams({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      depart: dateFrom,
      ...(dateTo && { return: dateTo }),
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

  const inputStyle: React.CSSProperties = {
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    height: '48px',
    padding: '0 16px',
    fontSize: '14px',
    color: '#1a1a1a',
    outline: 'none',
    flex: 1,
    minWidth: '100px',
  }

  return (
    <div className="w-full">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'white',
        borderRadius: '14px',
        padding: '10px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        flexWrap: 'wrap',
      }}>
        <input value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="✈ From (IATA)"
          required maxLength={3} style={{ ...inputStyle, minWidth: '120px' }} />
        <input value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="To (IATA)"
          maxLength={3} style={{ ...inputStyle, minWidth: '120px' }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          required style={{ ...inputStyle, flex: 'none', width: '140px' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ ...inputStyle, flex: 'none', width: '140px' }} />
        <button type="submit" onClick={handleSubmit} style={{
          background: '#1D9E75',
          color: 'white',
          borderRadius: '10px',
          height: '48px',
          padding: '0 24px',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          Search
        </button>
      </div>
      {error && (
        <p style={{ color: '#D85A30', fontSize: '12px', marginTop: '8px', textAlign: 'left' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', justifyContent: 'center' }}>
        {['Round trip', 'One way', 'Multi-city', '1 adult', 'Economy'].map((label, i) => (
          <span key={label} style={{
            background: i === 0 ? '#0a0a0a' : 'white',
            border: `1px solid ${i === 0 ? '#0a0a0a' : '#e5e5e5'}`,
            borderRadius: '99px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: i === 0 ? 'white' : '#555',
            cursor: 'pointer',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
