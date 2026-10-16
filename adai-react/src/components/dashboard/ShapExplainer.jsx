// ============================================================
// src/components/dashboard/ShapExplainer.jsx
// ============================================================

import { motion } from 'framer-motion'

const decisionStyles = {
  SCALE: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  KEEP_RUNNING: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  MONITOR: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  OPTIMIZE: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
  REDUCE: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
  PAUSE: 'border-red-400/30 bg-red-500/10 text-red-300',
  NO_DATA: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
}

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(2)}%`
}

const formatRoas = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(2)}x`
}

const formatDecision = (value) => {
  if (!value) return 'NO DATA'
  return String(value).replace(/_/g, ' ')
}

export default function ShapExplainer({ aiAdDecision = null, loading = false, error = null }) {
  const decision = aiAdDecision
  const reasonList = Array.isArray(decision?.reasons) && decision.reasons.length > 0
    ? decision.reasons
    : ['No recent campaign traffic was available in the last 15 minutes.']

  const decisionLabel = decision?.decision ? formatDecision(decision.decision) : 'NO DATA'
  const normalizedDecision = String(decision?.decision ?? 'NO_DATA').toUpperCase()
  const tone = decisionStyles[normalizedDecision] ?? decisionStyles.NO_DATA

  if (loading) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6">
        <div className="h-6 w-48 rounded-md bg-surface-container-low animate-pulse mb-4" />
        <div className="h-20 w-full rounded-lg bg-surface-container-low animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-lg bg-surface-container-low animate-pulse" />
          <div className="h-16 rounded-lg bg-surface-container-low animate-pulse" />
          <div className="h-16 rounded-lg bg-surface-container-low animate-pulse" />
          <div className="h-16 rounded-lg bg-surface-container-low animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && !decision) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl">signal_cellular_nodata</span>
          <p className="mt-3 text-xs font-mono text-on-surface-variant">{error}</p>
        </div>
      </div>
    )
  }

  if (!decision) {
    return (
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
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
      className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">AI Ad Decision Center</p>
            <h3 className="font-title-lg text-title-lg text-on-surface mt-1">{decision.campaign_name || 'Campaign'}</h3>
          </div>
          <div className={`px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold uppercase tracking-[0.14em] ${tone}`}>
            {decisionLabel}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/30 p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">Campaign</p>
              <p className="mt-1 text-sm font-semibold text-on-surface">{decision.campaign_name || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">Decision score</p>
              <p className="mt-1 text-lg font-bold text-primary">{decision.decision_score != null ? Number(decision.decision_score).toFixed(2) : '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-3">
            <p className="text-[9px] font-mono uppercase text-on-surface-variant">CTR</p>
            <p className="mt-1 text-base font-bold text-on-surface">{formatPercent(decision.ctr)}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-3">
            <p className="text-[9px] font-mono uppercase text-on-surface-variant">Conversion</p>
            <p className="mt-1 text-base font-bold text-on-surface">{formatPercent(decision.conversion_rate)}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-3">
            <p className="text-[9px] font-mono uppercase text-on-surface-variant">Fraud risk</p>
            <p className="mt-1 text-base font-bold text-on-surface">{formatPercent(decision.fraud_risk ?? decision.fraud_rate)}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-3">
            <p className="text-[9px] font-mono uppercase text-on-surface-variant">ROAS</p>
            <p className="mt-1 text-base font-bold text-on-surface">{formatRoas(decision.roas)}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">Recommended action</p>
          <p className="mt-2 text-sm font-semibold text-on-surface">{decision.recommended_action || 'Monitor'}</p>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-on-surface-variant">Why</p>
          <ul className="mt-2 space-y-2">
            {reasonList.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-on-surface-variant leading-5">
                <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">check_circle</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-on-surface-variant">
        <span>{decision.timestamp ? new Date(decision.timestamp).toLocaleString() : '—'}</span>
        <span>{decision.campaign_id || decision.ad_id || '—'}</span>
      </div>
    </motion.div>
  )
}