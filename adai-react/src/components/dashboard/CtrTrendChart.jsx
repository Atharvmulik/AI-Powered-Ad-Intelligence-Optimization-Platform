// ============================================================
// src/components/dashboard/CtrTrendChart.jsx
// ============================================================

import { useState, useRef } from 'react'

export default function CtrTrendChart({ ctrHistory = [], ctrTimestamps = [] }) {
  const [hoveredCtrPoint, setHoveredCtrPoint] = useState(null)
  const chartContainerRef = useRef(null)

  const pairedPoints = []
  const history = Array.isArray(ctrHistory) ? ctrHistory : []
  const timestamps = Array.isArray(ctrTimestamps) ? ctrTimestamps : []
  const maxLength = Math.min(history.length, timestamps.length)

  for (let index = 0; index < maxLength; index += 1) {
    const value = Number(history[index])
    if (Number.isFinite(value)) {
      pairedPoints.push({
        value,
        timestamp: timestamps[index] ?? `#${index + 1}`,
      })
    }
  }

  const series = pairedPoints.slice(-60)

  const generateCurvePath = (data, w, h) => {
    if (!data || data.length === 0) {
      return { lineD: '', areaD: '', points: [] }
    }

    const values = data.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || Math.abs(max) || 1
    const padding = span * 0.2 || 1
    const yMin = min - padding
    const yMax = max + padding
    const range = yMax - yMin || 1

    const points = data.map((point, index) => {
      const x = data.length === 1 ? w / 2 : (index / (data.length - 1)) * w
      const y = h - ((point.value - yMin) / range) * (h - 30) - 15
      return { x, y, value: point.value, timestamp: point.timestamp }
    })

    let d = `M ${points[0].x} ${points[0].y}`

    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i]
        const p1 = points[i + 1]
        const cpX1 = p0.x + (p1.x - p0.x) / 2
        const cpY1 = p0.y
        const cpX2 = p0.x + (p1.x - p0.x) / 2
        const cpY2 = p1.y
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
      }
    }

    return {
      lineD: d,
      areaD: `${d} L ${w} ${h} L 0 ${h} Z`,
      points,
    }
  }

  const handleChartMouseMove = (e) => {
    if (!chartContainerRef.current || series.length === 0) return

    const rect = chartContainerRef.current.getBoundingClientRect()
    const containerWidth = rect.width || 500
    const containerHeight = rect.height || 180
    const relativeX = ((e.clientX - rect.left) / rect.width) * 500
    const { points } = generateCurvePath(series, 500, 180)

    if (points.length === 0) return

    let nearestIndex = 0
    let minDistance = Infinity

    points.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = index
      }
    })

    const point = points[nearestIndex]
    const tooltipWidth = 120
    const tooltipX = Math.min(
      Math.max((point.x / 500) * containerWidth, 8),
      containerWidth - tooltipWidth - 8
    )
    const tooltipY = Math.max(10, ((point.y / 180) * containerHeight) - 65)

    setHoveredCtrPoint({
      idx: nearestIndex,
      x: point.x,
      y: point.y,
      val: point.value,
      time: point.timestamp,
      tooltipX,
      tooltipY,
    })
  }

  const handleChartMouseLeave = () => setHoveredCtrPoint(null)

  const activeCtr = series.length > 0 ? series[series.length - 1].value : 0
  const avgCtr =
    series.length > 0
      ? (series.reduce((sum, point) => sum + point.value, 0) / series.length).toFixed(2)
      : '0.00'
  const peakCtr = series.length > 0 ? Math.max(...series.map((point) => point.value)).toFixed(1) : '0.0'

  return (
    <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-title-lg text-title-lg text-on-surface">CTR Performance Trend</h3>
          <p className="text-xs text-on-surface-variant font-mono">Real-time CTR • Live synthetic traffic</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">
              Current CTR
            </span>
            <span className="text-lg font-black text-primary font-mono">{activeCtr.toFixed(2)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">
              Average CTR
            </span>
            <span className="text-lg font-black text-on-surface font-mono">{avgCtr}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">
              Peak CTR
            </span>
            <span className="text-lg font-black text-[#ffb783] font-mono">{peakCtr}%</span>
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="flex-1 w-full h-[180px] relative bg-surface-container-low/30 border border-outline-variant/30 rounded-lg overflow-hidden cursor-crosshair"
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
      >
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 py-8">
          <div className="w-full border-t border-outline-variant/15"></div>
          <div className="w-full border-t border-outline-variant/15"></div>
          <div className="w-full border-t border-outline-variant/15"></div>
        </div>

        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-on-surface-variant font-mono">
            No live CTR data yet
          </div>
        ) : (
          <svg className="w-full h-full p-2" preserveAspectRatio="none" viewBox="0 0 500 180">
            <defs>
              <linearGradient id="chartGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop
                  offset="0%"
                  style={{ stopColor: 'rgba(192, 193, 255, 0.25)', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'rgba(192, 193, 255, 0)', stopOpacity: 1 }}
                />
              </linearGradient>
              <filter id="shadowGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="6"
                  floodColor="#8083ff"
                  floodOpacity="0.45"
                />
              </filter>
            </defs>

            <>
              <path
                d={generateCurvePath(series, 500, 180).areaD}
                fill="url(#chartGlow)"
              />
              <path
                d={generateCurvePath(series, 500, 180).lineD}
                fill="none"
                stroke="#c0c1ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#shadowGlow)"
              />
            </>

            {hoveredCtrPoint && (
              <>
                <line
                  x1={hoveredCtrPoint.x}
                  y1="0"
                  x2={hoveredCtrPoint.x}
                  y2="180"
                  stroke="rgba(192, 193, 255, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={hoveredCtrPoint.x}
                  cy={hoveredCtrPoint.y}
                  r="5"
                  fill="#c0c1ff"
                  stroke="#13131a"
                  strokeWidth="2"
                  className="shadow-[0_0_10px_#8083ff]"
                />
              </>
            )}
          </svg>
        )}

        {hoveredCtrPoint && (
          <div
            className="absolute z-30 pointer-events-none bg-surface-container-high/95 border border-outline rounded-lg p-2.5 shadow-2xl text-[11px] font-mono w-[120px]"
            style={{
              left: `${hoveredCtrPoint.tooltipX}px`,
              top: `${hoveredCtrPoint.tooltipY}px`,
            }}
          >
            <div className="text-on-surface-variant font-bold">Time: {hoveredCtrPoint.time}</div>
            <div className="text-primary font-extrabold text-sm mt-0.5">
              CTR: {hoveredCtrPoint.val?.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 text-[10px] text-on-surface-variant font-mono font-bold">
        <span>Live window</span>
        <span>{Math.min(series.length, 60)} points</span>
      </div>
    </div>
  )
}