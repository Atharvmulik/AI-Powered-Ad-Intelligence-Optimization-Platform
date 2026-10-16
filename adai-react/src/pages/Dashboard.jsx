// ============================================================
// src/pages/Dashboard.jsx
// ============================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
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
    aiAdDecision,
    modelIntelligence,
    campaignOpportunities,
    aiAdDecisionError,
    modelIntelligenceError,
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
  const clicksPerSecond = Number.isFinite(kpi?.clicks_per_second)
    ? Number(kpi.clicks_per_second.toFixed(0))
    : 0

  return (
    <div className="space-y-stack-lg max-w-full overflow-hidden">

      {/* ======================================================
          KPI CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-lg">
        <KpiCard
          label="Clicks / Sec"
          value={formatNumber(clicksPerSecond)}
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
          AI DECISION + MODEL INTELLIGENCE + OPPORTUNITY RADAR
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

        <ShapExplainer
          aiAdDecision={aiAdDecision}
          loading={loading}
          error={aiAdDecisionError}
        />

        <InfraStatus
          modelIntelligence={modelIntelligence}
          loading={loading}
          error={modelIntelligenceError}
        />

        <div className="lg:col-span-4">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">Campaign Watch</p>
                <h3 className="font-title-lg text-title-lg text-on-surface mt-1">Campaign Opportunity Radar</h3>
              </div>
              <span className="px-2 py-1 rounded-full border border-primary/20 bg-primary/10 text-[9px] font-mono font-bold uppercase text-primary">
                LIVE
              </span>
            </div>

            {(campaignOpportunities ?? []).length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-low/30 p-6">
                <div>
                  <span className="material-symbols-outlined text-primary text-3xl">radar</span>
                  <p className="mt-3 text-xs font-mono text-on-surface-variant">No recent intelligence available</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                {(campaignOpportunities ?? []).slice(0, 5).map((opportunity, index) => {
                  const priorityTone = {
                    HIGH: 'border-red-400/30 bg-red-500/10 text-red-300',
                    MEDIUM: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
                    LOW: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
                  }[String(opportunity.priority ?? 'MEDIUM').toUpperCase()] ?? 'border-outline-variant bg-surface-container-low text-on-surface-variant'

                  const statusTone = {
                    SCALE: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
                    OPTIMIZE: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
                    MONITOR: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
                    REDUCE: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
                    PAUSE: 'border-red-400/30 bg-red-500/10 text-red-300',
                  }[String(opportunity.status ?? 'MONITOR').toUpperCase()] ?? 'border-outline-variant bg-surface-container-low text-on-surface-variant'

                  return (
                    <motion.div
                      key={opportunity.campaign_id ?? opportunity.id ?? index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="rounded-xl border border-outline-variant/50 bg-surface-container-low/30 p-3 hover:border-primary/30 hover:bg-surface-container-low/60 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-on-surface-variant">{String(opportunity.priority ?? 'MEDIUM').toUpperCase()}</p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">{opportunity.campaign_name || 'Campaign'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full border text-[8px] font-mono font-bold uppercase ${priorityTone}`}>
                          {String(opportunity.priority ?? 'MEDIUM').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full border text-[8px] font-mono font-bold uppercase ${statusTone}`}>
                          {String(opportunity.status ?? 'MONITOR').toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono text-on-surface-variant">
                          {opportunity.campaign_id || opportunity.id || '—'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-on-surface-variant">
                        <div>
                          <p>CTR</p>
                          <p className="mt-1 text-sm font-bold text-on-surface">{opportunity.ctr != null ? `${Number(opportunity.ctr).toFixed(2)}%` : '—'}</p>
                        </div>
                        <div>
                          <p>CVR</p>
                          <p className="mt-1 text-sm font-bold text-on-surface">{opportunity.conversion_rate != null ? `${Number(opportunity.conversion_rate).toFixed(2)}%` : '—'}</p>
                        </div>
                        <div>
                          <p>FRAUD</p>
                          <p className="mt-1 text-sm font-bold text-on-surface">{opportunity.fraud_rate != null ? `${Number(opportunity.fraud_rate).toFixed(2)}%` : '—'}</p>
                        </div>
                        <div>
                          <p>ROAS</p>
                          <p className="mt-1 text-sm font-bold text-on-surface">{opportunity.roas != null ? `${Number(opportunity.roas).toFixed(2)}x` : '—'}</p>
                        </div>
                      </div>

                      {opportunity.reason && (
                        <p className="mt-3 text-xs text-on-surface-variant leading-5">“{opportunity.reason}”</p>
                      )}

                      {opportunity.recommended_action && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-primary">
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          <span>{opportunity.recommended_action}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}