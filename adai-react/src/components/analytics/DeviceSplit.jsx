// src/components/analytics/DeviceSplit.jsx
// Bento row 2 (3/12 cols) — Device split bars with live percentage updates.
// Owns its own interval.

import { useState, useEffect } from 'react'
import { rand } from '@/utils/analyticsHelpers'

export default function DeviceSplit() {
  const [mobilePct,  setMobilePct]  = useState(64.5)
  const [desktopPct, setDesktopPct] = useState(32.1)
  const [tabletPct,  setTabletPct]  = useState(3.4)

  useEffect(() => {
    const id = setInterval(() => {
      setMobilePct(prev  => Math.min(70, Math.max(58, prev  + parseFloat(rand(-0.3, 0.3).toFixed(1)))))
      setDesktopPct(prev => Math.min(38, Math.max(26, prev + parseFloat(rand(-0.3, 0.3).toFixed(1)))))
      setTabletPct(prev  => Math.min(8,  Math.max(2.5, prev + parseFloat(rand(-0.3, 0.3).toFixed(1)))))
    }, 12000)
    return () => clearInterval(id)
  }, [])

  const devices = [
    { icon: 'smartphone', color: 'text-primary',   label: 'Mobile',  val: mobilePct,  barColor: 'bg-primary',   trend: 'up',      trendVal: '+2.1% vs last week' },
    { icon: 'laptop',     color: 'text-secondary',  label: 'Desktop', val: desktopPct, barColor: 'bg-secondary', trend: 'down',    trendVal: '-1.8% vs last week' },
    { icon: 'tablet',     color: 'text-tertiary',   label: 'Tablet',  val: tabletPct,  barColor: 'bg-tertiary',  trend: 'neutral', trendVal: '' },
  ]

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
      <h3 className="text-on-surface font-bold mb-6 text-title-lg">Device Split</h3>

      <div className="space-y-4 flex-1">
        {devices.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${d.color} text-sm`}>{d.icon}</span>
                <span className="text-sm">{d.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{d.val.toFixed(1)}%</span>
                {d.trendVal && (
                  <p className={`text-[9px] ${d.trend === 'up' ? 'text-emerald-400' : 'text-red-400'} mt-0.5`}>
                    {d.trendVal}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
              <div
                className={`${d.barColor} h-full`}
                style={{ width: `${Math.max(8, Math.min(100, d.val))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}