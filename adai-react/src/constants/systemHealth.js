/**
 * constants/systemHealth.js
 *
 * Single source of truth for all static data, thresholds, and
 * configuration values used across the System Health page components.
 *
 * Nothing in this file has side-effects.  Import individual named
 * exports rather than the whole module to keep tree-shaking effective.
 */

// ---------------------------------------------------------------------------
// Interval timings (ms)
// ---------------------------------------------------------------------------

/** How often the Global Latency P99 chart receives a new data point. */
export const CHART_UPDATE_INTERVAL_MS = 5000

/** How often the Kafka throughput counter and sparkline update. */
export const KAFKA_UPDATE_INTERVAL_MS = 3000

/** How often a new audit log line is appended to the terminal. */
export const AUDIT_LOG_INTERVAL_MS = 4500

// ---------------------------------------------------------------------------
// Chart — Global Latency (P99)
// ---------------------------------------------------------------------------

/** Total number of data points kept in the rolling latency chart window. */
export const CHART_WINDOW_SIZE = 15

/** Y-axis domain ceiling for the latency chart (ms). */
export const CHART_Y_MAX = 200

/** SLA reference line value — maps to PRD NFR bid response target. */
export const LATENCY_SLA_LIMIT_MS = 100

/** EU-CENTRAL-1 latency random range (ms). */
export const EU_LATENCY_MIN = 40
export const EU_LATENCY_MAX = 140

/** US-EAST-1 latency random range (ms). */
export const US_LATENCY_MIN = 60
export const US_LATENCY_MAX = 180

/** Chart start hour (8 AM) used by the initial data builder. */
export const CHART_BASE_HOUR = 8

// ---------------------------------------------------------------------------
// Kafka Throughput
// ---------------------------------------------------------------------------

/** PRD Section 13 — dev throughput target (events/second). */
export const KAFKA_DEV_TARGET_EPS = 10_000

/** Upper bound for the simulated Kafka EPS counter. */
export const KAFKA_EPS_MAX = 14_500

/** Lower bound for the simulated Kafka EPS counter. */
export const KAFKA_EPS_MIN = 10_000

/** Maximum random variation applied per Kafka update tick (±). */
export const KAFKA_EPS_VARIATION = 500

/** Divisor used to normalise a sparkline bar height to a percentage. */
export const KAFKA_SPARKLINE_HEIGHT_DIVISOR = 15_000

/** Seed value for the initial EPS counter display. */
export const KAFKA_INITIAL_THROUGHPUT = 12_847

/** Seed values for the initial 8-bar sparkline. */
export const KAFKA_INITIAL_SPARKLINE = [11_200, 11_800, 12_500, 13_100, 12_800, 13_500, 12_900, 12_847]

// ---------------------------------------------------------------------------
// Memory Pressure
// ---------------------------------------------------------------------------

export const MEMORY_APP_GB   = 38.4
export const MEMORY_CACHE_GB = 14.1
export const MEMORY_FREE_GB  = 11.5
export const MEMORY_TOTAL_GB = 64

/** Percentage threshold above which the memory label switches to error colour. */
export const MEMORY_HIGH_THRESHOLD_PCT = 80

// ---------------------------------------------------------------------------
// CPU Utilization
// ---------------------------------------------------------------------------

/**
 * Per-node utilisation percentages used to render the bar grid.
 * Index 3 (90 %) deliberately exceeds the 80 % threshold to show the
 * tertiary (amber) colour on node-ai-04.
 */
export const CPU_BAR_VALUES = [60, 45, 75, 90, 55, 65, 40, 70]

/** Percentage above which a CPU bar renders in the tertiary/warning colour. */
export const CPU_HIGH_THRESHOLD_PCT = 80

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

/** Maximum number of log lines retained in the terminal window. */
export const AUDIT_LOG_MAX_LINES = 15

/** Seed log lines shown before the live rotation begins. */
export const AUDIT_INITIAL_LOGS = [
  { time: '14:02:11', type: 'WARN',    msg: 'ML node inference latency spiked to 410ms on shard 4A',                  color: 'text-tertiary'    },
  { time: '14:02:15', type: 'INFO',    msg: 'Auto-scaling policy triggered. Provisioning 2 additional compute units.', color: 'text-primary'     },
  { time: '14:02:45', type: 'SUCCESS', msg: "Audience segment 'Pro Gamers' cache refreshed in 144ms.",                 color: 'text-green-400'   },
  { time: '14:03:02', type: 'INFO',    msg: 'System health check passed. Heartbeat acknowledged from all zones.',      color: 'text-primary'     },
  { time: '14:03:12', type: 'TRACE',   msg: 'User session ID 8x-912 authenticated via OAuth2...',                     color: 'text-on-surface'  },
]

/**
 * Rotating phrase pool for the live audit terminal.
 * Covers PRD-relevant events: Kafka, ML retraining, fraud detection,
 * SHAP latency, model promotion, and infrastructure events.
 */
export const AUDIT_LOG_PHRASES = [
  { type: 'INFO',    msg: 'DB Connection pool scaled up to 45 connections.',                         color: 'text-primary'    },
  { type: 'SUCCESS', msg: 'Aggregated analytics sync complete in 21ms.',                              color: 'text-green-400'  },
  { type: 'WARN',    msg: 'Higher memory overhead on worker 1C. Garbage collection scheduled.',       color: 'text-tertiary'   },
  { type: 'INFO',    msg: 'Re-balancing Kafka partitions for group adai-events.',                     color: 'text-primary'    },
  { type: 'TRACE',   msg: 'Event listener buffer flushed: 0 events remaining.',                      color: 'text-on-surface' },
  { type: 'WARN',    msg: 'Fraud detection model recall dropped to 82%. Retraining scheduled.',       color: 'text-tertiary'   },
  { type: 'SUCCESS', msg: 'XGBoost CTR model retrained. AUC-ROC: 0.791 on held-out test set.',       color: 'text-green-400'  },
  { type: 'INFO',    msg: 'Kafka topic fraud-flags consumer lag: 3ms. Within threshold.',             color: 'text-primary'    },
  { type: 'WARN',    msg: 'SHAP explanation latency at 48ms. Approaching 50ms SLA limit.',            color: 'text-tertiary'   },
  { type: 'INFO',    msg: 'ML model version v2.4.1 promoted to production via MLflow registry.',      color: 'text-primary'    },
]

// ---------------------------------------------------------------------------
// Service Cards
// ---------------------------------------------------------------------------

/**
 * Static configuration for the 6 infrastructure service cards.
 * Matches the service names seeded by seed_system_health_data.py.
 */
export const SERVICE_CARDS_CONFIG = [
  {
    icon:         'api',
    iconColor:    'text-primary',
    borderColor:  'border-l-primary',
    statusLabel:  'Healthy',
    statusColor:  'text-green-400',
    title:        'Core API',
    metricLabel:  'Uptime',
    metricValue:  '99.998%',
    subLabel:     '✓ Above SLA',
    subColor:     'text-green-400',
  },
  {
    icon:         'lan',
    iconColor:    'text-primary',
    borderColor:  'border-l-primary',
    statusLabel:  'Healthy',
    statusColor:  'text-green-400',
    title:        'Kafka Cluster',
    metricLabel:  'Lag',
    metricValue:  '12ms',
  },
  {
    icon:         'database',
    iconColor:    'text-primary',
    borderColor:  'border-l-primary',
    statusLabel:  'Healthy',
    statusColor:  'text-green-400',
    title:        'Redis Cache',
    metricLabel:  'Hit Rate',
    metricValue:  '94.2%',
  },
  {
    icon:         'neurology',
    iconColor:    'text-error',
    borderColor:  'border-l-error',
    statusLabel:  'SLA Breach',
    statusColor:  'text-error',
    title:        'ML Inference',
    metricLabel:  'Latency',
    metricValue:  '340ms',
    metricColor:  'text-error',
    alertText:    '⚠ SLA BREACH: 340ms exceeds the 30ms inference target',
  },
  {
    icon:         'security',
    iconColor:    'text-primary',
    borderColor:  'border-l-primary',
    statusLabel:  'Healthy',
    statusColor:  'text-green-400',
    title:        'Fraud Detection',
    metricLabel:  'Uptime',
    metricValue:  '99.7%',
    subLabel:     '✓ Above SLA (99.5%)',
    subColor:     'text-green-400',
  },
  {
    icon:         'storage',
    iconColor:    'text-primary',
    borderColor:  'border-l-primary',
    statusLabel:  'Healthy',
    statusColor:  'text-green-400',
    title:        'PostgreSQL',
    metricLabel:  'Query Time',
    metricValue:  '8ms',
  },
]