// src/components/aiinsights/PerAdIntelligence.jsx
// Expandable per-prediction intelligence table (predictions joined with
// their campaign's SHAP features) plus a single-campaign deep-dive lookup
// backed by GET /api/v1/aiinsight/campaign/{campaign_id}.
//
// Props:
//   predictions      — PredictionItem[]
//   shapFeatures      — ShapFeatureItem[] (all campaigns)
//   campaignInsight   — CampaignInsightResponse | null
//   campaignInsightLoading — boolean
//   onLookupCampaign  — (campaignId: string) => void

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useExpandableItems } from '@/components/aiinsights/useExpandableItems'
import {
  getClickProbColor,
  getFraudRiskColor,
  getFraudRiskLabel,
  humanizeFeatureName,
  isShapPositive,
} from '@/utils/aiInsightsHelpers'

function MiniShapChart({ shapFeatures }) {
  if (!shapFeatures || shapFeatures.length === 0)
    return <p className="text-[11px] text-on-surface-variant italic">No SHAP features for this campaign.</p>

  return (
    <div className="space-y-2">
      {shapFeatures.map((feature) => (
        <div key={feature.feature_name} className="flex items-center">
          <div className="w-32 text-[10px] font-mono text-on-surface-variant truncate">
            {humanizeFeatureName(feature.feature_name)}
          </div>
          <div className="flex-1 h-4 bg-surface-container-lowest rounded overflow-hidden">
            <div
              className={`h-full ${isShapPositive(feature.shap_value) ? 'bg-primary' : 'bg-error'}`}
              style={{
                width: `${Math.min(Math.abs(feature.shap_value) * 100, 100)}%`,
                marginLeft: !isShapPositive(feature.shap_value) ? 'auto' : '0',
              }}
            />
          </div>
          <div className={`w-12 text-right text-[10px] font-mono ml-2 ${isShapPositive(feature.shap_value) ? 'text-primary' : 'text-error'}`}>
            {isShapPositive(feature.shap_value) ? '+' : ''}
            {feature.shap_value.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}

function PredictionRow({ prediction, campaignShap, expanded, onToggle }) {
  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden">
      <div className="p-4 bg-surface-container-lowest hover:bg-surface-container-high transition-colors">
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 md:col-span-2">
            <p className="font-semibold text-on-surface">{prediction.ad_id}</p>
            <p className="text-xs text-on-surface-variant">{prediction.campaign_name ?? 'Unattributed'}</p>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getClickProbColor(prediction.click_probability)}`}>
              {(prediction.click_probability * 100).toFixed(0)}% click prob
            </span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getFraudRiskColor(prediction.fraud_probability)}`}>
              {getFraudRiskLabel(prediction.fraud_probability)} risk
            </span>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="text-xs font-mono text-on-surface-variant truncate">
              {prediction.model_version} · {prediction.inference_latency_ms.toFixed(1)}ms · rec {prediction.recommendation_score.toFixed(2)}
            </p>
          </div>
          <div className="col-span-12 md:col-span-2">
            <button
              onClick={onToggle}
              className="w-full text-xs text-primary hover:text-primary/80 font-mono flex items-center justify-center gap-1"
            >
              {expanded ? 'Hide SHAP' : 'View SHAP'}
              <span className="material-symbols-outlined text-sm">{expanded ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-outline-variant/30 p-4 bg-surface-container-high">
          <p className="text-xs font-mono text-primary mb-3">Feature impact for this campaign</p>
          <MiniShapChart shapFeatures={campaignShap} />
        </div>
      )}
    </div>
  )
}

function CampaignDeepDive({ campaignInsight, loading, onLookupCampaign }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) onLookupCampaign(input.trim())
  }

  return (
    <div className="mt-8 pt-6 border-t border-outline-variant/30">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h4 className="text-title-md font-semibold text-on-surface">Campaign deep-dive</h4>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Campaign ID"
            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-mono text-on-surface w-32"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-mono hover:opacity-90"
          >
            Look up
          </button>
        </form>
      </div>

      {loading && <p className="text-sm text-on-surface-variant">Loading campaign insight…</p>}

      {!loading && campaignInsight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-mono text-primary mb-3">Top SHAP features — {campaignInsight.campaign_name}</p>
            <MiniShapChart shapFeatures={campaignInsight.top_shap_features} />
          </div>
          <div className="space-y-2 text-xs font-mono text-on-surface-variant">
            <div className="flex justify-between"><span>Budget</span><span className="text-on-surface">${campaignInsight.budget.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Spend</span><span className="text-on-surface">${campaignInsight.spend.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Revenue</span><span className="text-on-surface">${campaignInsight.revenue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>CTR</span><span className="text-on-surface">{campaignInsight.ctr.toFixed(2)}%</span></div>
            <div className="flex justify-between"><span>ROAS</span><span className="text-on-surface">{campaignInsight.roas.toFixed(2)}x</span></div>
            {campaignInsight.click_probability !== null && (
              <div className="flex justify-between"><span>Click probability</span><span className="text-on-surface">{(campaignInsight.click_probability * 100).toFixed(0)}%</span></div>
            )}
            {campaignInsight.fraud_probability !== null && (
              <div className="flex justify-between"><span>Fraud probability</span><span className="text-on-surface">{(campaignInsight.fraud_probability * 100).toFixed(0)}%</span></div>
            )}
            {campaignInsight.recommendation_explanation && (
              <p className="text-on-surface-variant pt-2 border-t border-outline-variant/30 mt-2">
                {campaignInsight.recommendation_explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PerAdIntelligence({ predictions, shapFeatures, campaignInsight, campaignInsightLoading, onLookupCampaign }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const { expanded, visibleItems, toggleExpanded } = useExpandableItems(predictions, 5)

  const toggleRow = (key) => setExpandedKey((prev) => (prev === key ? null : key))

  const shapByCampaign = (campaignName) =>
    (shapFeatures ?? []).filter((f) => f.campaign_name === campaignName)

  const hasMorePredictions = (predictions?.length ?? 0) > 5

  return (
    <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg col-span-12">
      <div className="mb-6">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Per-Ad Intelligence</h3>
        <p className="text-body-md text-on-surface-variant">ML scores and explainability for individual predictions</p>
      </div>

      {(!predictions || predictions.length === 0) ? (
        <p className="text-body-md text-on-surface-variant text-center py-8">No predictions logged yet.</p>
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((prediction) => {
                const key = `${prediction.ad_id}-${prediction.timestamp}`
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PredictionRow
                      prediction={prediction}
                      campaignShap={shapByCampaign(prediction.campaign_name)}
                      expanded={expandedKey === key}
                      onToggle={() => toggleRow(key)}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {hasMorePredictions && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={toggleExpanded}
                className="text-xs font-mono text-primary hover:text-primary/80"
              >
                {expanded ? 'View Less' : 'View More'}
              </button>
            </div>
          )}
        </>
      )}

      <CampaignDeepDive
        campaignInsight={campaignInsight}
        loading={campaignInsightLoading}
        onLookupCampaign={onLookupCampaign}
      />
    </section>
  )
}