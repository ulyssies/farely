'use client'

import { useEffect, useState } from 'react'

export default function WelcomeModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('farely-welcome')
    if (!seen) setShow(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('farely-welcome', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* Hero image area */}
        <div style={{
          height: '200px',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a2f2a 50%, #0f3d2e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Airplane emoji large */}
          <div style={{
            fontSize: '80px',
            transform: 'rotate(-20deg)',
            filter: 'drop-shadow(0 8px 24px rgba(29,158,117,0.4))',
            animation: 'fly 3s ease-in-out infinite',
          }}>
            ✈️
          </div>
          {/* Subtle arc lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
            <path d="M 0 160 Q 240 40 480 120" stroke="#1D9E75" strokeWidth="1.5" fill="none" strokeDasharray="6 4"/>
            <path d="M 0 180 Q 200 60 480 140" stroke="#1D9E75" strokeWidth="1" fill="none" strokeDasharray="4 6"/>
          </svg>
          {/* Logo overlay */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            fontSize: '18px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.5px',
          }}>
            fare<span style={{ color: '#1D9E75' }}>ly</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 28px 24px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#0a0a0a',
            marginBottom: '10px',
            letterSpacing: '-0.3px',
          }}>
            Your next flight, smarter
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.7,
            marginBottom: '20px',
          }}>
            Farely uses AI to find flights that match what you actually want.
            Just tell us — "I have $400 and 5 days, somewhere warm from ATL" —
            and we'll handle the rest. Real prices, real routes, one click to book.
          </p>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}>
            {[
              '✈ AI-powered search',
              '🗺 Live route map',
              '💸 Cheapest fares',
              '🔔 Price alerts',
            ].map(f => (
              <span key={f} style={{
                background: '#f5f5f5',
                border: '1px solid #e5e5e5',
                borderRadius: '99px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#555',
              }}>{f}</span>
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={dismiss}
            style={{
              width: '100%',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.1px',
            }}
          >
            Find my next flight →
          </button>

          <p style={{
            fontSize: '11px',
            color: '#aaa',
            textAlign: 'center',
            marginTop: '12px',
          }}>
            Click anywhere outside to close
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fly {
          0%, 100% { transform: rotate(-20deg) translateY(0px); }
          50% { transform: rotate(-20deg) translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
