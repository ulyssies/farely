'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  return createPortal(
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '99px',
        padding: '8px 16px',
        fontSize: '11px',
        fontWeight: 500,
        color: '#555',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '13px' }}>
        {dark ? '🌙' : '☀️'}
      </span>
      <span>{dark ? 'Dark mode' : 'Light mode'}</span>
    </button>,
    document.body
  )
}
