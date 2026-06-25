// src/hooks/useCampaigns.ts

import { useState, useCallback } from 'react'
import { campaignsService } from '@/services/campaignsService'
import type { CampaignsState } from '@/types/campaigns'

const initialState: CampaignsState = {
  loading: false,
  error: null,
  livePerformance: null,
  campaigns: [],
  topAds: [],
  reports: [],
  scheduledReports: [],
  fraudFeed: null,
  fraudSummary: null,
  placementAgent: [],
  shapInsights: [],
}

export function useCampaigns() {
  const [state, setState] = useState<CampaignsState>(initialState)

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const requests = [
        campaignsService.getLivePerformance(),
        campaignsService.getCampaignIntelligence(),
        campaignsService.getTopAds(),
        campaignsService.getReports(),
        campaignsService.getScheduledReports(),
        campaignsService.getFraudFeed(),
        campaignsService.getFraudSummary(),
        campaignsService.getPlacementAgentLogs(),
        campaignsService.getShapInsights(),
      ]

      const settled = await Promise.allSettled(requests)

      const [
        livePerformanceResult,
        campaignsResult,
        topAdsResult,
        reportsResult,
        scheduledReportsResult,
        fraudFeedResult,
        fraudSummaryResult,
        placementAgentResult,
        shapInsightsResult,
      ] = settled

      const errors: string[] = []

      const livePerformance = livePerformanceResult.status === 'fulfilled' ? livePerformanceResult.value : null
      if (livePerformanceResult.status === 'rejected') errors.push(livePerformanceResult.reason?.message || 'livePerformance')

      const campaigns = campaignsResult.status === 'fulfilled' ? campaignsResult.value : []
      if (campaignsResult.status === 'rejected') errors.push(campaignsResult.reason?.message || 'campaigns')

      const topAds = topAdsResult.status === 'fulfilled' ? topAdsResult.value : []
      if (topAdsResult.status === 'rejected') errors.push(topAdsResult.reason?.message || 'topAds')

      const reports = reportsResult.status === 'fulfilled' ? reportsResult.value : []
      if (reportsResult.status === 'rejected') errors.push(reportsResult.reason?.message || 'reports')

      const scheduledReports = scheduledReportsResult.status === 'fulfilled' ? scheduledReportsResult.value : []
      if (scheduledReportsResult.status === 'rejected') errors.push(scheduledReportsResult.reason?.message || 'scheduledReports')

      const fraudFeed = fraudFeedResult.status === 'fulfilled' ? fraudFeedResult.value : null
      if (fraudFeedResult.status === 'rejected') errors.push(fraudFeedResult.reason?.message || 'fraudFeed')

      const fraudSummary = fraudSummaryResult.status === 'fulfilled' ? fraudSummaryResult.value : null
      if (fraudSummaryResult.status === 'rejected') errors.push(fraudSummaryResult.reason?.message || 'fraudSummary')

      const placementAgent = placementAgentResult.status === 'fulfilled' ? placementAgentResult.value : []
      if (placementAgentResult.status === 'rejected') errors.push(placementAgentResult.reason?.message || 'placementAgent')

      const shapInsights = shapInsightsResult.status === 'fulfilled' ? shapInsightsResult.value : []
      if (shapInsightsResult.status === 'rejected') errors.push(shapInsightsResult.reason?.message || 'shapInsights')

      setState({
        loading: false,
        error: errors.length ? `Some data failed to load: ${errors.join('; ')}` : null,
        livePerformance,
        campaigns,
        topAds,
        reports,
        scheduledReports,
        fraudFeed,
        fraudSummary,
        placementAgent,
        shapInsights,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load campaign data'
      setState(prev => ({ ...prev, loading: false, error: message }))
    }
  }, [])

  return { ...state, refetch: fetchAll }
}