import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function TopAdsTable({ tableData }) {
  const [sortField, setSortField] = useState('ctr')
  const [sortDirection, setSortDirection] = useState('desc')

  const sortedTableData = [...tableData].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]
    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  const requestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

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
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('campaign')}>
                  Campaign {sortField === 'campaign' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('ctr')}>
                  CTR {sortField === 'ctr' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('clicks')}>
                  Clicks {sortField === 'clicks' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('revenue')}>
                  Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('spend')}>
                  Spend {sortField === 'spend' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('roas')}>
                  ROAS {sortField === 'roas' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('fraudFiltered')}>
                  Fraud Clicks {sortField === 'fraudFiltered' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              <AnimatePresence initial={false}>
                {sortedTableData.map((row) => (
                  <motion.tr 
                    layout 
                    key={row.campaign}
                    className="hover:bg-surface-container-high transition-colors text-xs font-mono font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[13px]">{row.icon}</span>
                        </div>
                        <span className="font-semibold text-on-surface">{row.campaign}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-primary">{row.ctr}%</td>
                    <td className="px-4 py-3 text-right">{(row.clicks / 1000).toFixed(1)}k</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant">{formatCurrency(row.spend)}</td>
                    <td className="px-4 py-3 text-right text-tertiary">{row.roas}x</td>
                    <td className="px-4 py-3 text-right text-error">{formatNumber(row.fraudFiltered)}</td>
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
