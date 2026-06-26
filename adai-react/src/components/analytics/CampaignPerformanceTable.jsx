// src/components/analytics/CampaignPerformanceTable.jsx
// Full-width sortable campaign performance table.
// Owns sort state. Uses CAMPAIGNS from analyticsData.

import { useState } from 'react'
import { roasColor, statusColor } from '@/utils/analyticsHelpers'
import { CAMPAIGNS } from '@/data/analyticsData'

function SortIcon({ sortKey, activeKey, activeDir }) {
  if (sortKey !== activeKey)
    return <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>
  return activeDir === 'asc'
    ? <span className="material-symbols-outlined text-[14px] text-primary">arrow_upward</span>
    : <span className="material-symbols-outlined text-[14px] text-primary">arrow_downward</span>
}

export default function CampaignPerformanceTable() {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...CAMPAIGNS].sort((a, b) => {
    if (!sortKey) return 0
    return sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  })

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">campaign</span>
          <h3 className="text-on-surface font-bold text-title-lg">Campaign Performance</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary rounded-full">
            Live
          </span>
        </div>
        <p className="text-xs text-on-surface-variant">Click column headers to sort</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
              <th className="text-left px-5 py-3">Campaign</th>
              <th className="text-left px-5 py-3">Advertiser</th>
              <th className="text-left px-5 py-3">Raw Clicks</th>
              <th className="text-left px-5 py-3">Fraud Filtered</th>
              <th
                className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => handleSort('ctr')}
              >
                <span className="flex items-center gap-1">
                  Effective CTR <SortIcon sortKey="ctr" activeKey={sortKey} activeDir={sortDir} />
                </span>
              </th>
              <th className="text-left px-5 py-3">Spend</th>
              <th
                className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => handleSort('roas')}
              >
                <span className="flex items-center gap-1">
                  ROAS <SortIcon sortKey="roas" activeKey={sortKey} activeDir={sortDir} />
                </span>
              </th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const fraudDelta = c.raw - c.filtered
              return (
                <tr key={c.name} className="border-b border-outline-variant/20 hover:bg-surface-container-high/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-on-surface">{c.name}</td>
                  <td className="px-5 py-4 text-on-surface-variant text-xs">{c.advertiser}</td>
                  <td className="px-5 py-4 font-mono text-xs">{c.raw.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-on-surface">{c.filtered.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-red-400 font-mono">-{fraudDelta.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-primary text-xs">{c.ctr}%</td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{c.spend}</td>
                  <td className={`px-5 py-4 font-mono font-black text-sm ${roasColor(c.roas)}`}>{c.roas}x</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}