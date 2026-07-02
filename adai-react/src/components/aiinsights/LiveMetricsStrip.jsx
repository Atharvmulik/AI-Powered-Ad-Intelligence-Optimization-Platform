// src/components/aiinsights/LiveMetricsStrip.jsx
// Section 1 — live KPI cards sourced from the AI Insight WebSocket feed,
// falling back to the REST overview snapshot until the socket connects.
// Renamed from KafkaMetricsStrip.jsx: the AI Insight backend has no Kafka
// concept, so this now surfaces the metrics that actually exist
// (predictions today, active models, fraud probability, live/stale state).

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

function MetricCard({ label, value, live }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
      <div>
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">{label}</span>
        <span className="text-xl font-bold font-mono text-primary mt-1 block">{value}</span>
      </div>
      <PulseDot live={live} />
    </div>
  )
}

export default function LiveMetricsStrip({ overview, liveData, connected }) {
  const totalPredictions = liveData?.total_predictions_today ?? overview?.total_predictions ?? 0
  const activeModels = liveData?.active_models ?? overview?.active_models ?? 0
  const fraudProbability = liveData?.average_fraud_probability ?? overview?.average_fraud_probability ?? 0

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <MetricCard label="Predictions today" value={totalPredictions.toLocaleString()} live={connected} />
      <MetricCard label="Active models" value={activeModels} live={connected} />
      <MetricCard label="Avg fraud probability" value={`${fraudProbability.toFixed(1)}%`} live={connected} />
    </section>
  )
}