// src/components/aiinsights/LiveMetricsStrip.jsx
// Section 1 — live KPI cards sourced from the AI Insight WebSocket feed,
// falling back to the REST overview snapshot until the socket connects.
// The daily prediction count and model counts are based on persisted server
// metrics rather than WebSocket message frequency.

function PulseDot({ live }) {
  return (
    <span className="relative flex h-2 w-2">
      {live && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${live ? 'bg-green-500' : 'bg-amber-500'}`} />
    </span>
  )
}

function formatNumber(value, fallback = 'N/A') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback
  return Number(value).toLocaleString()
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'

  const num = Number(value)
  const normalized = num > 0 && num <= 1 ? num * 100 : num

  return `${normalized.toFixed(1)}%`
}

function MetricCard({ label, value, detail, live }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
      <div className="min-w-0">
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">{label}</span>
        <span className="text-xl font-bold font-mono text-primary mt-1 block truncate">{value}</span>
        {detail && <span className="mt-1 block text-[10px] text-on-surface-variant font-mono">{detail}</span>}
      </div>
      <PulseDot live={live} />
    </div>
  )
}

export default function LiveMetricsStrip({ overview, liveData, connected }) {
  const totalPredictions =
    (typeof liveData?.total_predictions_today === 'number' && Number.isFinite(liveData.total_predictions_today)
      ? liveData.total_predictions_today
      : typeof overview?.total_predictions === 'number' && Number.isFinite(overview.total_predictions)
        ? overview.total_predictions
        : 0)

  const activeModels =
    (typeof liveData?.active_models === 'number' && Number.isFinite(liveData.active_models)
      ? liveData.active_models
      : typeof overview?.active_models === 'number' && Number.isFinite(overview.active_models)
        ? overview.active_models
        : 0)

  const fraudProbability =
    (typeof liveData?.average_fraud_probability === 'number' && Number.isFinite(liveData.average_fraud_probability)
      ? liveData.average_fraud_probability
      : typeof overview?.average_fraud_probability === 'number' && Number.isFinite(overview.average_fraud_probability)
        ? overview.average_fraud_probability
        : null)

  const recentPredictionCount =
    typeof liveData?.recent_predictions === 'number' && Number.isFinite(liveData.recent_predictions)
      ? liveData.recent_predictions
      : typeof overview?.recent_predictions === 'number' && Number.isFinite(overview.recent_predictions)
        ? overview.recent_predictions
        : null

  const predictionDetail = recentPredictionCount !== null ? `Recent activity: ${formatNumber(recentPredictionCount)}` : 'Recorded today'

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <MetricCard
        label="Predictions today"
        value={formatNumber(totalPredictions, '0')}
        detail={predictionDetail}
        live={connected}
      />
      <MetricCard label="Active models" value={formatNumber(activeModels, '0')} live={connected} />
      <MetricCard
        label="Avg predicted fraud probability"
        value={fraudProbability === null ? 'N/A' : formatPercent(fraudProbability)}
        detail="Average over recorded predictions"
        live={connected}
      />
    </section>
  )
}