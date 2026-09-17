// types/realTimeEvents.ts

/**
 * Types for the Real-Time Events page.
 *
 * NOTE: The current implementation simulates all data client-side via
 * setInterval (see hooks/useRealTimeEventsWebSocket.ts). These types are
 * shaped to match that simulation exactly today, but are also what the
 * real REST/WebSocket payloads should conform to once this page is wired
 * to the actual backend (see services/realTimeEventsService.ts).
 */

/** The four kinds of events that can appear in the live terminal. */
export type EventLabel = 'CLICK' | 'FRAUD' | 'PRED' | 'SHAP';

/** Supported export file formats for the Export Logs menu. */
export type ExportFormat = 'json' | 'csv';

/** Tailwind color token used for both the label and (sometimes) the message text. */
export type ColorToken = string;

/**
 * Static configuration for a single event type: how it's labeled, colored,
 * and what message pattern is used to generate a simulated log line.
 * The `pattern` string uses `{}` placeholders filled in at generation time.
 */
export interface EventTypeConfig {
  label: EventLabel;
  color: ColorToken;
  msgColor: ColorToken;
  pattern: string;
}

/** A single rendered line in the event terminal. */
export interface LogEntry {
  time: string;
  label: EventLabel;
  msg: string;
  color: ColorToken;
  msgColor: ColorToken;
}

/** Per-type tally used to render the Event Distribution bar chart. */
export interface EventCounts {
  CLICK: number;
  FRAUD: number;
  PRED: number;
  SHAP: number;
}

/** Derived visual state for the "Kafka Status" badge. */
export interface KafkaStatusInfo {
  text: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  color: ColorToken;
  dotColor: ColorToken;
  borderColor: ColorToken;
}

/** Generic status badge shape shared by ML Pipeline / Fraud Engine / Redis Cache. */
export interface StaticStatusInfo {
  label: string;
  value: string;
  dotColor: ColorToken;
  valueColor: ColorToken;
  borderColor: ColorToken;
  tooltip: string;
  pulse?: boolean;
}

/** SVG path data generated from the rolling latency history for the sparkline. */
export interface LatencyPathData {
  linePath: string;
  areaPath: string;
}

/**
 * Everything the live-updating simulation (or, later, the real WebSocket)
 * produces on each tick.
 */
export interface RealTimeEventsLiveState {
  eventsPerSec: number;
  totalEvents: number; // in millions, e.g. 72.406
  kafkaLatency: number; // ms
  latencyHistory: number[];
  logs: LogEntry[];
  fraudCount: number;
  flashFraud: boolean;
}

/**
 * Full return shape of useRealTimeEventsWebSocket: the live simulated
 * state plus the one control function the page needs to reset the
 * fraud counter (kept separate from RealTimeEventsLiveState since that
 * type represents pure data, not actions).
 */
export interface RealTimeEventsWebSocketReturn extends RealTimeEventsLiveState {
  resetFraudCount: () => void;
}

/** Static content for the "Nodes Active" info card. */
export interface NodesInfo {
  healthyNodes: number;
  totalNodes: number;
  region: string;
}

/** Static content for the "Latest AI Patch" info card. */
export interface PatchInfo {
  version: string;
  deployedMinutesAgo: number;
  description: string;
}