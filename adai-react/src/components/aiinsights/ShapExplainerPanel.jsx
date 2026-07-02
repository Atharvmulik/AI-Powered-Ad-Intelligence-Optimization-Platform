// src/components/aiinsights/ShapExplainerPanel.jsx
// Left 8/12 col — SHAP feature breakdown for the selected prediction.
// Props:
//   selectedPrediction — PredictionItem or null
//   shapFeatures       — ShapFeatureItem[] for the selected prediction's
//                        campaign (matched by campaign_name in the page)
//   viewMode           — 'business' | 'ml'
//   onViewModeChange   — (mode) => void

import { getImpactLevel, humanizeFeatureName, isFraudPrediction, isShapPositive } from '@/utils/aiInsightsHelpers'

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">ads_click</span>
      <h4 className="text-title-md text-on-surface font-semibold mb-2">Select a prediction to inspect</h4>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        Click any event in the prediction feed to see the SHAP feature attribution behind that score
      </p>
    </div>
  )
}

function NoShapDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">query_stats</span>
      <h4 className="text-title-md text-on-surface font-semibold mb-2">No SHAP data for this campaign yet</h4>
      <p className="text-body-md text-on-surface-variant max-w-md">
        Feature attributions will appear here once the SHAP pipeline logs values for this campaign.
      </p>
    </div>
  )
}

function FraudBreakdown({ prediction, shapFeatures }) {
  const topFeatures = [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).slice(0, 3)

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-label-md font-mono text-error mb-3">🚨 Top Contributing Signals</h4>
        <div className="space-y-3">
          {topFeatures.map((feature) => {
            const impact = getImpactLevel(feature.shap_value)
            const chipClass =
              impact.label === 'HIGH' ? 'bg-red-500/20 text-red-500'
              : impact.label === 'MEDIUM' ? 'bg-orange-500/20 text-orange-500'
              : 'bg-yellow-500/20 text-yellow-500'
            const barColor =
              impact.label === 'HIGH' ? 'bg-red-500' : impact.label === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-500'
            return (
              <div key={feature.feature_name} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface font-medium">{humanizeFeatureName(feature.feature_name)}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${chipClass}`}>{impact.label}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(Math.abs(feature.shap_value) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-xs text-red-500 font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">block</span>
          Fraud probability {(prediction.fraud_probability * 100).toFixed(0)}% · Flagged for review by{' '}
          {prediction.model_version}
        </p>
      </div>
    </div>
  )
}

function BusinessView({ shapFeatures }) {
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {shapFeatures.map((feature) => {
        const impact = getImpactLevel(feature.shap_value)
        const positive = isShapPositive(feature.shap_value)
        const cardClass = positive
          ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
        const iconColor = positive ? 'text-green-500' : 'text-red-500'
        const icon = positive ? 'check_circle' : 'cancel'
        return (
          <div key={feature.feature_name} className={`p-4 rounded-lg border transition-all ${cardClass}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${iconColor}`}>{icon}</span>
                <span className="font-semibold text-on-surface">{humanizeFeatureName(feature.feature_name)}</span>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${impact.color}`}>{impact.label}</span>
            </div>
            <p className="text-xs text-on-surface-variant ml-7">
              Predicted CTR {feature.predicted_ctr.toFixed(1)}% · AUC {feature.auc_score.toFixed(2)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function MlView({ shapFeatures }) {
  const maxAbs = Math.max(...shapFeatures.map((f) => Math.abs(f.shap_value)), 0.0001)
  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {shapFeatures.map((feature) => {
        const positive = isShapPositive(feature.shap_value)
        const widthPct = Math.min((Math.abs(feature.shap_value) / maxAbs) * 100, 100)
        return (
          <div key={feature.feature_name} className="flex items-center group">
            <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">
              {feature.feature_name}
            </div>
            <div className="flex-1 h-8 flex items-center relative">
              <div className="absolute left-1/2 w-px h-full bg-outline-variant z-10" />
              {positive ? (
                <div
                  className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container absolute"
                  style={{ left: '50%', width: `${widthPct}%` }}
                />
              ) : (
                <div
                  className="h-full bg-error rounded-l-sm transition-all group-hover:bg-red-400 absolute"
                  style={{ right: '50%', width: `${widthPct}%` }}
                />
              )}
            </div>
            <div className={`w-16 text-right font-mono text-label-md ml-4 ${positive ? 'text-primary' : 'text-error'}`}>
              {positive ? '+' : '-'}{Math.abs(feature.shap_value).toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ShapExplainerPanel({ selectedPrediction, shapFeatures, viewMode, onViewModeChange }) {
  const hasSelection = !!selectedPrediction
  const isFraud = hasSelection && isFraudPrediction(selectedPrediction.fraud_probability)
  const hasShap = hasSelection && shapFeatures && shapFeatures.length > 0

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">
      {/* Score journey */}
      {hasSelection && hasShap && (
        <div className="mb-6 p-3 bg-surface-container-high rounded-lg border border-outline-variant/30">
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant flex-wrap">
            {[...shapFeatures]
              .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
              .slice(0, 3)
              .map((feat) => (
                <div key={feat.feature_name} className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${isShapPositive(feat.shap_value) ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {isShapPositive(feat.shap_value) ? '↑' : '↓'} {isShapPositive(feat.shap_value) ? '+' : '-'}
                    {Math.abs(feat.shap_value).toFixed(2)}
                  </span>
                  <span className="text-lg">→</span>
                </div>
              ))}
            <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-bold">
              Click prob: {(selectedPrediction.click_probability * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      <div>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {hasSelection ? (
              <>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {isFraud ? `Why was ${selectedPrediction.ad_id} flagged as fraud?` : `Why did ${selectedPrediction.ad_id} score ${(selectedPrediction.click_probability * 100).toFixed(0)}%?`}
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {selectedPrediction.campaign_name ?? 'Unattributed campaign'} · {selectedPrediction.model_version}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Model Explanation</h3>
                <p className="text-body-md text-on-surface-variant">Select a prediction to inspect</p>
              </>
            )}
          </div>

          {hasSelection && !isFraud && hasShap && (
            <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1 border border-outline-variant">
              {['business', 'ml'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all capitalize ${
                    viewMode === mode ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {mode === 'business' ? 'Business View' : 'ML View'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {!hasSelection && <EmptyState />}
        {hasSelection && !hasShap && <NoShapDataState />}
        {hasSelection && hasShap && isFraud && <FraudBreakdown prediction={selectedPrediction} shapFeatures={shapFeatures} />}
        {hasSelection && hasShap && !isFraud && viewMode === 'business' && <BusinessView shapFeatures={shapFeatures} />}
        {hasSelection && hasShap && !isFraud && viewMode === 'ml' && <MlView shapFeatures={shapFeatures} />}
      </div>
    </section>
  )
}