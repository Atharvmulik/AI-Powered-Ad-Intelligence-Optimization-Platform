// src/components/analytics/LiveCTRPanel.jsx
// Bento row 1 (left 8/12 cols) — Live CTR trend chart card.
// Props: ctrPoints (array), currentCTR (number)

import LiveCTRChart from './LiveCTRChart'

export default function LiveCTRPanel({ ctrPoints, currentCTR }) {
  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-on-surface font-bold text-title-lg">Live CTR Trend</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary rounded-full">
              LIVE
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Rolling 20-point click-through rate window
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary leading-none">{currentCTR.toFixed(2)}%</p>
          <p className="text-xs text-on-surface-variant mt-1">CTR</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" />
          CTR
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#555577" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
          Target 2.5%
        </div>
      </div>

      <div className="h-52">
        <LiveCTRChart dataPoints={ctrPoints} />
      </div>
    </div>
  )
}