/**
 * systemHealthService.ts
 *
 * Axios service layer for the System Health module.
 * Mirrors the structure and conventions of dashboardService.ts exactly.
 *
 * All functions are async, return typed response objects, and delegate
 * HTTP transport to the shared `api` axios instance from src/lib/api.ts.
 * Error handling is intentionally left to the caller (hooks / components).
 */

import api from '../lib/api'

// ---------------------------------------------------------------------------
// Response types — mirror app/schemas/system_health.py exactly
// ---------------------------------------------------------------------------

export interface ServiceHealthResponse {
  service_name:   string
  status:         string       // 'Healthy' | 'Degraded' | 'Down'
  uptime:         number       // 0–100 %
  latency_ms:     number       // ms
  last_heartbeat: string       // ISO-8601 datetime string
}

export interface NFRBadgeResponse {
  bid_engine_sla:    number    // ms  — target < 100
  ml_sla:            number    // ms  — target < 30
  dashboard_sla:     number    // s   — target < 3
  bid_engine_status: string    // 'OK' | 'WARNING' | 'BREACH'
  ml_status:         string
  dashboard_status:  string
}

export interface LatencyTrendResponse {
  region:          string      // 'EU-CENTRAL-1' | 'US-EAST-1'
  timestamps:      string[]    // HH:MM strings, hourly buckets
  latency_p99_ms:  number[]    // P99 latency per bucket
}

export interface KafkaThroughputResponse {
  events_per_second: number
  target:            number    // 10 000 in dev
  above_target:      boolean
}

export interface AuditLogEntry {
  timestamp:    string         // ISO-8601 datetime string
  service_name: string
  level:        string         // 'INFO' | 'WARN' | 'ERROR' | 'TRACE' | 'RUNNING'
  message:      string
}

export interface SystemLiveUpdate {
  events_per_second: number
  active_alerts:     number
  ml_latency:        number    // ms
  timestamp:         string    // ISO-8601 datetime string
}

// ---------------------------------------------------------------------------
// Base path — matches router prefix in app/api/v1/system_health.py
// ---------------------------------------------------------------------------

const BASE = '/system-health'

// ---------------------------------------------------------------------------
// 1. Service Health Cards
// ---------------------------------------------------------------------------

/**
 * Fetch the latest heartbeat record for every registered infrastructure
 * service (Core API, Kafka Cluster, Redis Cache, ML Inference,
 * Fraud Detection, PostgreSQL).  Results are sorted alphabetically.
 *
 * Endpoint: GET /api/v1/system-health/services
 */
export const getServiceCards = async (): Promise<ServiceHealthResponse[]> => {
  const res = await api.get(`${BASE}/services`)
  return res.data as ServiceHealthResponse[]
}

// ---------------------------------------------------------------------------
// 2. NFR Badges
// ---------------------------------------------------------------------------

/**
 * Fetch the three NFR SLA badge values shown at the top of the page:
 * Bid Response (< 100 ms), ML Inference (< 30 ms), Dashboard Lag (< 3 s).
 *
 * Endpoint: GET /api/v1/system-health/nfr-badges
 */
export const getNFRBadges = async (): Promise<NFRBadgeResponse> => {
  const res = await api.get(`${BASE}/nfr-badges`)
  return res.data as NFRBadgeResponse
}

// ---------------------------------------------------------------------------
// 3. Global Latency Trend (P99)
// ---------------------------------------------------------------------------

/**
 * Fetch P99 latency time-series for each deployment region over the
 * last 12 hours in hourly buckets.  Returns one entry per region.
 *
 * Endpoint: GET /api/v1/system-health/latency-trend
 */
export const getLatencyTrend = async (): Promise<LatencyTrendResponse[]> => {
  const res = await api.get(`${BASE}/latency-trend`)
  return res.data as LatencyTrendResponse[]
}

// ---------------------------------------------------------------------------
// 4. Kafka Event Throughput
// ---------------------------------------------------------------------------

/**
 * Fetch the current Kafka pipeline throughput in events per second,
 * the configured dev target (10 000 events/s), and the above-target flag.
 *
 * Endpoint: GET /api/v1/system-health/kafka-throughput
 */
export const getKafkaThroughput = async (): Promise<KafkaThroughputResponse> => {
  const res = await api.get(`${BASE}/kafka-throughput`)
  return res.data as KafkaThroughputResponse
}

// ---------------------------------------------------------------------------
// 5. Live Audit Log
// ---------------------------------------------------------------------------

/**
 * Fetch the most recent structured audit log entries ordered by
 * timestamp descending.
 *
 * @param limit - Maximum number of entries to return (default 50, max 200).
 *
 * Endpoint: GET /api/v1/system-health/audit-log?limit={limit}
 */
export const getAuditLog = async (limit = 50): Promise<AuditLogEntry[]> => {
  const res = await api.get(`${BASE}/audit-log`, { params: { limit } })
  return res.data as AuditLogEntry[]
}

// ---------------------------------------------------------------------------
// 6. Derive overall system status from service cards
// ---------------------------------------------------------------------------

/**
 * Pure helper — derives the "All Systems Operational" / degraded /
 * outage label from the service card list returned by getServiceCards().
 * No network call; call after getServiceCards() resolves.
 *
 * @param services - Array from getServiceCards()
 * @returns 'operational' | 'degraded' | 'outage'
 */
export const deriveOverallStatus = (
  services: ServiceHealthResponse[],
): 'operational' | 'degraded' | 'outage' => {
  if (services.some(s => s.status === 'Down'))      return 'outage'
  if (services.some(s => s.status === 'Degraded'))  return 'degraded'
  return 'operational'
}