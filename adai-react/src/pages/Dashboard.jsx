// ============================================================
// src/pages/Dashboard.jsx
// ============================================================

import { useState } from 'react'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { useDashboard } from '@/hooks/useDashboard'

// Common & Dashboard sub-components
import KpiCard from '@/components/common/KpiCard'
import CtrTrendChart from '@/components/dashboard/CtrTrendChart'
import FraudAlertCenter from '@/components/dashboard/FraudAlertCenter'
import ShapExplainer from '@/components/dashboard/ShapExplainer'
import TerminalLogs from '@/components/dashboard/TerminalLogs'
import GeoTrafficMap from '@/components/dashboard/GeoTrafficMap'
import TopAdsTable from '@/components/dashboard/TopAdsTable'
import CampaignAnalytics from '@/components/dashboard/CampaignAnalytics'
import InfraStatus from '@/components/dashboard/InfraStatus'

export default function Dashboard() {
  const {
    overview,
    executiveSummary,
    ctrTrend,
    campaignAnalytics,
    topAds,
    geoTraffic,
    fraudAlerts,
    infraStatus,
    recommendations,
    loading,
    error,
    refreshDashboard,
  } = useDashboard()

  const [selectedCampaignId, setSelectedCampaignId] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-on-surface-variant font-mono text-sm animate-pulse">
        Loading dashboard data...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
        <p className="text-error font-mono text-sm">{error}</p>
        <button
          onClick={refreshDashboard}
          className="px-4 py-2 text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const kpi = overview ?? null

  return (
    <div className="space-y-stack-lg max-w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-lg">
        <KpiCard label="Total Clicks" value={formatNumber(kpi?.total_clicks ?? 0)} />
        <KpiCard label="CTR" value={`${kpi?.ctr ?? 0}%`} />
        <KpiCard label="Active Users" value={formatNumber(kpi?.active_users ?? 0)} />
        <KpiCard
          label="Fraud Score"
          value={kpi?.fraud_score != null && kpi.fraud_score <= 30 ? 'LOW RISK' : 'ELEVATED'}
        />
        <KpiCard label="Revenue" value={formatCurrency(kpi?.revenue ?? 0)} />
        <KpiCard label="Events/sec" value={formatNumber(kpi?.events_per_second ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6">
          <h3 className="font-title-lg text-title-lg">AI Executive Summary</h3>
          <div className="mt-3">
            {(executiveSummary?.insights ?? []).map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-medium">{item.text}</div>
                <div className="text-xs text-on-surface-variant">{item.trend}</div>
              </div>
            ))}
            <div className="text-[11px] text-on-surface-variant mt-3">{executiveSummary?.insight_text}</div>
          </div>
        </div>

        <CtrTrendChart ctrHistory={ctrTrend?.ctr_values ?? []} ctrTimestamps={ctrTrend?.timestamps ?? []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <CampaignAnalytics analytics={campaignAnalytics} />

        <TopAdsTable tableData={topAds} onCampaignSelect={(id) => setSelectedCampaignId(id)} />

        <GeoTrafficMap geoTraffic={geoTraffic} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <TerminalLogs />

        <FraudAlertCenter fraudAlerts={fraudAlerts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <ShapExplainer topAds={topAds} selectedCampaignId={selectedCampaignId} />

        <InfraStatus infraStatus={infraStatus} />

        <div className="lg:col-span-4">
          {(recommendations ?? []).map((card, i) => (
            <div key={i} className="p-3 border rounded mb-2">
              <div className="font-bold">{card.title}</div>
              <div className="text-xs">{card.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}