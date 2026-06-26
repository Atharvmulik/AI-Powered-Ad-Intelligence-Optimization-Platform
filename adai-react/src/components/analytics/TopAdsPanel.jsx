// src/components/analytics/TopAdsPanel.jsx
// Bento row 2 (5/12 cols) — Top Performing Ads with hover tooltips and live
// revenue updates. Owns its own topAds state and revenue interval.

import { useState, useEffect } from 'react'
import { randInt } from '@/utils/analyticsHelpers'
import { TOP_ADS_INITIAL, MAX_CTR_BAR } from '@/data/analyticsData'
import AdTooltip from './AdTooltip'

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-orange-400', 'text-purple-400', 'text-blue-400']

const formatRevenue = (val) => {
  if (val >= 100000) return `₹${Math.floor(val / 1000)},${(val % 1000).toString().padStart(3, '0')}`
  return `₹${val.toLocaleString('en-IN')}`
}

const getBarOpacity = (rank) => {
  if (rank === 1) return 'opacity-100'
  if (rank === 2) return 'opacity-85'
  if (rank === 3) return 'opacity-70'
  return 'opacity-50'
}

export default function TopAdsPanel() {
  const [topAds, setTopAds]       = useState([...TOP_ADS_INITIAL])
  const [tooltipAd, setTooltipAd] = useState(null)

  // Live revenue increment every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setTopAds(prev => prev.map(ad => {
        const newRevenue = ad.revenue + randInt(100, 500)
        return { ...ad, revenue: newRevenue, revenueDisplay: formatRevenue(newRevenue) }
      }))
    }, 6000)
    return () => clearInterval(id)
  }, [])

  // Close tooltip on outside click
  useEffect(() => {
    const handleClick = () => setTooltipAd(null)
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
        <h3 className="text-on-surface font-bold text-title-lg">Top Performing Ads</h3>
      </div>

      <div className="space-y-4 flex-1">
        {topAds.map((ad) => (
          <AdTooltip
            key={ad.rank}
            content={`Campaign: ${ad.name} | Status: ${ad.status} | Advertiser: ${ad.brand}`}
            show={tooltipAd === ad.rank}
          >
            <div
              className="flex items-center gap-3 group cursor-pointer transition-all duration-200 hover:bg-surface-container-high/50 rounded-lg p-2 -mx-2"
              onMouseEnter={() => setTooltipAd(ad.rank)}
              onMouseLeave={() => setTooltipAd(null)}
            >
              <span className={`text-xl font-black w-6 shrink-0 ${RANK_COLORS[ad.rank - 1]}`}>
                {ad.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-on-surface truncate pr-2">{ad.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant shrink-0">
                    {ad.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`bg-primary h-full rounded-full transition-all ${getBarOpacity(ad.rank)}`}
                      style={{ width: `${(ad.ctr / MAX_CTR_BAR) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono text-primary shrink-0">{ad.ctr}%</span>
                  <span className="text-[10px] text-on-surface-variant font-mono shrink-0 group-hover:text-primary transition-colors">
                    {ad.revenueDisplay}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all -mr-1 text-sm">
                chevron_right
              </span>
            </div>
          </AdTooltip>
        ))}
      </div>
    </div>
  )
}