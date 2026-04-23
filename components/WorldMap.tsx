'use client'

import { useEffect, useRef, useState } from 'react'
import type { Topology, GeometryCollection } from 'topojson-specification'

type D3 = typeof import('d3')
type TJ = typeof import('topojson-client')

// Cached after first load so all subsequent redraws (resize) are synchronous
let cachedD3: D3 | null = null
let cachedTJ: TJ | null = null
let cachedTopo: Topology | null = null

async function loadDeps(): Promise<void> {
  if (cachedD3) return
  const [d3, tj, topo] = await Promise.all([
    import('d3'),
    import('topojson-client'),
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
  ])
  cachedD3 = d3
  cachedTJ = tj
  cachedTopo = topo as Topology
}

interface Arc {
  from: [number, number]
  to: [number, number]
  label?: string
}

interface WorldMapProps {
  arcs?: Arc[]
  origin?: [number, number]
  className?: string
  style?: React.CSSProperties
  renderKey?: number
}

function paint(
  svgEl: SVGSVGElement,
  arcs: Arc[],
  origin: [number, number] | undefined,
  animate: boolean,
) {
  const d3 = cachedD3!
  const tj = cachedTJ!
  const topo = cachedTopo!

  const svg = d3.select(svgEl)
  const { width, height } = svgEl.getBoundingClientRect()
  if (!width || !height) return

  svg.selectAll('*').remove()

  const scale = Math.min(width / 6.27, height / 3.27)
  const proj = d3.geoNaturalEarth1().scale(scale).translate([width / 2, height / 2])
  const path = d3.geoPath().projection(proj)

  svg.append('path').datum(d3.geoGraticule()()).attr('d', path)
    .attr('fill', 'none').attr('stroke', '#e0e0dc').attr('stroke-width', 0.4)

  const countries = tj.feature(topo, topo.objects.countries as GeometryCollection) as unknown as GeoJSON.FeatureCollection
  svg.append('g').selectAll('path').data(countries.features).join('path')
    .attr('d', path).attr('fill', '#e8e8e4').attr('stroke', '#d8d8d4').attr('stroke-width', 0.4)

  for (const arc of arcs) {
    const lerp = d3.geoInterpolate([arc.from[0], arc.from[1]], [arc.to[0], arc.to[1]])
    const arcPath = svg.append('path')
      .datum({ type: 'LineString' as const, coordinates: d3.range(0, 1.01, 0.01).map(t => lerp(t)) })
      .attr('d', path as unknown as string)
      .attr('fill', 'none').attr('stroke', '#1D9E75').attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round').attr('opacity', 0.7)

    if (animate) {
      const len = (arcPath.node() as SVGPathElement | null)?.getTotalLength() ?? 0
      arcPath.attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition().duration(900).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
    }

    const pt = proj([arc.to[0], arc.to[1]])
    if (pt) {
      svg.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 3)
        .attr('fill', '#1D9E75')
        .attr('opacity', animate ? 0 : 1)
        .transition().delay(animate ? 900 : 0).attr('opacity', 1)
    }
  }

  if (origin) {
    const pt = proj([origin[0], origin[1]])
    if (pt) {
      const g = svg.append('g').attr('transform', `translate(${pt[0]}, ${pt[1]})`)
      if (animate) {
        const pulse = g.append('circle').attr('r', 4).attr('fill', 'none')
          .attr('stroke', '#1D9E75').attr('stroke-width', 1.5).attr('opacity', 0.7)
        const loop = () =>
          pulse.attr('r', 4).attr('opacity', 0.7)
            .transition().duration(1500).ease(d3.easeLinear)
            .attr('r', 14).attr('opacity', 0).on('end', loop)
        loop()
      }
      g.append('circle').attr('r', 4).attr('fill', '#1D9E75')
    }
  }
}

export default function WorldMap({ arcs = [], origin, className = '', style, renderKey }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [loaded, setLoaded] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    // animate = true for the first draw each time deps change; false for resize redraws
    let animate = true
    let rafId: ReturnType<typeof requestAnimationFrame> | null = null
    let cancelled = false

    observerRef.current?.disconnect()

    function draw() {
      if (!svgRef.current) return
      paint(svgRef.current, arcs, origin, animate)
      animate = false
    }

    loadDeps().then(() => {
      if (cancelled || !svgRef.current) return
      draw()
      setLoaded(true)

      // Skip the initial ResizeObserver callback that fires on observe()
      let skipFirst = true
      const observer = new ResizeObserver(() => {
        if (skipFirst) { skipFirst = false; return }
        if (cancelled) return
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          if (!cancelled) draw()
          rafId = null
        })
      })
      observer.observe(svgRef.current)
      observerRef.current = observer
    })

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [arcs, origin, renderKey])

  return (
    <div className={`relative overflow-hidden bg-page ${className}`} style={{ isolation: 'isolate', zIndex: 0, position: 'relative', ...style }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-page">
          <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ position: 'relative', zIndex: 0, isolation: 'isolate', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
      />
    </div>
  )
}
