// src/utils/aiInsightsHelpers.js
// Pure presentation-formatting helpers for the AI Insight components.
// No data fetching or state — components stay presentation-only, the
// hook (useAIInsight) owns all data shaping/derivation.

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-US', { hour12: false })
}

export function humanizeFeatureName(featureName) {
  if (!featureName) return ''
  return featureName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function isShapPositive(shapValue) {
  return shapValue >= 0
}

// Impact level for a SHAP feature, based on the magnitude of its shap_value.
export function getImpactLevel(shapValue) {
  const abs = Math.abs(shapValue)
  if (abs >= 0.3) return { label: 'HIGH', color: 'border-primary/40 text-primary' }
  if (abs >= 0.1) return { label: 'MEDIUM', color: 'border-tertiary/40 text-tertiary' }
  return { label: 'LOW', color: 'border-outline-variant text-on-surface-variant' }
}

// Threat level for a prediction's fraud_probability (0–1 scale).
export function getThreatLevel(fraudProbability) {
  const pct = Math.max(0, Math.min(fraudProbability, 1)) * 100
  if (fraudProbability >= 0.85)
    return { label: 'CRITICAL', color: 'bg-red-500', width: `${pct}%` }
  if (fraudProbability >= 0.6)
    return { label: 'HIGH', color: 'bg-orange-500', width: `${pct}%` }
  return { label: 'ELEVATED', color: 'bg-yellow-500', width: `${pct}%` }
}

export function isFraudPrediction(fraudProbability, threshold = 0.6) {
  return fraudProbability >= threshold
}

export function getClickProbColor(value) {
  if (value >= 0.6) return 'border-green-500/40 text-green-500 bg-green-500/10'
  if (value >= 0.3) return 'border-amber-500/40 text-amber-500 bg-amber-500/10'
  return 'border-error/40 text-error bg-error/10'
}

export function getFraudRiskColor(fraudProbability) {
  if (fraudProbability >= 0.6) return 'border-error/40 text-error bg-error/10'
  if (fraudProbability >= 0.3) return 'border-amber-500/40 text-amber-500 bg-amber-500/10'
  return 'border-green-500/40 text-green-500 bg-green-500/10'
}

export function getFraudRiskLabel(fraudProbability) {
  if (fraudProbability >= 0.6) return 'high'
  if (fraudProbability >= 0.3) return 'medium'
  return 'low'
}

export function getModelStatusColor(status) {
  return status === 'Active'
    ? 'bg-green-500/10 text-green-500'
    : 'bg-amber-500/10 text-amber-500'
}

export function getInfraStatusColor(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'healthy') return 'bg-green-500/10 text-green-500'
  if (normalized === 'degraded') return 'bg-amber-500/10 text-amber-500'
  return 'bg-error/10 text-error'
}