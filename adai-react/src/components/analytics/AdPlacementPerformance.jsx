// src/components/analytics/AdPlacementPerformance.jsx
// Full-width table — Ad Placement Performance powered by RL Agent.
// Fully static/presentational.

import { AD_PLACEMENTS, MAX_PLACEMENT_CTR } from '@/data/analyticsData'

export default function AdPlacementPerformance() {
  return (
    <div className="col-span-12 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/20">
        <div>
          <h3 className="text-on-surface font-bold text-title-lg">Ad Placement Performance</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">RL Agent Optimization Results</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-primary/15 border border-primary/30 text-primary rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">psychology</span>
          Powered by RL Agent
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
              <th className="text-left px-6 py-4">Placement</th>
              <th className="text-left px-6 py-4">Impressions</th>
              <th className="text-left px-6 py-4">CTR</th>
              <th className="text-left px-6 py-4">Revenue</th>
              <th className="text-left px-6 py-4">Performance</th>
            </tr>
          </thead>
          <tbody>
            {AD_PLACEMENTS.map((placement) => (
              <tr
                key={placement.name}
                className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high/30 ${placement.isBest ? 'bg-primary/5' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">{placement.name}</span>
                    {placement.isBest && (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-full flex items-center gap-1">
                        🏆 Best Performer
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-on-surface">
                  {placement.impressions.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-primary text-xs">{placement.ctr}%</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">
                  ₹{(placement.revenue / 1000).toFixed(0)},{String(placement.revenue % 1000).padStart(3, '0')}
                </td>
                <td className="px-6 py-4 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                        style={{ width: `${(placement.ctr / MAX_PLACEMENT_CTR) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono w-12">
                      {((placement.ctr / MAX_PLACEMENT_CTR) * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer insight */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
        <p className="text-[10px] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
          RL Agent recommends increasing Above the Fold allocation by 15% for optimal ROI
        </p>
      </div>
    </div>
  )
}