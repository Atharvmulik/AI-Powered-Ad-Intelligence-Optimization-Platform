// src/components/aiinsights/ModelStatusCards.jsx
// Section 2 — one status card per model version reported by
// GET /api/v1/aiinsight/model-status. No simulated degradation, no
// hardcoded model list — everything is driven by modelStatus.models.

import { getModelStatusColor } from '@/utils/aiInsightsHelpers'

function StatusBadge({ status }) {
  const isActive = status === 'Active'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getModelStatusColor(status)}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  )
}

function ModelCard({ model }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary">model_training</span>
        </div>
        <StatusBadge status={model.status} />
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface">{model.model_name}</h3>
      <p className="text-xs text-on-surface-variant mt-1">Version {model.model_version}</p>

      <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Avg latency</span>
          <span className="text-label-md font-bold text-primary font-mono">
            {model.average_latency.toFixed(1)}ms
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Predictions today</span>
          <span className="text-label-md font-bold text-primary font-mono">{model.predictions_today}</span>
        </div>
        {model.accuracy !== null && model.accuracy !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Accuracy</span>
            <span className="text-label-md font-bold text-primary font-mono">{model.accuracy.toFixed(1)}%</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
          <span>Last prediction {new Date(model.last_prediction_time).toLocaleTimeString('en-US', { hour12: false })}</span>
          <span>{model.uptime.toFixed(0)}%</span>
        </div>
        <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
          <div className="h-full bg-primary" style={{ width: `${model.uptime}%` }} />
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
        <ModelCard key={`${model.model_name}-${model.model_version}`} model={model} />
      ))}
    </section>
  )
}