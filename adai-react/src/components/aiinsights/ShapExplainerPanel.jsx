// src/components/aiinsights/ShapExplainerPanel.jsx
// Left 8/12 col — Score Journey bar + Business/ML view toggle + three content states:
//   1. Empty (no selection)
//   2. Fraud signal breakdown
//   3. Feature cards (Business view) or SHAP bar chart (ML view)
//
// Props:
//   selectedPrediction  — stream item or null
//   selectedShapData    — shapData object or null
//   selectedIsFraud     — boolean
//   viewMode            — 'business' | 'ml'
//   onViewModeChange    — (mode) => void

import { getFeatureSubtitle, getImpactLevel, getThreatLevel } from '@/utils/aiInsightsHelpers'

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">ads_click</span>
      <h4 className="text-title-md text-on-surface font-semibold mb-2">Select a prediction to inspect</h4>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        Click any event in the live stream to see a full AI explanation of why that score was assigned
      </p>
      <div className="flex gap-2">
        <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">User History</span>
        <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">Ad Category</span>
        <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">Time of Day</span>
      </div>
    </div>
  )
}

function FraudBreakdown({ shapData }) {
  return (
    <div className="space-y-5">
      {/* Top fraud signals */}
      <div>
        <h4 className="text-label-md font-mono text-error mb-3">🚨 Top Fraud Signals</h4>
        <div className="space-y-3">
          {shapData.features.slice(0, 3).map((signal, idx) => {
            const threat = getThreatLevel(signal.value)
            const chipClass =
              threat.label === 'CRITICAL' ? 'bg-red-500/20 text-red-500'
              : threat.label === 'HIGH'   ? 'bg-orange-500/20 text-orange-500'
              : 'bg-yellow-500/20 text-yellow-500'
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface font-medium">{signal.plain}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${chipClass}`}>{threat.label}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${threat.color}`} style={{ width: threat.width }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Behavioral comparison */}
      <div>
        <h4 className="text-label-md font-mono text-on-surface-variant mb-3">Behavioral Comparison</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <p className="text-[10px] font-mono text-green-500 mb-2">Normal User</p>
            <div className="space-y-1 text-xs font-mono text-on-surface-variant">
              <div className="flex justify-between"><span>Clicks/min:</span><span>2-4</span></div>
              <div className="flex justify-between"><span>Session time:</span><span>4-8 min</span></div>
              <div className="flex justify-between"><span>Scroll events:</span><span>15-30</span></div>
              <div className="flex justify-between"><span>Mouse moves:</span><span>200+</span></div>
            </div>
          </div>
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-[10px] font-mono text-red-500 mb-2">This Session</p>
            <div className="space-y-1 text-xs font-mono text-on-surface-variant">
              <div className="flex justify-between"><span>Clicks/min:</span><span className="text-red-500">340</span></div>
              <div className="flex justify-between"><span>Session time:</span><span className="text-red-500">12 sec</span></div>
              <div className="flex justify-between"><span>Scroll events:</span><span className="text-red-500">0</span></div>
              <div className="flex justify-between"><span>Mouse moves:</span><span className="text-red-500">3</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action taken */}
      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-xs text-red-500 font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">block</span>
          Click NOT attributed to campaign · Advertiser budget protected · Flagged for review
        </p>
      </div>
    </div>
  )
}

function BusinessView({ shapData }) {
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {shapData.features.map((feature, idx) => {
        const impact    = getImpactLevel(feature.value)
        const subtitle  = getFeatureSubtitle(feature.feature, feature.value, feature.positive)
        const cardClass = feature.positive
          ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
        const iconColor = feature.positive ? 'text-green-500' : 'text-red-500'
        const icon      = feature.positive ? 'check_circle' : 'cancel'
        return (
          <div key={idx} className={`p-4 rounded-lg border transition-all ${cardClass}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${iconColor}`}>{icon}</span>
                <span className="font-semibold text-on-surface">{feature.plain}</span>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${impact.color}`}>{impact.label}</span>
            </div>
            <p className="text-xs text-on-surface-variant ml-7">{subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}

function MlView({ shapData }) {
  const maxAbs = Math.max(...shapData.features.map(f => Math.abs(f.value)))
  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {shapData.features.map((feature, idx) => {
        const isPositive  = feature.positive
        const widthPct    = Math.min((Math.abs(feature.value) / maxAbs) * 100, 100)
        return (
          <div key={idx} className="flex items-center group">
            <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">
              {feature.feature}
            </div>
            <div className="flex-1 h-8 flex items-center relative">
              <div className="absolute left-1/2 w-px h-full bg-outline-variant z-10" />
              {isPositive ? (
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
            <div className={`w-16 text-right font-mono text-label-md ml-4 ${isPositive ? 'text-primary' : 'text-error'}`}>
              {isPositive ? '+' : '-'}{Math.abs(feature.value).toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ShapExplainerPanel({
  selectedPrediction,
  selectedShapData,
  selectedIsFraud,
  viewMode,
  onViewModeChange,
}) {
  const hasSelection = !!selectedPrediction

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">

      {/* Score journey bar */}
      {hasSelection && selectedShapData && (
        <div className="mb-6 p-3 bg-surface-container-high rounded-lg border border-outline-variant/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant flex-wrap">
              <span className="px-2 py-1 bg-surface-container-lowest rounded">Base 0.50</span>
              <span className="text-lg">→</span>
              {selectedShapData.features
                .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                .slice(0, 3)
                .map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${feat.positive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {feat.positive ? '↑' : '↓'} {feat.positive ? '+' : '-'}{Math.abs(feat.value).toFixed(2)}
                    </span>
                    <span className="text-lg">→</span>
                  </div>
                ))}
              <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-bold">
                Final: {selectedPrediction.score}
              </span>
            </div>
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
                  {selectedIsFraud
                    ? `Why was ${selectedPrediction.user} flagged as fraud?`
                    : `Why did ${selectedPrediction.user} get score ${selectedPrediction.score}?`
                  }
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {selectedIsFraud
                    ? `Fraud score: ${selectedPrediction.score} · Real-time explanation`
                    : `Click probability: ${(selectedPrediction.score * 100).toFixed(0)}% · Feature breakdown`
                  }
                </p>
              </>
            ) : (
              <>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Model Explanation</h3>
                <p className="text-body-md text-on-surface-variant">Select a prediction to inspect</p>
              </>
            )}
          </div>

          {/* View toggle — only for non-fraud predictions */}
          {hasSelection && !selectedIsFraud && (
            <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1 border border-outline-variant">
              {['business', 'ml'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all capitalize ${
                    viewMode === mode
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
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
        {hasSelection && selectedIsFraud && <FraudBreakdown shapData={selectedShapData} />}
        {hasSelection && !selectedIsFraud && viewMode === 'business' && <BusinessView shapData={selectedShapData} />}
        {hasSelection && !selectedIsFraud && viewMode === 'ml' && <MlView shapData={selectedShapData} />}
      </div>

      {/* ML view footer */}
      {hasSelection && !selectedIsFraud && viewMode === 'ml' && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-label-md text-on-surface-variant border-t border-outline-variant/30 pt-4 gap-4">
          <div className="flex gap-4">
            <span className="flex items-center"><span className="w-3 h-3 bg-error rounded-full mr-2" /> Negative Impact</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-primary rounded-full mr-2" /> Positive Impact</span>
          </div>
          <div className="font-mono text-xs text-on-surface-variant flex items-baseline gap-1.5">
            <span>Model log loss:</span>
            <span className="text-primary font-bold">0.421</span>
          </div>
        </div>
      )}
    </section>
  )
}