// ─── helpers ──────────────────────────────────────────────────────────────────
export const randBetween = (min, max) => Math.random() * (max - min) + min

export const formatReach = (meta, val) => {
  if (meta.reachUnit === 'M') return `${val.toFixed(2)}M`
  return `${Math.round(val)}K`
}

export const fraudBadgeClass = (risk) =>
  risk === 'Low'
    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
    : risk === 'Medium'
    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
    : 'bg-red-400/10 text-red-400 border border-red-400/20'

export const fraudDotClass = (risk) =>
  risk === 'Low' ? 'bg-emerald-400' : risk === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'