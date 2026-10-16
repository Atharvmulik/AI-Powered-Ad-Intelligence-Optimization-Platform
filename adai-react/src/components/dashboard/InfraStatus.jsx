import { motion } from 'framer-motion'

const getStatusClasses = (status) => {
  const normalized = String(status ?? 'no_data').toLowerCase()

  if (normalized === 'healthy') {
    return 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30'
  }

  if (normalized === 'degraded') {
    return 'text-amber-300 bg-amber-500/10 border-amber-400/30'
  }

  return 'text-on-surface-variant bg-surface-container-low border-outline-variant'
}

const getDotClasses = (status) => {
  const normalized = String(status ?? 'no_data').toLowerCase()

  if (normalized === 'healthy') {
    return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
  }

  if (normalized === 'degraded') {
    return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
  }

  return 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.4)]'
}

const getModelData = (model, fallbackLabel) => {
  if (!model) return null

  return {
    label: model.name || fallbackLabel,
    status: model.status || 'no_data',
    predictions: model.predictions ?? model.prediction_count ?? model.total_predictions ?? null,
    average: model.average ?? model.average_score ?? null,
    minValue: model.min ?? model.min_value ?? model.range?.min ?? null,
    maxValue: model.max ?? model.max_value ?? model.range?.max ?? null,
    highRiskCount: model.high_risk_count ?? null,
    criticalCount: model.critical_count ?? null,
    recommendationCount: model.recommendations ?? model.recommendation_count ?? null,
    uniqueAds: model.unique_ads ?? null,
    avgScore: model.avg_score ?? null,
  }
}

export default function InfraStatus({ modelIntelligence = null, loading = false, error = null }) {
  const modelList = [
    getModelData(modelIntelligence?.ctr_model, 'CTR MODEL'),
    getModelData(modelIntelligence?.fraud_model, 'FRAUD MODEL'),
    getModelData(modelIntelligence?.recommendation_engine, 'RECOMMENDATION ENGINE'),
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6">
        <div className="h-6 w-44 rounded-md bg-surface-container-low animate-pulse mb-5" />
        <div className="space-y-3">
          <div className="h-20 rounded-lg bg-surface-container-low animate-pulse" />
          <div className="h-20 rounded-lg bg-surface-container-low animate-pulse" />
          <div className="h-20 rounded-lg bg-surface-container-low animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && modelList.length === 0) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl">precision_manufacturing</span>
          <p className="mt-3 text-xs font-mono text-on-surface-variant">{error}</p>
        </div>
      </div>
    )
  }

  if (modelList.length === 0) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
          <p className="mt-3 text-xs font-mono text-on-surface-variant">No recent intelligence available</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">AI Control Panel</p>
          <h3 className="font-title-lg text-title-lg text-on-surface mt-1">Live Model Intelligence</h3>
        </div>
        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.14em] px-2 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary">
          LIVE
        </span>
      </div>

      <div className="space-y-3">
        {modelList.map((model) => (
          <div
            key={model.label}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-low/30 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-surface-container-low/60"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${getDotClasses(model.status)}`} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-on-surface">{model.label}</span>
              </div>
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-1 rounded-full border ${getStatusClasses(model.status)}`}>
                {String(model.status || 'NO_DATA').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-on-surface-variant">
              {model.predictions != null && (
                <div>
                  <p className="uppercase">Predictions</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{model.predictions.toLocaleString()}</p>
                </div>
              )}

              {model.average != null && (
                <div>
                  <p className="uppercase">Average</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{Number(model.average).toFixed(3)}</p>
                </div>
              )}

              {model.minValue != null || model.maxValue != null ? (
                <div>
                  <p className="uppercase">Range</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">
                    {model.minValue ?? '—'} — {model.maxValue ?? '—'}
                  </p>
                </div>
              ) : null}

              {model.highRiskCount != null && (
                <div>
                  <p className="uppercase">High Risk</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{model.highRiskCount}</p>
                </div>
              )}

              {model.criticalCount != null && (
                <div>
                  <p className="uppercase">Critical</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{model.criticalCount}</p>
                </div>
              )}

              {model.recommendationCount != null && (
                <div>
                  <p className="uppercase">Recommendations</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{model.recommendationCount}</p>
                </div>
              )}

              {model.uniqueAds != null && (
                <div>
                  <p className="uppercase">Unique Ads</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{model.uniqueAds}</p>
                </div>
              )}

              {model.avgScore != null && (
                <div>
                  <p className="uppercase">Avg Score</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{Number(model.avgScore).toFixed(3)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}