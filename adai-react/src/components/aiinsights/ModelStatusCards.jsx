// src/components/aiinsights/ModelStatusCards.jsx
// Section 2 — one status card per model version reported by
// GET /api/v1/aiinsight/model-status. No simulated degradation, no
// hardcoded model list — everything is driven by modelStatus.models.

function formatMetricNumber(value, fallback = 'N/A') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback
  return Number(value).toLocaleString()
}

function formatLatency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
  return `${Number(value).toFixed(1)}ms`
}

function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
  return `${Number(value).toFixed(digits)}%`
}

function formatLastPrediction(value) {
  if (!value) return 'No prediction recorded'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'No prediction recorded'

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function normalizeStatus(model) {
  const rawStatus = typeof model?.status === 'string' ? model.status.trim() : ''
  if (rawStatus) return rawStatus

  const predictionsToday = Number(model?.predictions_today)
  return Number.isFinite(predictionsToday) && predictionsToday > 0 ? 'Active' : 'Idle'
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'Idle')
  const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase()
  const isActive = displayStatus === 'Active'
  const isIdle = displayStatus === 'Idle'

  const accent = isActive ? 'bg-green-500/10 text-green-500 border border-green-500/30' : isIdle ? 'bg-surface-container-highest text-on-surface-variant border border-outline-variant' : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${accent}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : isIdle ? 'bg-slate-400' : 'bg-amber-500'}`} />
      {displayStatus}
    </span>
  )
}

function ModelCard({ model }) {
  const status = normalizeStatus(model)
  const latency = formatLatency(model.average_latency)
  const accuracy = model.accuracy === null || model.accuracy === undefined || Number.isNaN(Number(model.accuracy))
    ? 'N/A'
    : `${Number(model.accuracy).toFixed(1)}%`
  const uptime = formatPercent(model.uptime, 0)
  const predictionsToday = formatMetricNumber(model.predictions_today, '0')
  const lastPrediction = formatLastPrediction(model.last_prediction_time)
  const uptimePercent = Number.isFinite(Number(model.uptime)) ? Math.max(0, Math.min(100, Number(model.uptime))) : 0

  return (
    <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary">model_training</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface">{model.model_name || 'Unnamed model'}</h3>
      <p className="text-xs text-on-surface-variant mt-1">Version {model.model_version || 'N/A'}</p>

      <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Avg latency</span>
          <span className="text-label-md font-bold text-primary font-mono">{latency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Predictions today</span>
          <span className="text-label-md font-bold text-primary font-mono">{predictionsToday}</span>
        </div>
        {model.accuracy !== null && model.accuracy !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Accuracy</span>
            <span className="text-label-md font-bold text-primary font-mono">{accuracy}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono gap-2">
          <span>Last prediction: {lastPrediction}</span>
          <span>{uptime}</span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
          <div className="h-full bg-primary" style={{ width: `${uptimePercent}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function ModelStatusCards({ modelStatus }) {
  const models = modelStatus?.models ?? []

  if (models.length === 0) {
    return (
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg text-center text-on-surface-variant text-body-md">
        No model activity logged yet.
      </section>
    )
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      {models.map((model) => (
        <ModelCard key={`${model.model_name ?? 'model'}-${model.model_version ?? 'version'}`} model={model} />
      ))}
    </section>
  )
}