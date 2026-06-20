// ============================================================
// src/hooks/useDashboard.ts
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/services/dashboardService'
import type { DashboardState } from '@/types/dashboard'

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
  loading: true,
  error: null,
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)

  const fetchAll = useCallback(async () => {
    setState((prev: DashboardState) => ({ ...prev, loading: true, error: null }))

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
      ])

      console.log('Campaign Analytics Response', campaignAnalytics)

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
        loading: false,
        error: null,
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
    fetchAll()
  }, [fetchAll])

  return { ...state, refreshDashboard: fetchAll }
}