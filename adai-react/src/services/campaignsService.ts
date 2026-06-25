// src/services/campaignsService.ts

import api from '@/lib/api'
import type {
  LivePerformance,
  CampaignIntelligenceItem,
  TopAd,
  Report,
  ScheduledReport,
  FraudFeed,
  FraudSummary,
  PlacementAgentLog,
  ShapInsight,
} from '@/types/campaigns'

export const campaignsService = {
  async getLivePerformance(): Promise<LivePerformance> {
    const res = await api.get<LivePerformance>('/campaigns/live-overview')
    return res.data
  },

  async getCampaignIntelligence(): Promise<CampaignIntelligenceItem[]> {
    const res = await api.get<CampaignIntelligenceItem[]>('/campaigns/intelligence')
    return res.data
  },

  async getTopAds(): Promise<TopAd[]> {
    const res = await api.get<TopAd[]>('/campaigns/top-ads')
    return res.data
  },

  async getReports(): Promise<Report[]> {
    const res = await api.get<Report[]>('/campaigns/reports')
    return res.data
  },

  async getScheduledReports(): Promise<ScheduledReport[]> {
    const res = await api.get<ScheduledReport[]>('/campaigns/scheduled-reports')
    return res.data
  },

  async getFraudFeed(): Promise<FraudFeed> {
    const res = await api.get<FraudFeed>('/campaigns/fraud-feed')
    return res.data
  },

  async getFraudSummary(): Promise<FraudSummary> {
    const res = await api.get<FraudSummary>('/campaigns/fraud-summary')
    return res.data
  },

  async getPlacementAgentLogs(): Promise<PlacementAgentLog[]> {
    const res = await api.get<PlacementAgentLog[]>('/campaigns/placement-agent')
    return res.data
  },

  async getShapInsights(): Promise<ShapInsight[]> {
    const res = await api.get<ShapInsight[]>('/campaigns/shap-insights')
    return res.data
  },
}