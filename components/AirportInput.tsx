'use client'

import { useEffect, useRef, useState } from 'react'

interface Airport {
  code: string
  name: string
  city_name?: string
  country_name?: string
  type: string
}

interface Props {
  placeholder: string
  value: string
  iata: string
  onChange: (name: string, iata: string) => void
  compact?: boolean
}

export default function AirportInput({ placeholder, value, iata, onChange, compact = false }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()
  const wrapper = useRef<HTMLDivElement>(null)

  // Sync query when value prop changes (e.g. URL navigation)
  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (term: string) => {
    if (term.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://autocomplete.travelpayouts.com/places2?` +
        `term=${encodeURIComponent(term)}&locale=en&` +
        `types[]=city&types[]=airport`
      )
      const data = await res.json()
      setResults(data.slice(0, 6))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(val), 250)
  }

  const select = (airport: Airport) => {
    const label = `${airport.name} (${airport.code})`
    setQuery(label)
    onChange(label, airport.code)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapper} style={{ position: 'relative', flex: 1, minWidth: compact ? '100px' : '120px' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: compact ? '32px' : '48px',
          padding: compact ? '0 8px' : '0 16px',
          border: '1px solid #e5e5e5',
          borderRadius: compact ? '8px' : '10px',
          background: '#f5f5f5',
          fontSize: compact ? '10px' : '14px',
          color: '#0a0a0a',
          outline: 'none',
        }}
      />

      {open && (results.length > 0 || loading) && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 1000,
          overflow: 'hidden',
          minWidth: '220px',
        }}>
          {loading && (
            <div style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>
              Searching...
            </div>
          )}
          {results.map((airport) => (
            <div
              key={airport.code}
              onClick={() => select(airport)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#0a0a0a' }}>
                  {airport.name}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
                  {airport.country_name}
                  {airport.type === 'airport' ? ' · Airport' : ' · City'}
                </div>
              </div>
              <div style={{
                fontSize: '12px', fontWeight: 600, color: '#1D9E75',
                background: '#E1F5EE', padding: '3px 8px', borderRadius: '6px', flexShrink: 0,
              }}>
                {airport.code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
