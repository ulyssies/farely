'use client'

import { useState, useRef, useEffect } from 'react'
import type { FlightResult } from '@/lib/tequila'
import type { ParsedQuery } from '@/lib/claude'
import FlightCard from '@/components/FlightCard'

type EnrichedFlight = FlightResult & {
  photo?: string | null
  ranking?: { score?: number; reason?: string; tags?: string[] }
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  results?: EnrichedFlight[]
}

interface AISearchResponse {
  results: EnrichedFlight[]
  parsed: ParsedQuery
  count: number
  message?: string
}

interface ChatPanelProps {
  initialQuery?: string
  onResultsChange?: (results: EnrichedFlight[]) => void
}

const SUGGESTED_CHIPS = ['Beach only', 'Weather', 'International only', 'Nonstop only']

export default function ChatPanel({ initialQuery, onResultsChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const ranInitial = useRef(false)

  useEffect(() => {
    if (initialQuery && !ranInitial.current) {
      ranInitial.current = true
      runQuery(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function runQuery(query: string) {
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json() as AISearchResponse
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Search failed')

      const count = data.count ?? 0
      const text = count > 0
        ? `Searching routes from ATL under your budget... found **${count} destinations**. Here are the best matches:`
        : (data.message ?? 'No flights found. Try different dates or a broader destination.')

      setMessages(prev => [...prev, { role: 'assistant', content: text, results: data.results }])
      if (onResultsChange) onResultsChange(data.results)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't complete that search: ${err instanceof Error ? err.message : 'Unknown error'}.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    runQuery(q)
  }

  function renderContent(text: string) {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-stroke-light flex items-center gap-1.5">
        <span className="text-[13px]">✨</span>
        <span className="text-[11px] font-semibold text-ink">AI flight search</span>
        <div className="ml-auto flex gap-1">
          <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#EEEDFE] text-[#534AB7]">Claude API</span>
          <span className="inline-flex items-center text-[9px] font-medium px-[7px] py-[2px] rounded-full bg-[#E1F5EE] text-[#0F6E56]">Kiwi Tequila</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 flex flex-col gap-2">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-2xl mb-2 opacity-30">✨</div>
              <p className="text-[11px] text-ink-muted">Ask me to find your perfect trip</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                {/* blue in light mode, dark blue in dark mode */}
                <div className="text-ink text-[11px] px-2.5 py-1.5 max-w-[210px] bg-[#dbeafe] dark:bg-[#1e3a5f]"
                  style={{ borderRadius: '12px 12px 2px 12px' }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-placeholder flex items-center justify-center text-[8px] font-semibold text-ink-muted flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-surface-2 text-ink text-[11px] px-2.5 py-1.5 flex-1" style={{ borderRadius: '2px 12px 12px 12px' }}>
                    {renderContent(msg.content)}
                  </div>
                </div>
                {msg.results && msg.results.length > 0 && (
                  <div className="pl-[26px] flex flex-col gap-1.5">
                    {msg.results.slice(0, 4).map(flight => (
                      <FlightCard key={flight.id} {...flight} photo={flight.photo} ranking={flight.ranking} />
                    ))}
                  </div>
                )}
                {msg.results && msg.results.length > 0 && (
                  <div className="pl-[26px] flex flex-wrap gap-1">
                    {SUGGESTED_CHIPS.map(chip => (
                      <button key={chip} onClick={() => runQuery(chip)}
                        className="bg-surface-2 border border-stroke rounded-full text-[9px] px-2 py-[3px] text-ink hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors">
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-1.5 items-start">
            <div className="w-5 h-5 rounded-full bg-placeholder flex items-center justify-center text-[8px] font-semibold text-ink-muted flex-shrink-0">AI</div>
            <div className="bg-surface-2 px-2.5 py-2" style={{ borderRadius: '2px 12px 12px 12px' }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-2 py-2 border-t border-stroke-light flex gap-1.5 items-center">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
          placeholder="Ask a follow-up..." disabled={loading}
          className="flex-1 h-8 px-2 bg-surface-2 border border-stroke rounded-lg text-[10px] text-ink placeholder-ink-muted focus:outline-none focus:border-[#1D9E75] transition-colors disabled:opacity-50" />
        <button onClick={handleSubmit} disabled={!input.trim() || loading}
          className="w-8 h-8 bg-[#1D9E75] disabled:bg-surface-2 disabled:text-ink-muted text-white text-[14px] rounded-lg transition-colors flex items-center justify-center flex-shrink-0">
          ↑
        </button>
      </div>
    </div>
  )
}
