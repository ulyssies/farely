'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const HOST_ID = 'farely-theme-toggle-root'

let hostEl: HTMLDivElement | null = null

function ensureThemeToggleHost(): HTMLDivElement {
  if (hostEl && document.documentElement.contains(hostEl)) {
    return hostEl
  }
  const el = document.createElement('div')
  el.id = HOST_ID
  const s = el.style
  s.setProperty('position', 'fixed', 'important')
  s.setProperty('inset', '0', 'important')
  s.setProperty('z-index', '2147483647', 'important')
  s.setProperty('pointer-events', 'none', 'important')
  s.setProperty('margin', '0', 'important')
  s.setProperty('padding', '0', 'important')

  // Mount before <body> so this node is not under any app wrapper that uses
  // transform/filter (which makes fixed descendants scroll with the page).
  const { documentElement, body } = document
  if (body && documentElement.contains(body)) {
    documentElement.insertBefore(el, body)
  } else {
    document.body.appendChild(el)
  }
  hostEl = el
  return el
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setContainer(ensureThemeToggleHost())
  }, [])

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  if (!container) return null

  return createPortal(
    <div
      style={{
        position: 'absolute',
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 bg-surface border border-stroke rounded-full px-4 py-2 text-[11px] font-medium text-ink shadow-sm hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
      >
        <span className="text-[13px]">{dark ? '🌙' : '☀️'}</span>
        <span>{dark ? 'Dark mode' : 'Light mode'}</span>
      </button>
    </div>,
    container
  )
}
