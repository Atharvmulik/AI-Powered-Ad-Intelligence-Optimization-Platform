// src/pages/Campaigns.jsx

import { useEffect } from 'react'

import LivePerformanceMonitor  from '@/components/campaigns/LivePerformanceMonitor'
import CampaignIntelligence    from '@/components/campaigns/CampaignIntelligence'
import TopAdsTable             from '@/components/campaigns/TopAdsTable'
import ComplianceReports       from '@/components/campaigns/ComplianceReports'
import FraudDetectionFeed      from '@/components/campaigns/FraudDetectionFeed'
import FraudSummaryPanel       from '@/components/campaigns/FraudSummaryPanel'
import CampaignShapExplainer   from '@/components/campaigns/CampaignShapExplainer'

import { useCampaigns }           from '@/hooks/useCampaigns'

export default function Campaigns() {
  const {
    loading,
    error,
    refetch,
    livePerformance,
    campaigns,
    topAds,
    reports,
    scheduledReports,
    fraudFeed,
    fraudSummary,
    placementAgent,
    shapInsights,
  } = useCampaigns()

  useEffect(() => {
    refetch()
  }, [refetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant font-body-md">Loading campaign data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
        <p className="text-error font-body-md">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-body-md hover:brightness-110 transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-stack-lg">

      {/* Section 1 — Page header */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="font-body-md text-on-surface-variant">
              Real-time spend and performance optimization
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors font-body-md">
            <span className="material-symbols-outlined text-sm">add</span>
            New Campaign
          </button>
        </div>
      </section>

      {/* Section 2 — Live Performance Monitor */}
      <LivePerformanceMonitor livePerformance={livePerformance} />

      {/* Section 3 — Campaign Intelligence cards */}
      <CampaignIntelligence campaigns={campaigns} />

      {/* Section 3B — Top Performing Ads table */}
      <TopAdsTable topAds={topAds} />

      {/* Section 4 — Compliance & Performance Reports */}
      <ComplianceReports reports={reports} scheduledReports={scheduledReports} />

      {/* Section 5 — Fraud Detection Feed + Summary Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <FraudDetectionFeed fraudFeed={fraudFeed} />
        <FraudSummaryPanel fraudSummary={fraudSummary} placementAgent={placementAgent} />
      </section>

      {/* Section 6 — SHAP ML Prediction Insights */}
      <CampaignShapExplainer shapInsights={shapInsights} />

    </div>
  )
}