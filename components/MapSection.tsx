'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

interface Arc {
  from: [number, number]
  to: [number, number]
  label?: string
}

interface MapSectionProps {
  arcs: Arc[]
}

export default function MapSection({ arcs }: MapSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [renderKey, setRenderKey] = useState(0)

  function toggle() {
    setExpanded(e => !e)
    // Re-render the map after the CSS transition finishes so D3 reads the final size
    setTimeout(() => setRenderKey(k => k + 1), 320)
  }

  return (
    <div
      className="relative bg-page"
      style={{ height: expanded ? 520 : 280, transition: 'height 0.3s ease' }}
    >
      <WorldMap arcs={arcs} origin={[-84.4, 33.7]} className="w-full h-full" renderKey={renderKey} />
      <button
        type="button"
        onClick={toggle}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 500,
          color: '#555',
          cursor: 'pointer',
        }}
      >
        {expanded ? '⤡ Collapse' : '⤢ Expand map'}
      </button>
    </div>
  )
}
