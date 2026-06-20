// ============================================================
// src/components/dashboard/TopAdsTable.jsx
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatNumber } from '@/utils/formatters'

export default function TopAdsTable({ tableData = [], onCampaignSelect = () => {} }) {
  const [sortField, setSortField] = useState('ctr')
  const [sortDirection, setSortDirection] = useState('desc')

  const sortedTableData = [...tableData].sort((a, b) => {
    const valA = a[sortField] ?? 0
    const valB = b[sortField] ?? 0
    return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
  })

  const requestSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortIndicator = (field) =>
    sortField === field ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group">
      <div>
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-lg text-title-lg text-on-surface">Top Performing Ads</h3>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
            Sort Enabled
          </span>
        </div>
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant">
                {[
                  { label: 'Campaign', field: 'campaign_name', align: 'left' },
                  { label: 'CTR', field: 'ctr', align: 'right' },
                  { label: 'Clicks', field: 'clicks', align: 'right' },
                  { label: 'Revenue', field: 'revenue', align: 'right' },
                  { label: 'Spend', field: 'spend', align: 'right' },
                  { label: 'ROAS', field: 'roas', align: 'right' },
                  { label: 'Fraud Clicks', field: 'fraud_clicks', align: 'right' },
                ].map(({ label, field, align }) => (
                  <th
                    key={field}
                    onClick={() => requestSort(field)}
                    className={`px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider cursor-pointer hover:text-primary transition-colors ${
                      align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {label}
                    {sortIndicator(field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              <AnimatePresence initial={false}>
                {sortedTableData.map((row) => (
                  <motion.tr
                    layout
                    key={row.campaign_id}
                    className="hover:bg-surface-container-high transition-colors text-xs font-mono font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[13px]">campaign</span>
                        </div>
                        <button
                          onClick={() => onCampaignSelect(row.campaign_id)}
                          className="font-semibold text-on-surface text-left"
                        >
                          {row.campaign_name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-primary">{row.ctr}%</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.clicks)}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant">{formatCurrency(row.spend ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{(row.impressions ? (row.clicks / row.impressions).toFixed(3) : row.ctr) || 0}</td>
                    <td className="px-4 py-3 text-right text-error">{formatNumber(row.fraud_clicks ?? 0)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium flex justify-between">
        <span>Showing top {tableData.length} production active campaigns</span>
        <span>Real-time tracking enabled</span>
      </div>
    </div>
  )
}