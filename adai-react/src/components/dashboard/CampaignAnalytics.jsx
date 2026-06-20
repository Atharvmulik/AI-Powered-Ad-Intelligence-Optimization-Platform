// ============================================================
// src/components/dashboard/CampaignAnalytics.jsx
// ============================================================

import { formatCurrency, formatNumber } from '@/utils/formatters'

export default function CampaignAnalytics({ analytics = null }) {
  return (
    <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">analytics</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">Campaign Analytics</h3>
        </div>
      </div>
      <div className="space-y-4 flex-1">
        {analytics ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4">
              <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">Raw Clicks</div>
              <div className="font-bold text-xl">{formatNumber(analytics.raw_clicks)}</div>
            </div>
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4">
              <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">Fraud Filtered Clicks</div>
              <div className="font-bold text-xl">{formatNumber(analytics.fraud_filtered_clicks)}</div>
            </div>
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4">
              <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">Effective CTR</div>
              <div className="font-bold text-xl">{analytics.effective_ctr.toFixed(2)}%</div>
            </div>
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4">
              <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">Conversions</div>
              <div className="font-bold text-xl">{formatNumber(analytics.conversions)}</div>
            </div>
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4">
              <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">Revenue</div>
              <div className="font-bold text-xl">{formatCurrency(analytics.revenue)}</div>
            </div>
          </div>
        ) : (
          <div className="text-on-surface-variant">Unable to load campaign analytics</div>
        )}
      </div>
    </div>
  )
}