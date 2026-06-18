import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function CampaignAnalytics({
  rawClicks,
  fraudFilteredTotal,
  conversionsTotal,
  revenueTotal,
}) {
  return (
    <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">analytics</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">Campaign Analytics</h3>
        </div>
        <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-mono text-green-400 font-bold uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Streaming
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {/* Raw Clicks */}
        <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Raw Clicks</span>
            <p className="text-lg font-black mt-0.5 font-mono">{formatNumber(rawClicks)}</p>
          </div>
          <div className="text-right">
            <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+12.4%
            </span>
            <span className="text-[9px] text-on-surface-variant font-mono block">In last hour</span>
          </div>
        </div>

        {/* Fraud Filtered Clicks */}
        <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Fraud Filtered Clicks</span>
            <p className="text-lg font-black text-[#ffb783] mt-0.5 font-mono">{formatNumber(fraudFilteredTotal)}</p>
          </div>
          <div className="text-right">
            <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_down</span>-18.2%
            </span>
            <span className="text-[9px] text-on-surface-variant font-mono block">Active mitigation</span>
          </div>
        </div>

        {/* Effective CTR */}
        <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Effective CTR</span>
            <p className="text-lg font-black text-primary mt-0.5 font-mono">{((rawClicks / (rawClicks + 1400000)) * 100).toFixed(2)}%</p>
          </div>
          <div className="text-right">
            <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+1.8%
            </span>
            <span className="text-[9px] text-on-surface-variant font-mono block">Optimal performance</span>
          </div>
        </div>

        {/* Conversions & Revenue Combined */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider block">Conversions</span>
            <span className="text-base font-black font-mono mt-0.5 block">{formatNumber(conversionsTotal)}</span>
          </div>
          <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider block">Est. Revenue</span>
            <span className="text-base font-black text-green-400 font-mono mt-0.5 block">{formatCurrency(revenueTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
