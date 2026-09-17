// utils/realTimeEventsHelpers.js

import {
  EVENT_TYPES,
  SHAP_EVENT_INDEX,
  SHAP_EVENT_PROBABILITY,
  KAFKA_LATENCY_MIN,
  KAFKA_LATENCY_MAX,
  KAFKA_LATENCY_HIGH_THRESHOLD,
  LATENCY_LINE_COLOR_NORMAL,
  LATENCY_LINE_COLOR_HIGH,
  KAFKA_STATUS_HEALTHY_THRESHOLD,
  KAFKA_STATUS_DEGRADED_THRESHOLD,
  EXPORT_FILENAME_PREFIX,
} from '../constants/realTimeEvents';

/**
 * Pure helper functions for the Real-Time Events page: event tallying,
 * chart geometry, status derivation, simulated log generation, and
 * file export. No React state or side effects beyond the two export
 * functions, which trigger a browser download.
 */

// ---------------------------------------------------------------------------
// Event distribution
// ---------------------------------------------------------------------------

/**
 * Tally how many of each event type currently appear in the log buffer.
 * @param {Array<{label: string}>} logs
 * @returns {{CLICK: number, FRAUD: number, PRED: number, SHAP: number}}
 */
export function getEventCounts(logs) {
  const counts = { CLICK: 0, FRAUD: 0, PRED: 0, SHAP: 0 };
  logs.forEach((log) => {
    if (counts[log.label] !== undefined) counts[log.label]++;
  });
  return counts;
}

/**
 * Convert an event count into a pixel bar height for the distribution chart.
 * @param {number} count
 * @param {number} maxCount
 * @returns {number} height in px
 */
export function getBarHeight(count, maxCount) {
  const minHeight = 8;
  const maxHeight = 70;
  return count === 0 ? minHeight : (count / maxCount) * maxHeight;
}

// ---------------------------------------------------------------------------
// Latency chart geometry
// ---------------------------------------------------------------------------

/**
 * Build the SVG line + area path data for the latency sparkline.
 * @param {number[]} latencyHistory
 * @param {number} [minLatency]
 * @param {number} [maxLatency]
 * @returns {{linePath: string, areaPath: string}}
 */
export function generateLatencyPath(
  latencyHistory,
  minLatency = KAFKA_LATENCY_MIN,
  maxLatency = KAFKA_LATENCY_MAX
) {
  if (latencyHistory.length === 0) {
    return { linePath: '', areaPath: '' };
  }

  const points = latencyHistory.map((value, index) => {
    const x = (index / (latencyHistory.length - 1)) * 400;
    const y = 80 - ((value - minLatency) / (maxLatency - minLatency)) * 60;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} V 100 H 0 Z`;
  return { linePath, areaPath };
}

/**
 * Pick the sparkline color based on the latest latency reading.
 * @param {number} latestLatency
 * @param {number} [threshold]
 * @returns {string} hex color
 */
export function getLatencyLineColor(latestLatency, threshold = KAFKA_LATENCY_HIGH_THRESHOLD) {
  return latestLatency > threshold ? LATENCY_LINE_COLOR_HIGH : LATENCY_LINE_COLOR_NORMAL;
}

// ---------------------------------------------------------------------------
// Kafka status badge
// ---------------------------------------------------------------------------

/**
 * Derive the Kafka Status badge's text/colors from the current events/sec rate.
 * @param {number} eventsPerSec
 * @returns {{text: string, color: string, dotColor: string, borderColor: string}}
 */
export function getKafkaStatus(eventsPerSec) {
  if (eventsPerSec > KAFKA_STATUS_HEALTHY_THRESHOLD) {
    return {
      text: 'HEALTHY',
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      borderColor: 'border-green-400/30',
    };
  }
  if (eventsPerSec >= KAFKA_STATUS_DEGRADED_THRESHOLD) {
    return {
      text: 'DEGRADED',
      color: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      borderColor: 'border-yellow-400/30',
    };
  }
  return {
    text: 'CRITICAL',
    color: 'text-red-400',
    dotColor: 'bg-red-400',
    borderColor: 'border-red-400/30',
  };
}

// ---------------------------------------------------------------------------
// Simulated log generation
// ---------------------------------------------------------------------------

/**
 * Fill in a message pattern's `{}` placeholders based on the event's label.
 * Mirrors the original inline replacement logic exactly.
 * @param {{label: string, pattern: string}} eventConfig
 * @returns {string} the fully rendered message
 */
export function buildLogMessage(eventConfig) {
  let msg = eventConfig.pattern;

  if (eventConfig.label === 'CLICK') {
    msg = msg
      .replace('{}', Math.floor(Math.random() * 90000 + 10000))
      .replace('{}', Math.floor(Math.random() * 900 + 100))
      .replace('{}', (Math.random() * 0.2 + 0.8).toFixed(2));
  } else if (eventConfig.label === 'FRAUD') {
    msg = msg
      .replace('{}', Math.floor(Math.random() * 255))
      .replace('{}', Math.floor(Math.random() * 255));
  } else if (eventConfig.label === 'PRED') {
    msg = msg
      .replace('{}', Math.random().toFixed(3))
      .replace('{}', (Math.random() * 4 + 0.5).toFixed(2));
  } else if (eventConfig.label === 'SHAP') {
    msg = msg
      .replace('{}', Math.floor(Math.random() * 900 + 100))
      .replace('{}', (Math.random() * 0.5 + 0.1).toFixed(2))
      .replace('{}', (Math.random() * 0.3 + 0.05).toFixed(2))
      .replace('{}', (Math.random() * 0.25 + 0.05).toFixed(2));
  }

  return msg;
}

/**
 * Format the current time the same way the terminal timestamps do.
 * @returns {string} e.g. "14:02:21"
 */
export function getCurrentTimeString() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

/**
 * Pick which event type the next simulated log line should be, weighting
 * SHAP at SHAP_EVENT_PROBABILITY and splitting the remainder evenly across
 * the other three types. Mirrors the original inline selection logic.
 * @param {Array} eventTypes
 * @returns {object} the chosen EventTypeConfig
 */
export function pickRandomEventType(eventTypes = EVENT_TYPES) {
  if (Math.random() < SHAP_EVENT_PROBABILITY) {
    return eventTypes[SHAP_EVENT_INDEX];
  }
  return eventTypes[Math.floor(Math.random() * 3)];
}

/**
 * Generate one fully-formed simulated log entry, ready to append to the
 * terminal's log buffer.
 * @param {Array} [eventTypes]
 * @returns {{time: string, label: string, msg: string, color: string, msgColor: string}}
 */
export function createSimulatedLogEntry(eventTypes = EVENT_TYPES) {
  const event = pickRandomEventType(eventTypes);
  const msg = buildLogMessage(event);
  const time = getCurrentTimeString();

  return {
    time,
    label: event.label,
    msg,
    color: event.color,
    msgColor: event.msgColor,
  };
}

// ---------------------------------------------------------------------------
// Export logs (client-side file download — not a REST call)
// ---------------------------------------------------------------------------

/**
 * Trigger a browser download of a Blob with the given filename.
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download the current log buffer as a JSON file.
 * @param {Array} logs
 */
export function exportLogsAsJson(logs) {
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${EXPORT_FILENAME_PREFIX}_${Date.now()}.json`);
}

/**
 * Download the current log buffer as a CSV file.
 * @param {Array} logs
 */
export function exportLogsAsCsv(logs) {
  const csvRows = [
    ['timestamp', 'event_type', 'message'],
    ...logs.map((log) => [log.time, log.label, log.msg]),
  ];
  const csvContent = csvRows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  triggerDownload(blob, `${EXPORT_FILENAME_PREFIX}_${Date.now()}.csv`);
}

/**
 * Dispatch to the correct export function based on format.
 * @param {'json' | 'csv'} format
 * @param {Array} logs
 */
export function exportLogs(format, logs) {
  if (format === 'json') {
    exportLogsAsJson(logs);
  } else if (format === 'csv') {
    exportLogsAsCsv(logs);
  }
}