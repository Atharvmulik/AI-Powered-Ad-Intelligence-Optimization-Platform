// ============================================================
// src/components/dashboard/CampaignAnalytics.jsx
// ============================================================

import { formatCurrency, formatNumber } from '@/utils/formatters'

const formatMetricPercentage = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)}%` : 'Unavailable'

export default function CampaignAnalytics({ analytics = null }) {
  const metrics = analytics
    ? [
        { label: 'Impressions', value: formatNumber(analytics.impressions ?? 0) },
        { label: 'Raw Clicks', value: formatNumber(analytics.raw_clicks ?? 0) },
        { label: 'Legit Clicks', value: formatNumber(analytics.legit_clicks ?? 0) },
        { label: 'Effective CTR', value: formatMetricPercentage(analytics.effective_ctr) },
        { label: 'Conversions', value: formatNumber(analytics.conversions ?? 0) },
        { label: 'Conversion Rate', value: formatMetricPercentage(analytics.conversion_rate) },
        { label: 'Revenue', value: formatCurrency(analytics.revenue ?? 0) },
        { label: 'Fraud Rate', value: formatMetricPercentage(analytics.fraud_rate) },
      ]
    : []

  return (
    <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">analytics</span>
          <h3 className="font-title-lg text-title-lg text-on-surface">Campaign Analytics</h3>
        </div>
        <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-high px-2 py-1 rounded border border-outline-variant">
          Last 15 Min
        </span>
      </div>
      <div className="flex-1">
        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.map(({ label, value }) => (
              <div key={label} className="bg-surface-container-high border border-outline-variant rounded-lg p-4">
                <div className="text-on-surface-variant text-xs uppercase tracking-[0.12em] mb-2">{label}</div>
                <div className="font-bold text-xl text-on-surface">{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="min-h-48 flex items-center justify-center text-center text-on-surface-variant">
            Unable to load campaign analytics
          </div>
        )}
      </div>
      {analytics && (
        <div className="mt-4 pt-3 border-t border-outline-variant/30 text-[10px] text-on-surface-variant font-mono">
          Metrics calculated from synthetic traffic generated during the last 15 minutes.
        </div>
      )}
    </div>
  )
}