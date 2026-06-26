// src/utils/analyticsHelpers.js
// Pure helper functions shared across Analytics sub-components.

export const rand = (min, max) => Math.random() * (max - min) + min
export const randInt = (min, max) => Math.floor(rand(min, max + 1))

// ── Date range helpers ────────────────────────────────────────────────────────

const getToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const formatRange = (start, end) => {
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

export const getDateRange = (preset, referenceDate = null) => {
  const today = referenceDate ? new Date(referenceDate) : getToday()
  today.setHours(0, 0, 0, 0)
  let start = new Date(today)
  let end = new Date(today)
  switch (preset) {
    case 'Last 7 Days':
      start.setDate(today.getDate() - 7)
      break
    case 'Last 30 Days':
      start.setDate(today.getDate() - 30)
      break
    case 'Last 90 Days':
      start.setDate(today.getDate() - 90)
      break
    case 'This Quarter': {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3
      start = new Date(today.getFullYear(), quarterMonth, 1)
      break
    }
    default:
      start.setDate(today.getDate() - 30)
  }
  return { start, end, label: preset, display: formatRange(start, end) }
}

// ── Fraud score styling ───────────────────────────────────────────────────────

export const fraudScoreBg = (s) =>
  s > 0.8
    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
    : s > 0.5
    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'

export const actionChip = (a) => {
  if (a === 'Blocked') return 'bg-red-500/10 border border-red-500/30 text-red-400'
  if (a === 'Flagged')  return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
  return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
}

export const roasColor = (r) =>
  r > 3 ? 'text-emerald-400' : r >= 2 ? 'text-yellow-400' : 'text-red-400'

export const statusColor = (s) =>
  s === 'Active'
    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
    : s === 'Paused'
    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
    : 'bg-red-500/10 border border-red-500/30 text-red-400'

// ── Trend badge ───────────────────────────────────────────────────────────────

export const trendBadge = (cur, prev, suffix = '') => {
  const up = cur >= prev
  const delta = Math.abs(cur - prev)
  const formatted = typeof delta === 'number' && delta % 1 !== 0 ? delta.toFixed(1) : delta
  return { up, delta: `${formatted}${suffix}` }
}

// ── Toast ID generator ────────────────────────────────────────────────────────

let toastIdCounter = 0
export const generateToastId = () => {
  toastIdCounter += 1
  return toastIdCounter
}