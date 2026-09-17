// hooks/useRealTimeEventsWebSocket.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { LogEntry, RealTimeEventsWebSocketReturn } from '../types/realTimeEvents';
import {
  EVENT_TYPES,
  STATS_INTERVAL_MS,
  LOG_INTERVAL_MS,
  FRAUD_FLASH_DURATION_MS,
  MAX_LOG_ENTRIES,
  LATENCY_HISTORY_SIZE,
  EVENTS_PER_SEC_MIN,
  EVENTS_PER_SEC_MAX,
  EVENTS_PER_SEC_JITTER,
  KAFKA_LATENCY_MIN,
  KAFKA_LATENCY_MAX,
  KAFKA_LATENCY_JITTER,
  TOTAL_EVENTS_INCREMENT,
  INITIAL_LOGS,
  INITIAL_EVENTS_PER_SEC,
  INITIAL_TOTAL_EVENTS,
  INITIAL_KAFKA_LATENCY,
  INITIAL_LATENCY_HISTORY,
} from '../constants/realTimeEvents';
import { createSimulatedLogEntry } from '../utils/realTimeEventsHelpers';

/**
 * useRealTimeEventsWebSocket
 * ---------------------------------------------------------------------------
 * Owns the live-updating data stream for the Real-Time Events page.
 *
 * IMPORTANT — this currently simulates a live feed with two `setInterval`
 * timers (matching the original RealTimeEvents.jsx behavior exactly):
 *   - a "stats" tick every STATS_INTERVAL_MS that jitters eventsPerSec,
 *     kafkaLatency (and pushes into latencyHistory), and totalEvents
 *   - a "log" tick every LOG_INTERVAL_MS that appends one simulated
 *     CLICK/FRAUD/PRED/SHAP line to the terminal buffer
 *
 * This is named/shaped to match your other pages' useXWebSocket hooks
 * (useDashboardWebSocket, useCampaignsWebSocket) so that swapping this
 * simulation for a real `new WebSocket('/ws/realtime-events')` connection
 * later only requires changing the internals of this one file — every
 * consumer (useRealTimeEvents, and the page) stays untouched.
 *
 * @param isPaused - when true, both simulation ticks are no-ops (matches
 *                   the original Pause Stream button behavior).
 */
export function useRealTimeEventsWebSocket(isPaused: boolean): RealTimeEventsWebSocketReturn {
  const [eventsPerSec, setEventsPerSec] = useState<number>(INITIAL_EVENTS_PER_SEC);
  const [totalEvents, setTotalEvents] = useState<number>(INITIAL_TOTAL_EVENTS);
  const [kafkaLatency, setKafkaLatency] = useState<number>(INITIAL_KAFKA_LATENCY);
  const [latencyHistory, setLatencyHistory] = useState<number[]>(INITIAL_LATENCY_HISTORY);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [fraudCount, setFraudCount] = useState<number>(0);
  const [flashFraud, setFlashFraud] = useState<boolean>(false);

  // Stable reference to the event type registry, mirroring the original
  // useMemo — avoids re-creating the array on every render.
  const eventTypes = useMemo(() => EVENT_TYPES, []);

  /** Allows external callers (useRealTimeEvents) to zero the fraud badge. */
  const resetFraudCount = useCallback(() => {
    setFraudCount(0);
  }, []);

  // ---------------------------------------------------------------------
  // Stats simulation tick
  // ---------------------------------------------------------------------
  useEffect(() => {
    const statsTimer = setInterval(() => {
      if (isPaused) return;

      setEventsPerSec((prev) => {
        const diff = Math.floor((Math.random() - 0.5) * EVENTS_PER_SEC_JITTER);
        return Math.max(EVENTS_PER_SEC_MIN, Math.min(EVENTS_PER_SEC_MAX, prev + diff));
      });

      setKafkaLatency((prev) => {
        const diff = Math.floor((Math.random() - 0.5) * KAFKA_LATENCY_JITTER);
        const next = Math.max(KAFKA_LATENCY_MIN, Math.min(KAFKA_LATENCY_MAX, prev + diff));
        // Updated inline to avoid cascading setState in a separate effect,
        // matching the original implementation exactly.
        setLatencyHistory((h) => [...h.slice(-(LATENCY_HISTORY_SIZE - 1)), next]);
        return next;
      });

      setTotalEvents((prev) => +(prev + TOTAL_EVENTS_INCREMENT).toFixed(3));
    }, STATS_INTERVAL_MS);

    return () => clearInterval(statsTimer);
  }, [isPaused]);

  // ---------------------------------------------------------------------
  // Log simulation tick
  // ---------------------------------------------------------------------
  useEffect(() => {
    const logTimer = setInterval(() => {
      if (isPaused) return;

      const entry = createSimulatedLogEntry(eventTypes);

      if (entry.label === 'FRAUD') {
        setFraudCount((prev) => prev + 1);
        setFlashFraud(true);
        setTimeout(() => setFlashFraud(false), FRAUD_FLASH_DURATION_MS);
      }

      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOG_ENTRIES ? next.slice(next.length - MAX_LOG_ENTRIES) : next;
      });
    }, LOG_INTERVAL_MS);

    return () => clearInterval(logTimer);
  }, [isPaused, eventTypes]);

  return {
    eventsPerSec,
    totalEvents,
    kafkaLatency,
    latencyHistory,
    logs,
    fraudCount,
    flashFraud,
    resetFraudCount,
  };
}