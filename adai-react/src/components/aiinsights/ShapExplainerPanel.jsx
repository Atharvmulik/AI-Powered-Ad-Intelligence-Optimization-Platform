// Left 8/12 col — SHAP feature breakdown for the selected prediction.
// Prediction-specific features come from the prediction SHAP endpoint.

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">ads_click</span>
      <h4 className="text-title-md text-on-surface font-semibold mb-2">Select a prediction to inspect</h4>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        Click any event in the prediction feed to see its SHAP feature attribution
      </p>
    </div>
  )
}

function FeatureMetadata({ feature }) {
  return (
    <div className="ml-7 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
      {feature.feature_value !== undefined && feature.feature_value !== null && (
        <span>Feature value: <span className="font-mono text-on-surface">{feature.feature_value}</span></span>
      )}
      {feature.explanation_model && (
        <span>Explanation model: <span className="font-mono text-on-surface">{feature.explanation_model}</span></span>
      )}
    </div>
  )
}

function BusinessView({ features }) {
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {features.map((feature, index) => {
        const positive = feature.shap_value > 0
        const negative = feature.shap_value < 0
        const cardClass = positive
          ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
          : negative
            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
            : 'bg-surface-container-high border-outline-variant'
        const valueClass = positive ? 'text-green-500' : negative ? 'text-red-500' : 'text-on-surface-variant'

        return (
          <div key={`${feature.feature_name}-${index}`} className={`p-4 rounded-lg border transition-all ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${valueClass}`}>
                  {positive ? 'north_east' : negative ? 'south_west' : 'remove'}
                </span>
                <span className="font-semibold text-on-surface">{feature.feature_name}</span>
              </div>
              <span className={`text-xs font-mono ${valueClass}`}>
                SHAP {positive ? '+' : ''}{feature.shap_value}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant ml-7 mt-1">
              {positive
                ? 'Contributes toward a higher model output'
                : negative
                  ? 'Contributes toward a lower model output'
                  : 'No directional contribution relative to the baseline'}
            </p>
            <FeatureMetadata feature={feature} />
          </div>
        )
      })}
    </div>
  )
}

function MlView({ features }) {
  const maxAbs = Math.max(...features.map((feature) => Math.abs(feature.shap_value)), 0.0001)

  return (
    <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {features.map((feature, index) => {
        const positive = feature.shap_value > 0
        const negative = feature.shap_value < 0
        const widthPct = Math.min((Math.abs(feature.shap_value) / maxAbs) * 100, 100)

        return (
          <div key={`${feature.feature_name}-${index}`}>
            <div className="flex items-center group">
              <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">
                {feature.feature_name}
              </div>
              <div className="flex-1 h-8 flex items-center relative">
                <div className="absolute left-1/2 w-px h-full bg-outline-variant z-10" />
                {positive ? (
                  <div
                    className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container absolute"
                    style={{ left: '50%', width: `${widthPct / 2}%` }}
                  />
                ) : negative ? (
                  <div
                    className="h-full bg-error rounded-l-sm transition-all group-hover:bg-red-400 absolute"
                    style={{ right: '50%', width: `${widthPct / 2}%` }}
                  />
                ) : null}
              </div>
              <div className={`w-24 text-right font-mono text-label-md ml-4 ${
                positive ? 'text-primary' : negative ? 'text-error' : 'text-on-surface-variant'
              }`}>
                {positive ? '+' : ''}{feature.shap_value}
              </div>
            </div>
            <div className="ml-40">
              <FeatureMetadata feature={feature} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ExplanationMetadata({ data }) {
  const metadata = [
    data.model_version && `Model version: ${data.model_version}`,
    data.timestamp && `Explanation time: ${data.timestamp}`,
  ].filter(Boolean)

  if (metadata.length === 0) return null

  return (
    <p className="text-xs font-mono text-on-surface-variant mt-1">
      {metadata.join(' · ')}
    </p>
  )
}

export default function ShapExplainerPanel({ selectedPrediction, explanation, viewMode, onViewModeChange }) {
  const hasSelection = !!selectedPrediction
  const hasFeatures = explanation.status === 'success' && explanation.data.features.length > 0

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            {hasSelection ? (
              <>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  Prediction explanation · {selectedPrediction.ad_id}
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {selectedPrediction.campaign_name ?? 'Unattributed campaign'}
                </p>
                {explanation.status === 'success' && <ExplanationMetadata data={explanation.data} />}
              </>
            ) : (
              <>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Model Explanation</h3>
                <p className="text-body-md text-on-surface-variant">Select a prediction to inspect</p>
              </>
            )}
          </div>

          {hasFeatures && (
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

        {hasFeatures && (
          <>
            <p className="text-xs text-on-surface-variant mb-4">
              Positive values contribute toward a higher model output and negative values toward a lower output, relative to the explainer baseline. Bar lengths compare contribution magnitudes within this explanation.
            </p>
            {viewMode === 'business'
              ? <BusinessView features={explanation.data.features} />
              : <MlView features={explanation.data.features} />}
          </>
        )}

        {!hasSelection && <EmptyState />}
        {hasSelection && explanation.status === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-12 text-body-md text-on-surface-variant" role="status">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading prediction explanation…
          </div>
        )}
        {hasSelection && explanation.status === 'unavailable' && (
          <p className="py-12 text-center text-body-md text-on-surface-variant">
            Prediction-specific explainability is unavailable because this record has no prediction ID.
          </p>
        )}
        {hasSelection && explanation.status === 'success' && explanation.data.features.length === 0 && (
          <p className="py-12 text-center text-body-md text-on-surface-variant">
            No SHAP explanation is available for this prediction.
          </p>
        )}
        {hasSelection && explanation.status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-body-md text-error">{explanation.message}</p>
            <button
              type="button"
              onClick={explanation.retry}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-mono hover:opacity-90"
            >
              Retry explanation
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
