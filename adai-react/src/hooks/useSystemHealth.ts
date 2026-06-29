// ============================================================
// src/hooks/useSystemHealth.ts
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  getServiceCards,
  getNFRBadges,
  getLatencyTrend,
  getKafkaThroughput,
  getAuditLog,
  deriveOverallStatus,
} from '@/services/systemHealthService'
import type {
  ServiceHealthResponse,
  NFRBadgeResponse,
  LatencyTrendResponse,
  KafkaThroughputResponse,
  AuditLogEntry,
} from '@/services/systemHealthService'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface SystemHealthState {
  services:       ServiceHealthResponse[]
  nfrBadges:      NFRBadgeResponse | null
  latencyTrend:   LatencyTrendResponse[]
  kafkaThroughput: KafkaThroughputResponse | null
  auditLog:       AuditLogEntry[]
  overallStatus:  'operational' | 'degraded' | 'outage'
  loading:        boolean
  error:          string | null
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE: SystemHealthState = {
  services:        [],
  nfrBadges:       null,
  latencyTrend:    [],
  kafkaThroughput: null,
  auditLog:        [],
  overallStatus:   'operational',
  loading:         true,
  error:           null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSystemHealth() {
  const [state, setState] = useState<SystemHealthState>(INITIAL_STATE)

  const fetchAll = useCallback(async () => {
    setState((prev: SystemHealthState) => ({ ...prev, loading: true, error: null }))

    try {
      const [
        services,
        nfrBadges,
        latencyTrend,
        kafkaThroughput,
        auditLog,
      ] = await Promise.all([
        getServiceCards(),
        getNFRBadges(),
        getLatencyTrend(),
        getKafkaThroughput(),
        getAuditLog(50),
      ])

      setState({
        services:        services        ?? [],
        nfrBadges:       nfrBadges       ?? null,
        latencyTrend:    latencyTrend    ?? [],
        kafkaThroughput: kafkaThroughput ?? null,
        auditLog:        auditLog        ?? [],
        overallStatus:   deriveOverallStatus(services ?? []),
        loading:         false,
        error:           null,
      })
    } catch (err) {
      setState((prev: SystemHealthState) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load system health data',
      }))
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { ...state, refreshSystemHealth: fetchAll }
}