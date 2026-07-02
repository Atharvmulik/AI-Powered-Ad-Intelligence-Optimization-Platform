// src/pages/AIInsights.jsx
// Orchestrator — owns cross-component selection state (selectedPrediction,
// viewMode) and the campaign-lookup id, and derives the SHAP feature subset
// for the selected prediction's campaign. All data comes from useAIInsight
// (REST) and useAIInsightWebSocket (live feed); no mock data anywhere.

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAIInsight } from '@/hooks/useAIInsight'
import { useAIInsightWebSocket } from '@/hooks/useAIInsightWebSocket'

import LiveMetricsStrip          from '@/components/aiinsights/LiveMetricsStrip'
import ModelStatusCards          from '@/components/aiinsights/ModelStatusCards'
import ShapExplainerPanel        from '@/components/aiinsights/ShapExplainerPanel'
import PredictionStreamFeed, { predictionKey } from '@/components/aiinsights/PredictionStreamFeed'
import RecommendationExplanation from '@/components/aiinsights/RecommendationExplanation'
import PerAdIntelligence         from '@/components/aiinsights/PerAdIntelligence'
import AudienceSegmentCards      from '@/components/aiinsights/AudienceSegmentCards'
import { useExpandableItems }    from '@/components/aiinsights/useExpandableItems'
import { getInfraStatusColor }   from '@/utils/aiInsightsHelpers'

function InfrastructureStrip({ services }) {
  const { expanded, visibleItems, toggleExpanded } = useExpandableItems(services, 4)

  if (!services || services.length === 0) return null

  const hasMoreServices = services.length > 4

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((svc) => (
            <motion.div
              key={svc.service_name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-container-low border border-outline-variant rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-on-surface truncate">{svc.service_name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${getInfraStatusColor(svc.status)}`}>
                  {svc.status}
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant font-mono">
                {svc.latency.toFixed(0)}ms · {svc.uptime.toFixed(1)}% uptime
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMoreServices && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-xs font-mono text-primary hover:text-primary/80"
          >
            {expanded ? 'View Less' : 'View More'}
          </button>
        </div>
      )}
    </section>
  )
}

export default function AIInsights() {
  // ── Cross-component selection state ────────────────────────────────────────
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const [viewMode, setViewMode] = useState('business') // 'business' | 'ml'
  const [campaignId, setCampaignId] = useState(null)

  const {
    overview,
    modelStatus,
    predictions,
    shap,
    recommendations,
    audienceSegments,
    infrastructure,
    campaignInsight,
    loading,
    error,
    refresh,
  } = useAIInsight({ campaignId })

  const { liveData, connected } = useAIInsightWebSocket()

  const handlePredictionSelect = (prediction) => {
    setSelectedPrediction(prediction)
    setViewMode('business')
  }

  const selectedKey = selectedPrediction ? predictionKey(selectedPrediction) : null

  const selectedShapFeatures = useMemo(() => {
    if (!selectedPrediction || !shap?.features) return []
    return shap.features.filter((f) => f.campaign_name === selectedPrediction.campaign_name)
  }, [selectedPrediction, shap])

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading && !overview) {
    return (
      <div className="space-y-gutter animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-container-low border border-outline-variant rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-surface-container-low border border-outline-variant rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-surface-container-low border border-outline-variant rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="text-title-md text-on-surface font-semibold">Couldn't load AI Insight data</p>
        <p className="text-body-md text-on-surface-variant max-w-md">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-mono hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-gutter relative">
      {/* Section 1 — Live KPI strip */}
      <LiveMetricsStrip overview={overview} liveData={liveData} connected={connected} />

      {/* Section 2 — Model status cards */}
      <ModelStatusCards modelStatus={modelStatus} />

      {/* Section 3 — Infrastructure health */}
      <InfrastructureStrip services={infrastructure?.services} />

      {/* Section 4 — SHAP Explainer (left) + Prediction Feed (right) */}
      <div className="grid grid-cols-12 gap-gutter">
        <ShapExplainerPanel
          selectedPrediction={selectedPrediction}
          shapFeatures={selectedShapFeatures}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <PredictionStreamFeed
          predictions={predictions?.predictions}
          onSelect={handlePredictionSelect}
          selectedKey={selectedKey}
        />
      </div>

      {/* Section 5 — Recommendation Explanations */}
      <div className="grid grid-cols-12 gap-gutter">
        <RecommendationExplanation recommendations={recommendations?.recommendations} />
      </div>

      {/* Section 6 — Audience Segments */}
      <div className="grid grid-cols-12 gap-gutter">
        <AudienceSegmentCards segments={audienceSegments?.segments} />
      </div>

      {/* Section 7 — Per-Prediction Intelligence + campaign deep-dive */}
      <PerAdIntelligence
        predictions={predictions?.predictions}
        shapFeatures={shap?.features}
        campaignInsight={campaignInsight}
        campaignInsightLoading={loading && campaignId !== null}
        onLookupCampaign={(id) => setCampaignId(id)}
      />
    </div>
  )
}