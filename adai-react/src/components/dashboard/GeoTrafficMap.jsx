// ============================================================
// src/components/dashboard/GeoTrafficMap.jsx
// ============================================================

import { useState, useMemo } from 'react'

// Determine dot color based on fraud rate
function getMarkerColor(fraudRate) {
  if (fraudRate >= 0.3) return { bg: 'bg-error', shadow: 'shadow-[0_0_8px_#ffb4ab]', glow: 'bg-error' }
  if (fraudRate >= 0.15) return { bg: 'bg-[#ffb783]', shadow: 'shadow-[0_0_6px_#ffb783]', glow: 'bg-[#ffb783]' }
  return { bg: 'bg-green-400', shadow: 'shadow-[0_0_8px_#4ade80]', glow: 'bg-green-400' }
}

function getMarkerSize(traffic) {
  if (traffic >= 100000) return 'w-3.5 h-3.5'
  if (traffic >= 50000) return 'w-3 h-3'
  return 'w-2 h-2'
}

function hashToPosition(name) {
  // deterministic pseudo-random position for a city name inside the SVG
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  const top = ((Math.abs(h) % 80) + 10).toString() + '%'
  const left = ((Math.abs(Math.floor(h / 7)) % 80) + 10).toString() + '%'
  return { top, left }
}

export default function GeoTrafficMap({ geoTraffic = [] }) {
  const [hoveredCity, setHoveredCity] = useState(null)

  const cityMap = useMemo(() => {
    const map = {}
    geoTraffic.forEach((item) => {
      map[item.city] = item
    })
    return map
  }, [geoTraffic])

  const markers = useMemo(() => {
    return geoTraffic.map((item) => ({ ...item, ...hashToPosition(item.city) }))
  }, [geoTraffic])

  const hoveredData = hoveredCity ? cityMap[hoveredCity] : null

  return (
    <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group relative">
      <div className="px-6 py-4 border-b border-outline-variant">
        <h3 className="font-title-lg text-title-lg text-on-surface">Geographic Traffic</h3>
      </div>
      <div className="flex-1 relative bg-surface-container-low p-4 overflow-hidden min-h-[220px] flex items-center justify-center">
        {/* Ambient grid bg */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: 'radial-gradient(circle, #c0c1ff 1px, transparent 1px)',
              backgroundSize: '15px 15px',
            }}
          ></div>
        </div>

        <div className="relative h-full w-full max-w-[200px] aspect-[4/5] flex items-center justify-center">
          {/* India outline SVG */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
            <svg
              className="w-full h-full text-outline-variant"
              viewBox="0 0 100 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M45 5 L55 10 L65 25 L85 30 L80 40 L70 50 L60 65 L55 85 L50 115 L45 85 L35 70 L25 55 L15 45 L10 30 L20 20 L35 15 Z" />
            </svg>
          </div>

          {/* Dynamic city markers from backend */}
          {markers.map((city) => {
            const color = getMarkerColor(city.fraud_rate)
            const size = getMarkerSize(city.traffic)
            return (
              <button
                key={city.city}
                style={{ top: city.top, left: city.left }}
                onMouseEnter={() => setHoveredCity(city.city)}
                onMouseLeave={() => setHoveredCity(null)}
                className={`absolute ${size} ${color.bg} rounded-full cursor-pointer hover:scale-125 transition-transform ${color.shadow} z-20`}
              >
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color.glow} opacity-60`}
                ></span>
              </button>
            )
          })}

          {/* labels are generated dynamically from backend markers when hovered */}
        </div>

        {/* Hover tooltip */}
        {hoveredCity && hoveredData && (
          <div className="absolute top-2 left-2 right-2 bg-surface-container-high/95 border border-outline rounded-lg p-2 shadow-2xl z-30 text-[10px] font-mono leading-relaxed">
            <div className="font-extrabold text-xs text-primary mb-1 uppercase tracking-wider">
              {hoveredCity} Hub
            </div>
            <div className="flex justify-between">
              <span>Traffic Vol:</span>
              <span className="font-bold text-on-surface">
                {hoveredData.traffic.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fraud Rate:</span>
              <span className="font-bold text-error">
                {(hoveredData.fraud_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conv Rate:</span>
              <span
                className={`font-bold ${
                  hoveredData.conversion_rate >= 0.05
                    ? 'text-green-400'
                    : hoveredData.conversion_rate >= 0.02
                    ? 'text-[#ffb783]'
                    : 'text-error'
                }`}
              >
                {(hoveredData.conversion_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between border-t border-outline-variant/30 mt-1 pt-1">
              <span>Top Segment:</span>
              <span className="font-bold text-tertiary">{hoveredData.top_campaign}</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[8px] font-mono uppercase bg-surface-container-high/60 backdrop-blur-sm p-1.5 rounded border border-outline-variant/30 pointer-events-none">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> High Conv
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb783]"></span> Mid
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Fraud Spill
        </div>
      </div>
    </div>
  )
}