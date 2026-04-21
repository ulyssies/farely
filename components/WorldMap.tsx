'use client'

import { useEffect, useRef, useState } from 'react'
import type { Topology, GeometryCollection } from 'topojson-specification'

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
}

export default function WorldMap({ arcs = [], origin, className = '', style }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const [d3, topojsonModule, topoData] = await Promise.all([
        import('d3'),
        import('topojson-client'),
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()) as Promise<Topology>,
      ])

      if (cancelled || !svgRef.current) return

      const svg = d3.select(svgRef.current)
      const { width, height } = svgRef.current.getBoundingClientRect()
      if (!width || !height) return

      svg.selectAll('*').remove()

      const projection = d3.geoNaturalEarth1()
        .scale(width / 6.2)
        .translate([width / 2, height / 2])

      const path = d3.geoPath().projection(projection)

      // Graticule
      const graticule = d3.geoGraticule()
      svg.append('path')
        .datum(graticule())
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0dc')
        .attr('stroke-width', 0.4)

      // Countries
      const countries = topojsonModule.feature(
        topoData,
        topoData.objects.countries as GeometryCollection,
      ) as unknown as GeoJSON.FeatureCollection

      svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('fill', '#e8e8e4')
        .attr('stroke', '#d8d8d4')
        .attr('stroke-width', 0.4)

      // Animated arcs
      for (const arc of arcs) {
        const line = d3.geoInterpolate(
          [arc.from[0], arc.from[1]],
          [arc.to[0], arc.to[1]],
        )

        const arcPath = svg.append('path')
          .datum({
            type: 'LineString' as const,
            coordinates: d3.range(0, 1.01, 0.01).map(t => line(t)),
          })
          .attr('d', path as unknown as string)
          .attr('fill', 'none')
          .attr('stroke', '#1D9E75')
          .attr('stroke-width', 1.5)
          .attr('stroke-linecap', 'round')
          .attr('opacity', 0.7)

        const node = arcPath.node() as SVGPathElement | null
        const totalLength = node?.getTotalLength() ?? 0
        arcPath
          .attr('stroke-dasharray', totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(900)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)

        const projected = projection([arc.to[0], arc.to[1]])
        if (projected) {
          svg.append('circle')
            .attr('cx', projected[0])
            .attr('cy', projected[1])
            .attr('r', 3)
            .attr('fill', '#1D9E75')
            .attr('opacity', 0)
            .transition()
            .delay(900)
            .attr('opacity', 1)
        }
      }

      // Origin pulsing dot
      if (origin) {
        const projected = projection([origin[0], origin[1]])
        if (projected) {
          const g = svg.append('g').attr('transform', `translate(${projected[0]}, ${projected[1]})`)

          const pulse = g.append('circle')
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', '#1D9E75')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.7)

          const animate = () => {
            pulse
              .attr('r', 4).attr('opacity', 0.7)
              .transition().duration(1500).ease(d3.easeLinear)
              .attr('r', 14).attr('opacity', 0)
              .on('end', animate)
          }
          animate()

          g.append('circle').attr('r', 4).attr('fill', '#1D9E75')
        }
      }

      setLoaded(true)
    }

    render()
    return () => { cancelled = true }
  }, [arcs, origin])

  return (
    <div className={`relative overflow-hidden bg-page ${className}`} style={style}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-page">
          <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
      />
    </div>
  )
}
