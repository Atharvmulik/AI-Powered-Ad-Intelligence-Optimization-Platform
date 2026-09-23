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
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)

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
        <span className="material-symbols-outlined text-error text-4xl">
          error
        </span>

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

      {/* ======================================================
          KPI CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-lg">
        <KpiCard
          label="Total Clicks"
          value={formatNumber(kpi?.total_clicks ?? 0)}
        />

        <KpiCard
          label="CTR"
          value={`${kpi?.ctr ?? 0}%`}
        />

        <KpiCard
          label="Active Users"
          value={formatNumber(kpi?.active_users ?? 0)}
        />

        <KpiCard
          label="Fraud Score"
          value={
            kpi?.fraud_score != null && kpi.fraud_score <= 30
              ? 'LOW RISK'
              : 'ELEVATED'
          }
        />

        <KpiCard
          label="Revenue"
          value={formatCurrency(kpi?.revenue ?? 0)}
        />

        <KpiCard
          label="Events/sec"
          value={formatNumber(kpi?.events_per_second ?? 0)}
        />
      </div>

      {/* ======================================================
          AI EXECUTIVE SUMMARY + CTR TREND
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

        {/* ====================================================
            AI EXECUTIVE SUMMARY
        ==================================================== */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 relative overflow-hidden">

          {/* Subtle decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  auto_awesome
                </span>

                <h3 className="font-title-lg text-title-lg text-on-surface">
                  AI Executive Summary
                </h3>
              </div>

              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider mt-1">
                AI-powered platform intelligence
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-primary uppercase">
                Insights
              </span>
            </div>
          </div>

          {/* Insight cards */}
          <div className="relative mt-5 space-y-2.5">

            {(executiveSummary?.insights ?? []).length > 0 ? (
              (executiveSummary?.insights ?? []).map((item, idx) => {

                const status = item.status ?? 'neutral'

                const statusConfig = {
                  up: {
                    icon: 'trending_up',
                    label: 'Improving',
                    className:
                      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                  },
                  down: {
                    icon: 'trending_down',
                    label: 'Declining',
                    className:
                      'text-red-400 bg-red-400/10 border-red-400/20',
                  },
                  neutral: {
                    icon: 'trending_flat',
                    label: 'Stable',
                    className:
                      'text-on-surface-variant bg-on-surface/5 border-outline-variant/40',
                  },
                }

                const config = statusConfig[status] ?? statusConfig.neutral

                return (
                  <div
                    key={idx}
                    className="group rounded-lg border border-outline-variant/60 bg-surface-container-low/40 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-surface-container-low/70 hover:-translate-y-[1px]"
                  >
                    <div className="flex items-start gap-3">

                      {/* Status icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${config.className}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {config.icon}
                        </span>
                      </div>

                      {/* Insight content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-on-surface leading-5">
                            {item.text}
                          </p>

                          {item.trend && (
                            <span
                              className={`flex-shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${config.className}`}
                            >
                              {item.trend}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">
                            {config.label}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low/40 p-4 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                  analytics
                </span>

                <p className="text-xs text-on-surface-variant font-mono mt-2">
                  No AI insights available
                </p>
              </div>
            )}
          </div>

          {/* AI Analysis expandable section */}
          {executiveSummary?.insight_text && (
            <div className="relative mt-4 border-t border-outline-variant/50 pt-3">

              <button
                type="button"
                onClick={() => setShowAiAnalysis((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    psychology
                  </span>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface">
                    AI Analysis
                  </span>
                </div>

                <span
                  className={`material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200 ${
                    showAiAnalysis ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {showAiAnalysis && (
                <div className="mt-3 rounded-lg bg-surface-container-low/50 border border-outline-variant/40 p-3 animate-in fade-in duration-200">
                  <p className="text-[11px] leading-5 text-on-surface-variant">
                    {executiveSummary.insight_text}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            CTR TREND
            UNCHANGED
        ==================================================== */}
        <CtrTrendChart
          ctrHistory={ctrTrend?.ctr_values ?? []}
          ctrTimestamps={ctrTrend?.timestamps ?? []}
        />

      </div>

      {/* ======================================================
          CAMPAIGN ANALYTICS
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

        <CampaignAnalytics analytics={campaignAnalytics} />

        <TopAdsTable
          tableData={topAds}
          onCampaignSelect={(id) => setSelectedCampaignId(id)}
        />

        <GeoTrafficMap geoTraffic={geoTraffic} />

      </div>

      {/* ======================================================
          TERMINAL + FRAUD
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

        <TerminalLogs />

        <FraudAlertCenter fraudAlerts={fraudAlerts} />

      </div>

      {/* ======================================================
          SHAP + INFRA + RECOMMENDATIONS
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

        <ShapExplainer
          topAds={topAds}
          selectedCampaignId={selectedCampaignId}
        />

        <InfraStatus infraStatus={infraStatus} />

        <div className="lg:col-span-4">
          {(recommendations ?? []).map((card, i) => (
            <div
              key={i}
              className="p-3 border rounded mb-2"
            >
              <div className="font-bold">
                {card.title}
              </div>

              <div className="text-xs">
                {card.description}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}