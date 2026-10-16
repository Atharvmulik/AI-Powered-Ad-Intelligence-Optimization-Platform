// ============================================================
// src/hooks/useDashboard.ts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardService } from '@/services/dashboardService'
import type {
  DashboardState,
  WebSocketLivePayload,
  AiAdDecision,
  ModelIntelligence,
  CampaignOpportunity,
  CampaignOpportunityResponse,
} from '@/types/dashboard'

const INITIAL_STATE: DashboardState = {
  overview: null,
  executiveSummary: null,
  ctrTrend: null,
  campaignAnalytics: null,
  topAds: [],
  geoTraffic: [],
  fraudAlerts: [],
  infraStatus: [],
  recommendations: [],
  aiAdDecision: null,
  modelIntelligence: null,
  campaignOpportunities: [],
  loading: true,
  error: null,
  aiAdDecisionError: null,
  modelIntelligenceError: null,
  campaignOpportunitiesError: null,
}

const MAX_LIVE_CTR_POINTS = 60
const WS_RECONNECT_DELAY_MS = 4000
const WS_URL = `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'}/ws/dashboard/live`

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const formatLiveTimestamp = (timestamp: number | undefined): string => {
  if (!isFiniteNumber(timestamp)) {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const normalizedTimestamp = timestamp > 1e12 ? timestamp : timestamp * 1000
  return new Date(normalizedTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const appendLiveCtrPoint = (prev: DashboardState, ctr: number, timestamp: number | undefined): DashboardState => {
  const currentTrend = prev.ctrTrend ?? { ctr_values: [], timestamps: [] }
  const nextCtrValues = [...currentTrend.ctr_values, ctr]
  const nextTimestamps = [...currentTrend.timestamps, formatLiveTimestamp(timestamp)]

  if (nextCtrValues.length > MAX_LIVE_CTR_POINTS) {
    nextCtrValues.shift()
    nextTimestamps.shift()
  }

  return {
    ...prev,
    ctrTrend: {
      ...currentTrend,
      ctr_values: nextCtrValues,
      timestamps: nextTimestamps,
    },
  }
}

const normalizeCampaignOpportunities = (value: CampaignOpportunityResponse | CampaignOpportunity[] | null | undefined): CampaignOpportunity[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  return Array.isArray(value.opportunities) ? value.opportunities : []
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setState((prev: DashboardState) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const [
        overview,
        executiveSummary,
        ctrTrend,
        campaignAnalytics,
        topAds,
        geoTraffic,
        fraudAlerts,
        infraStatus,
        recommendations,
        aiAdDecision,
        modelIntelligence,
        campaignOpportunitiesResponse,
      ] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getExecutiveSummary(),
        dashboardService.getCtrTrend(),
        dashboardService.getCampaignAnalytics(),
        dashboardService.getTopAds(),
        dashboardService.getGeoTraffic(),
        dashboardService.getFraudAlerts(),
        dashboardService.getSystemHealth(),
        dashboardService.getRecommendations(),
        dashboardService.getAiAdDecision().catch((error) => {
          console.warn('AI decision endpoint failed:', error)
          return null
        }),
        dashboardService.getModelIntelligence().catch((error) => {
          console.warn('Model intelligence endpoint failed:', error)
          return null
        }),
        dashboardService.getCampaignOpportunities().catch((error) => {
          console.warn('Campaign opportunities endpoint failed:', error)
          return { opportunities: [] }
        }),
      ])

      setState({
        overview: overview ?? null,
        executiveSummary: executiveSummary ?? null,
        ctrTrend: ctrTrend ?? null,
        campaignAnalytics: campaignAnalytics ?? null,
        topAds: topAds ?? [],
        geoTraffic: geoTraffic ?? [],
        fraudAlerts: fraudAlerts ?? [],
        infraStatus: infraStatus ?? [],
        recommendations: recommendations ?? [],
        aiAdDecision: (aiAdDecision ?? null) as AiAdDecision | null,
        modelIntelligence: (modelIntelligence ?? null) as ModelIntelligence | null,
        campaignOpportunities: normalizeCampaignOpportunities(campaignOpportunitiesResponse),
        loading: false,
        error: null,
        aiAdDecisionError: aiAdDecision ? null : 'AI decision temporarily unavailable',
        modelIntelligenceError: modelIntelligence ? null : 'Live model intelligence temporarily unavailable',
        campaignOpportunitiesError: normalizeCampaignOpportunities(campaignOpportunitiesResponse).length > 0 ? null : null,
      })
    } catch (err) {
      setState((prev: DashboardState) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard data',
      }))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchAll()

    return () => {
      mountedRef.current = false
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [clearReconnectTimer, fetchAll])

  useEffect(() => {
    const refreshFraudAlerts = async () => {
      try {
        const fraudAlerts = await dashboardService.getFraudAlerts()
        setState((prev: DashboardState) => ({
          ...prev,
          fraudAlerts: fraudAlerts ?? [],
        }))
      } catch (error) {
        console.warn('Failed to refresh dashboard fraud alerts:', error)
      }
    }

    const intervalId = setInterval(refreshFraudAlerts, 5000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const refreshIntelligence = async () => {
      try {
        const [aiAdDecision, modelIntelligence, campaignOpportunitiesResponse] = await Promise.all([
          dashboardService.getAiAdDecision().catch(() => null),
          dashboardService.getModelIntelligence().catch(() => null),
          dashboardService.getCampaignOpportunities().catch(() => ({ opportunities: [] })),
        ])

        setState((prev: DashboardState) => ({
          ...prev,
          aiAdDecision: aiAdDecision ?? prev.aiAdDecision ?? null,
          modelIntelligence: modelIntelligence ?? prev.modelIntelligence ?? null,
          campaignOpportunities: normalizeCampaignOpportunities(campaignOpportunitiesResponse),
          aiAdDecisionError: aiAdDecision ? null : prev.aiAdDecisionError ?? 'AI decision temporarily unavailable',
          modelIntelligenceError: modelIntelligence ? null : prev.modelIntelligenceError ?? 'Live model intelligence temporarily unavailable',
          campaignOpportunitiesError: normalizeCampaignOpportunities(campaignOpportunitiesResponse).length > 0 ? null : prev.campaignOpportunitiesError,
        }))
      } catch (error) {
        console.warn('Failed to refresh dashboard intelligence:', error)
      }
    }

    const intervalId = setInterval(refreshIntelligence, 5000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!mountedRef.current) {
      return
    }

    const connectSocket = () => {
      if (!mountedRef.current) {
        return
      }

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return
      }

      try {
        const socket = new WebSocket(WS_URL)
        wsRef.current = socket

        socket.onopen = () => {
          if (!mountedRef.current) {
            return
          }

          clearReconnectTimer()
        }

        socket.onmessage = (event: MessageEvent) => {
          if (!mountedRef.current) {
            return
          }

          try {
            const payload = JSON.parse(String(event.data))

            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
              console.warn('Dashboard WebSocket ignored non-object payload:', payload)
              return
            }

            const live = payload as Partial<WebSocketLivePayload>

            setState((prev: DashboardState) => {
              let nextState = prev
              let didUpdateOverview = false
              let didUpdateCtrTrend = false

              if (prev.overview && (isFiniteNumber(live.events_per_second) || isFiniteNumber(live.active_users) || isFiniteNumber(live.ctr) || isFiniteNumber(live.revenue))) {
                const updatedOverview = { ...prev.overview }

                if (isFiniteNumber(live.events_per_second)) {
                  updatedOverview.events_per_second = live.events_per_second
                  didUpdateOverview = true
                }

                if (isFiniteNumber(live.active_users)) {
                  updatedOverview.active_users = live.active_users
                  didUpdateOverview = true
                }

                if (isFiniteNumber(live.ctr)) {
                  updatedOverview.ctr = live.ctr
                  didUpdateOverview = true
                }

                if (isFiniteNumber(live.revenue)) {
                  updatedOverview.revenue = live.revenue
                  didUpdateOverview = true
                }

                nextState = {
                  ...nextState,
                  overview: updatedOverview,
                }
              }

              if (isFiniteNumber(live.ctr)) {
                nextState = appendLiveCtrPoint(nextState, live.ctr, live.timestamp)
                didUpdateCtrTrend = true
              }

              if (!didUpdateOverview && !didUpdateCtrTrend) {
                return prev
              }

              return nextState
            })
          } catch (error) {
            console.warn('Dashboard WebSocket payload was malformed:', error)
          }
        }

        socket.onerror = () => {
          console.warn('Dashboard WebSocket error detected; reconnecting when the socket closes.')
        }

        socket.onclose = () => {
          if (!mountedRef.current) {
            return
          }

          wsRef.current = null
          clearReconnectTimer()
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectSocket()
            }
          }, WS_RECONNECT_DELAY_MS)
        }
      } catch (error) {
        console.warn('Dashboard WebSocket connection failed:', error)
        if (mountedRef.current) {
          clearReconnectTimer()
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectSocket()
            }
          }, WS_RECONNECT_DELAY_MS)
        }
      }
    }

    connectSocket()

    return () => {
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [clearReconnectTimer])

  return { ...state, refreshDashboard: fetchAll }
}