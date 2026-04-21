'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUGGESTIONS = [
  'Somewhere warm with great beaches under $400',
  'A vibrant city for a solo weekend trip',
  'Romantic escape in Europe next month',
  'Adventure destination for hiking and nature',
  'Cultural trip with great food and nightlife',
]

interface AIPromptBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  prefilled?: string
  showTags?: boolean
}

export default function AIPromptBar({ onSearch, placeholder, prefilled, showTags = true }: AIPromptBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(prefilled ?? '')
  const [focused, setFocused] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    if (onSearch) onSearch(query)
    else router.push(`/discover?q=${encodeURIComponent(query)}`)
  }

  function useSuggestion(s: string) {
    setQuery(s)
    setTimeout(() => {
      if (onSearch) onSearch(s)
      else router.push(`/discover?q=${encodeURIComponent(s)}`)
    }, 0)
  }

  return (
    <div className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className="border border-dashed border-stroke rounded-lg bg-surface-3 px-3.5 py-2.5 flex items-center gap-2"
        style={{ borderWidth: '1.5px' }}
      >
        <span className="text-[13px] flex-shrink-0">✨</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder ?? '"I have $400 and 5 days — where can I go from ATL?"'}
          className="flex-1 bg-transparent text-[11px] text-ink placeholder-ink-muted italic focus:outline-none min-w-0"
        />
        {showTags && (
          <div className="flex gap-1 flex-shrink-0">
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#EEEDFE] text-[#534AB7] whitespace-nowrap">Claude API</span>
            <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56] whitespace-nowrap">Kiwi Tequila</span>
          </div>
        )}
        {!showTags && query.trim() && (
          <button type="submit" className="text-[10px] font-semibold text-[#1D9E75] flex-shrink-0 hover:underline">
            Go →
          </button>
        )}
      </form>

      {focused && !query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-stroke rounded-lg shadow-sm z-10 overflow-hidden">
          <p className="text-[9px] text-ink-muted px-3 pt-2 pb-1 uppercase tracking-wide font-medium">Try asking</p>
          {SUGGESTIONS.map(s => (
            <button key={s} onMouseDown={() => useSuggestion(s)}
              className="w-full text-left px-3 py-2 text-[11px] text-ink hover:bg-surface-2 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
