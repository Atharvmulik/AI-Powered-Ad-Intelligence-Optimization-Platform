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
    if (sortField === 'campaign_name') {
      const valueA = String(a.campaign_name ?? '')
      const valueB = String(b.campaign_name ?? '')
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    }

    const valueA = Number(a[sortField] ?? 0)
    const valueB = Number(b[sortField] ?? 0)
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
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

  const tableColumns = [
    { label: 'Campaign', field: 'campaign_name', align: 'left' },
    { label: 'CTR', field: 'ctr', align: 'right' },
    { label: 'Clicks', field: 'clicks', align: 'right' },
    { label: 'Revenue', field: 'revenue', align: 'right' },
    { label: 'Spend', field: 'spend', align: 'right' },
    { label: 'ROAS', field: 'roas', align: 'right' },
    { label: 'Fraud Clicks', field: 'fraud_clicks', align: 'right' },
  ]

  return (
    <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group">
      <div>
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between gap-3">
          <h3 className="font-title-lg text-title-lg text-on-surface">Top Performing Ads</h3>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant tracking-[0.12em]">
            LAST 15 MIN
          </span>
        </div>

        <div className="overflow-x-auto w-full max-w-full">
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-surface-container-high scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead className="sticky top-0 z-10 bg-surface-container/95 backdrop-blur-sm">
                <tr className="border-b border-outline-variant">
                  {tableColumns.map(({ label, field, align }) => (
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
                {sortedTableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-on-surface-variant font-mono">
                      No campaign activity in the last 15 minutes.
                    </td>
                  </tr>
                ) : (
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
                              type="button"
                              onClick={() => onCampaignSelect(row.campaign_id)}
                              className="font-semibold text-on-surface text-left hover:text-primary transition-colors"
                            >
                              {row.campaign_name}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-primary">{Number(row.ctr ?? 0).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right">{formatNumber(row.clicks ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-green-400">{formatCurrency(row.revenue ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-on-surface-variant">{formatCurrency(row.spend ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-tertiary">{Number(row.roas ?? 0).toFixed(2)}x</td>
                        <td className="px-4 py-3 text-right text-error">{formatNumber(row.fraud_clicks ?? 0)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium flex justify-between gap-2">
        <span>
          Showing {tableData.length} {tableData.length === 1 ? 'campaign' : 'campaigns'} • Last 15 min
        </span>
      </div>
    </div>
  )
}