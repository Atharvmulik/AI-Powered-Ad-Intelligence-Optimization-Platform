/**
 * utils/systemHealthHelpers.js
 *
 * Pure, side-effect-free helper functions used across System Health
 * page components and hooks.  Every function is independently testable.
 */

// ---------------------------------------------------------------------------
// Random
// ---------------------------------------------------------------------------

/**
 * Return a random integer between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Return a random float variation in the range [-delta, +delta].
 *
 * @param {number} delta
 * @returns {number}
 */
export const randomVariation = (delta) =>
  Math.floor(Math.random() * (delta * 2 + 1)) - delta

// ---------------------------------------------------------------------------
// Clamping
// ---------------------------------------------------------------------------

/**
 * Clamp a value between a lower and upper bound.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value))

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Format a Date as HH:MM (24-hour, en-GB locale).
 * Used by the Global Latency chart axis and tooltip.
 *
 * @param {Date} date
 * @returns {string}  e.g. "14:05"
 */
export const formatTimeHHMM = (date) =>
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/**
 * Format a Date as HH:MM:SS (24-hour, en-GB locale).
 * Used by the Audit Log timestamp prefix.
 *
 * @param {Date} [date=new Date()]
 * @returns {string}  e.g. "14:05:32"
 */
export const formatTimeHHMMSS = (date = new Date()) =>
  date.toLocaleTimeString('en-GB', { hour12: false })

// ---------------------------------------------------------------------------
// Latency chart helpers
// ---------------------------------------------------------------------------

/**
 * Build the initial 15-point latency dataset for the P99 chart.
 * Each data point covers one hour starting from CHART_BASE_HOUR.
 *
 * @param {number} windowSize   - Number of data points to generate
 * @param {number} baseHour     - Starting hour (0–23)
 * @param {number} euMin        - EU-CENTRAL-1 latency lower bound (ms)
 * @param {number} euMax        - EU-CENTRAL-1 latency upper bound (ms)
 * @param {number} usMin        - US-EAST-1 latency lower bound (ms)
 * @param {number} usMax        - US-EAST-1 latency upper bound (ms)
 * @returns {{ time: string, eu: number, us: number }[]}
 */
export const buildInitialLatencyData = (
  windowSize,
  baseHour,
  euMin,
  euMax,
  usMin,
  usMax,
) => {
  const data    = []
  const baseTime = new Date()
  baseTime.setHours(baseHour, 0, 0, 0)

  for (let i = 0; i < windowSize; i++) {
    const time = new Date(baseTime.getTime() + i * 60 * 60 * 1000)
    data.push({
      time: formatTimeHHMM(time),
      eu:   randomInt(euMin, euMax),
      us:   randomInt(usMin, usMax),
    })
  }
  return data
}

/**
 * Append one new latency data point to the chart window,
 * dropping the oldest point to maintain a fixed window size.
 *
 * @param {Array}  prev   - Existing chart data array
 * @param {number} euMin
 * @param {number} euMax
 * @param {number} usMin
 * @param {number} usMax
 * @returns {Array}       - New chart data array (same length as prev)
 */
export const appendLatencyPoint = (prev, euMin, euMax, usMin, usMax) => {
  const now = new Date()
  return [
    ...prev.slice(1),
    {
      time: formatTimeHHMM(now),
      eu:   randomInt(euMin, euMax),
      us:   randomInt(usMin, usMax),
    },
  ]
}

// ---------------------------------------------------------------------------
// Kafka throughput helpers
// ---------------------------------------------------------------------------

/**
 * Compute the next Kafka EPS value from the previous value.
 * Applies a random variation then clamps to the configured bounds.
 *
 * @param {number} prev       - Previous EPS value
 * @param {number} variation  - Maximum random ± swing per tick
 * @param {number} min        - Lower bound
 * @param {number} max        - Upper bound
 * @returns {number}
 */
export const nextKafkaEps = (prev, variation, min, max) =>
  clamp(prev + randomVariation(variation), min, max)

/**
 * Append one EPS value to the sparkline, dropping the oldest bar.
 *
 * @param {number[]} prev    - Existing sparkline array
 * @param {number}   newEps  - New EPS value to append
 * @returns {number[]}
 */
export const appendSparklinePoint = (prev, newEps) =>
  [...prev.slice(1), newEps]

/**
 * Convert an EPS value to a CSS height percentage for a sparkline bar.
 *
 * @param {number} eps       - Events per second value
 * @param {number} divisor   - Value that maps to 100% height
 * @returns {number}         - Percentage (0–100)
 */
export const epsToBarHeight = (eps, divisor) =>
  (eps / divisor) * 100

// ---------------------------------------------------------------------------
// Audit log helpers
// ---------------------------------------------------------------------------

/**
 * Pick a random entry from the audit log phrase pool.
 *
 * @param {Array} phrases  - AUDIT_LOG_PHRASES constant array
 * @returns {object}       - Single phrase object { type, msg, color }
 */
export const randomAuditPhrase = (phrases) =>
  phrases[Math.floor(Math.random() * phrases.length)]

/**
 * Append a new timestamped log entry and trim to the max window size.
 *
 * @param {Array}  prev      - Existing log entries
 * @param {object} phrase    - { type, msg, color }
 * @param {number} maxLines  - Maximum lines to retain
 * @returns {Array}          - New log entries array
 */
export const appendLogEntry = (prev, phrase, maxLines) => {
  const entry = { time: formatTimeHHMMSS(), ...phrase }
  const next  = [...prev, entry]
  return next.length > maxLines ? next.slice(next.length - maxLines) : next
}