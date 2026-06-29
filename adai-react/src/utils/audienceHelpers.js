// ─── helpers ──────────────────────────────────────────────────────────────────
export const randBetween = (min, max) => Math.random() * (max - min) + min

// CHANGED: was formatReach(meta, val) — relied on meta.reachUnit, which only
// existed on mock SEGMENT_META. Real backend segments are a raw integer with
// no unit hint, so this now auto-detects M vs K from magnitude.
export const formatReach = (rawReach) => {
  if (rawReach >= 1_000_000) return `${(rawReach / 1_000_000).toFixed(2)}M`
  if (rawReach >= 1_000) return `${Math.round(rawReach / 1_000)}K`
  return `${rawReach}`
}

export const fraudBadgeClass = (risk) =>
  risk === 'Low'
    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
    : risk === 'Medium'
    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
    : 'bg-red-400/10 text-red-400 border border-red-400/20'

export const fraudDotClass = (risk) =>
  risk === 'Low' ? 'bg-emerald-400' : risk === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'