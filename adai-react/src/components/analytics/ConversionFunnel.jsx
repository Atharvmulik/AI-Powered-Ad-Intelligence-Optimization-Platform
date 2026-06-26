// src/components/analytics/ConversionFunnel.jsx
// Row 3 (5/12 cols) — Conversion funnel: Impressions → Clicks → Conversions → Revenue Events.
// Owns its own live update interval.

import { useState, useEffect } from 'react'
import { randInt } from '@/utils/analyticsHelpers'

export default function ConversionFunnel() {
  const [impressions,    setImpressions]    = useState(1200000)
  const [clicks,         setClicks]         = useState(45800)
  const [conversions,    setConversions]    = useState(12200)
  const [revenueEvents,  setRevenueEvents]  = useState(2400)

  useEffect(() => {
    const id = setInterval(() => {
      setImpressions(prev   => prev + randInt(-5000, 8000))
      setClicks(prev        => prev + randInt(-200,  400))
      setConversions(prev   => prev + randInt(-80,   150))
      setRevenueEvents(prev => prev + randInt(-20,   40))
    }, 10000)
    return () => clearInterval(id)
  }, [])

  const clicksRate       = ((clicks / impressions) * 100).toFixed(1)
  const conversionsRate  = ((conversions / clicks) * 100).toFixed(1)
  const revenueRate      = ((revenueEvents / conversions) * 100).toFixed(1)

  const impToClicksDrop  = (100 - parseFloat(clicksRate)).toFixed(1)
  const clicksToConvDrop = (100 - parseFloat(conversionsRate)).toFixed(1)
  const convToRevDrop    = (100 - parseFloat(revenueRate)).toFixed(1)

  const maxWidth         = 100
  const clicksWidth      = (clicks / impressions) * maxWidth
  const conversionsWidth = (conversions / impressions) * maxWidth
  const revenueWidth     = (revenueEvents / impressions) * maxWidth

  const rows = [
    { label: 'Impressions',    value: impressions,   rate: null,            dropLabel: impToClicksDrop,  barWidth: '100%',              opacity: 'bg-primary/30' },
    { label: 'Clicks',         value: clicks,        rate: `${clicksRate}% of impressions`,   dropLabel: clicksToConvDrop, barWidth: `${clicksWidth}%`,      opacity: 'bg-primary/40' },
    { label: 'Conversions',    value: conversions,   rate: `${conversionsRate}% of clicks`,    dropLabel: convToRevDrop,   barWidth: `${conversionsWidth}%`, opacity: 'bg-primary/50' },
    { label: 'Revenue Events', value: revenueEvents, rate: `${revenueRate}% of conversions`,  dropLabel: null,            barWidth: `${revenueWidth}%`,     opacity: 'bg-primary/60' },
  ]

  return (
    <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6">
      <h3 className="text-on-surface font-bold text-title-lg mb-2">Conversion Funnel</h3>
      <p className="text-xs text-on-surface-variant mb-6">User journey from impressions to revenue events</p>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.label}>
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-sm font-bold text-on-surface">{row.label}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-primary">
                    {row.value.toLocaleString('en-IN')}
                  </span>
                  {row.rate && (
                    <span className="text-[10px] text-emerald-400">{row.rate}</span>
                  )}
                </div>
                <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                  <div className={`${row.opacity} h-full rounded-lg`} style={{ width: row.barWidth }} />
                </div>
              </div>
            </div>
            {row.dropLabel && (
              <p className="text-[10px] text-red-400 text-right -mt-2">↓ {row.dropLabel}% drop</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}