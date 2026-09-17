// constants/realTimeEvents.ts

import type {
  EventTypeConfig,
  LogEntry,
  NodesInfo,
  PatchInfo,
  StaticStatusInfo,
} from '../types/realTimeEvents';

/**
 * Simulation timing — how often each fake data stream ticks.
 * Once wired to a real backend, these move into the WebSocket
 * reconnect/heartbeat config instead.
 */
export const STATS_INTERVAL_MS = 3000;
export const LOG_INTERVAL_MS = 1500;
export const FRAUD_FLASH_DURATION_MS = 500;

/** Rolling buffer sizes. */
export const MAX_LOG_ENTRIES = 30;
export const LATENCY_HISTORY_SIZE = 20;

/** Bounds used both to clamp simulated values and to scale the latency chart. */
export const EVENTS_PER_SEC_MIN = 780;
export const EVENTS_PER_SEC_MAX = 920;
export const EVENTS_PER_SEC_JITTER = 20; // max +/- swing per tick

export const KAFKA_LATENCY_MIN = 9;
export const KAFKA_LATENCY_MAX = 18;
export const KAFKA_LATENCY_JITTER = 4; // max +/- swing per tick
export const KAFKA_LATENCY_HIGH_THRESHOLD = 15; // above this, chart line turns red

export const TOTAL_EVENTS_INCREMENT = 0.001; // millions, added per stats tick

/** Probability that a simulated log line is a SHAP explanation vs. CLICK/FRAUD/PRED. */
export const SHAP_EVENT_PROBABILITY = 0.15;

/** Chart line colors. */
export const LATENCY_LINE_COLOR_NORMAL = '#c0c1ff';
export const LATENCY_LINE_COLOR_HIGH = '#ef4444';

/** Static progress-bar fill widths shown under each KPI card. */
export const EVENTS_PER_SEC_BAR_WIDTH = '72%';
export const TOTAL_EVENTS_BAR_WIDTH = '65%';
export const KAFKA_LATENCY_BAR_WIDTH = '88%';

/** Kafka Status badge thresholds, keyed off eventsPerSec. */
export const KAFKA_STATUS_HEALTHY_THRESHOLD = 800;
export const KAFKA_STATUS_DEGRADED_THRESHOLD = 600;

/**
 * Event type registry: label, color tokens, and the message pattern used
 * to generate a simulated log line. `{}` placeholders are filled in by
 * buildLogMessage() in utils/realTimeEventsHelpers.js.
 */
export const EVENT_TYPES: EventTypeConfig[] = [
  {
    label: 'CLICK',
    color: 'text-primary',
    msgColor: 'text-on-surface',
    pattern: 'evt_{}_clnk | campaign_id: AD_{} | score: {}',
  },
  {
    label: 'FRAUD',
    color: 'text-error',
    msgColor: 'text-error',
    pattern: 'BLOCKED | reason: high_velocity | ip: 45.2.{}.{}',
  },
  {
    label: 'PRED',
    color: 'text-tertiary',
    msgColor: 'text-tertiary',
    pattern: 'MODEL_HIT | p_conv: {} | recommended_bid: ${}',
  },
  {
    label: 'SHAP',
    color: 'text-yellow-400',
    msgColor: 'text-yellow-400',
    pattern:
      'EXPLAIN | ad_id: AD_{} | top_feat: user_interest(+{}) device_type(+{}) time_of_day(+{})',
  },
];

/** Index of the SHAP config within EVENT_TYPES, used by the log simulator. */
export const SHAP_EVENT_INDEX = 3;

/** Initial seed logs shown before the first simulated tick. */
export const INITIAL_LOGS: LogEntry[] = [
  {
    time: '14:02:21',
    label: 'CLICK',
    msg: 'evt_88921_clnk | campaign_id: AD_990 | score: 0.98',
    color: 'text-primary',
    msgColor: 'text-on-surface',
  },
  {
    time: '14:02:22',
    label: 'FRAUD',
    msg: 'SUSPICIOUS_IP | src: 192.168.1.1 | bot_sig: detected | blocking...',
    color: 'text-error',
    msgColor: 'text-error',
  },
  {
    time: '14:02:22',
    label: 'PRED',
    msg: 'conversion_likely | target_cpa: $2.40 | bid_adjust: +15%',
    color: 'text-tertiary',
    msgColor: 'text-tertiary',
  },
  {
    time: '14:02:23',
    label: 'CLICK',
    msg: 'evt_88924_clnk | campaign_id: AD_102 | score: 0.92',
    color: 'text-primary',
    msgColor: 'text-on-surface',
  },
  {
    time: '14:02:23',
    label: 'CLICK',
    msg: 'evt_88925_clnk | campaign_id: AD_884 | score: 0.99',
    color: 'text-primary',
    msgColor: 'text-on-surface',
  },
];

/** Initial values for the KPI cards, before the first simulated tick. */
export const INITIAL_EVENTS_PER_SEC = 847;
export const INITIAL_TOTAL_EVENTS = 72.4; // millions
export const INITIAL_KAFKA_LATENCY = 12; // ms
export const INITIAL_LATENCY_HISTORY = [
  12, 13, 11, 12, 14, 13, 12, 11, 10, 12, 13, 14, 12, 11, 13, 12, 14, 13, 12, 11,
];

/** Static (non-Kafka) status badges — currently hardcoded, not simulated. */
export const ML_PIPELINE_STATUS: StaticStatusInfo = {
  label: 'ML Pipeline',
  value: 'ACTIVE',
  dotColor: 'bg-green-400',
  valueColor: 'text-green-400',
  borderColor: 'border-green-400/30',
  tooltip: 'Real-time inference engine status',
  pulse: true,
};

export const FRAUD_ENGINE_STATUS: StaticStatusInfo = {
  label: 'Fraud Engine',
  value: 'SCANNING',
  dotColor: 'bg-tertiary',
  valueColor: 'text-tertiary',
  borderColor: 'border-tertiary/30',
  tooltip: 'Real-time fraud detection scanning',
  pulse: true,
};

export const REDIS_CACHE_STATUS: StaticStatusInfo = {
  label: 'Redis Cache',
  value: 'HIT RATE: 94%',
  dotColor: 'bg-secondary',
  valueColor: 'text-secondary',
  borderColor: 'border-secondary/30',
  tooltip: 'Cache hit rate for real-time features',
  pulse: false,
};

export const KAFKA_STATUS_TOOLTIP = 'Real-time Kafka consumer lag monitoring';

/** Static content for the "Nodes Active" info card. */
export const NODES_INFO: NodesInfo = {
  healthyNodes: 14,
  totalNodes: 14,
  region: 'US-EAST-1',
};

/** Static content for the "Latest AI Patch" info card. */
export const PATCH_INFO: PatchInfo = {
  version: 'V-2.404',
  deployedMinutesAgo: 12,
  description: 'Improved Fraud Detection',
};

/** Filename prefix used when exporting logs. */
export const EXPORT_FILENAME_PREFIX = 'adai_event_logs';