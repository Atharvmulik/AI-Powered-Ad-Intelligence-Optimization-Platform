// src/components/analytics/EngagementPanel.jsx
// Bento row 2 (4/12 cols) — Engagement card: session duration mini-chart,
// scroll depth, hover ratio. Owns its own live update intervals.

import { useState, useEffect } from 'react'
import { rand, randInt } from '@/utils/analyticsHelpers'

export default function EngagementPanel() {
  const [scrollDepth, setScrollDepth] = useState(78)
  const [hoverRatio, setHoverRatio]   = useState(14.2)
  const sessionDuration = '3m 42s'

  useEffect(() => {
    const id = setInterval(() => {
      setScrollDepth(prev => Math.min(95, Math.max(65, prev + randInt(-2, 2))))
      setHoverRatio(prev => {
        const next = prev + parseFloat(rand(-1.5, 1.5).toFixed(1))
        return Math.min(22, Math.max(8, next))
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-on-surface font-bold text-title-lg">Engagement</h3>
          <p className="text-xs text-on-surface-variant">Avg. Session Duration</p>
        </div>
        <div className="text-right">
          <span className="text-[#ffb783] font-bold text-lg">+12.4%</span>
          <p className="text-sm font-mono text-on-surface mt-1">{sessionDuration}</p>
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="h-32 flex items-center justify-center border-b border-outline-variant/30 mb-4">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="engagementGrad" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%"   style={{ stopColor: 'rgba(192, 193, 255, 0.3)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(192, 193, 255, 0)',   stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2" />
          <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20 V40 H0 Z" fill="url(#engagementGrad)" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase">Scroll Depth</p>
          <p className="text-lg font-bold">{scrollDepth}%</p>
          <p className="text-[9px] text-emerald-400 mt-0.5">↑ +{randInt(1, 3)}% vs yesterday</p>
        </div>
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase">Hover Ratio</p>
          <p className="text-lg font-bold">{hoverRatio.toFixed(1)}%</p>
          <p className="text-[9px] text-emerald-400 mt-0.5">↑ +{randInt(0, 2)}.{randInt(0, 9)}% vs yesterday</p>
        </div>
      </div>
    </div>
  )
}