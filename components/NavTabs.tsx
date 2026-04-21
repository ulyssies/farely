'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: '1 — Home / Landing', href: '/' },
  { label: '2 — Search Results', href: '/results' },
  { label: '3 — AI Discovery', href: '/discover' },
]

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <div className="max-w-[900px] mx-auto mb-3.5 flex border border-stroke rounded-lg overflow-hidden bg-surface">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-[9px] px-1 text-center text-[11px] font-medium transition-colors ${
              i < TABS.length - 1 ? 'border-r border-stroke' : ''
            } ${
              active
                ? 'bg-surface-2 text-ink'
                : 'bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
