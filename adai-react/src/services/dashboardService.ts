// ============================================================
// src/services/dashboardService.ts
// ============================================================

import api from '@/lib/api'
import type { AxiosResponse } from 'axios'
import type {
  KpiOverview,
  ExecutiveSummary,
  CtrTrend,
  CampaignAnalytics,
  TopAd,
  GeoTrafficCity,
  FraudAlert,
  ShapExplanation,
  SystemHealthService,
  Recommendation,
} from '@/types/dashboard'

const BASE = '/dashboard'

export const dashboardService = {
  getOverview: (): Promise<KpiOverview> =>
    api.get<KpiOverview>(`${BASE}/overview`).then((r: AxiosResponse<KpiOverview>) => r.data),

  getExecutiveSummary: (): Promise<ExecutiveSummary> =>
    api
      .get<ExecutiveSummary>(`${BASE}/executive-summary`)
      .then((r: AxiosResponse<ExecutiveSummary>) => r.data),

  getCtrTrend: (): Promise<CtrTrend> =>
    api.get<CtrTrend>(`${BASE}/ctr-trend`).then((r: AxiosResponse<CtrTrend>) => r.data),

  getCampaignAnalytics: (): Promise<CampaignAnalytics> =>
    api
      .get<CampaignAnalytics>(`${BASE}/campaign-analytics`)
      .then((r: AxiosResponse<CampaignAnalytics>) => r.data),

  getTopAds: (): Promise<TopAd[]> =>
    api.get<TopAd[]>(`${BASE}/top-ads`).then((r: AxiosResponse<TopAd[]>) => r.data),

  getGeoTraffic: (): Promise<GeoTrafficCity[]> =>
    api.get<GeoTrafficCity[]>(`${BASE}/geographic-traffic`).then((r: AxiosResponse<GeoTrafficCity[]>) => r.data),

  getFraudAlerts: (): Promise<FraudAlert[]> =>
    api.get<FraudAlert[]>(`${BASE}/fraud-alerts`).then((r: AxiosResponse<FraudAlert[]>) => r.data),

  getShapExplanations: (campaignId: string): Promise<ShapExplanation> =>
    api
      .get<ShapExplanation>(`${BASE}/explanations/${campaignId}`)
      .then((r: AxiosResponse<ShapExplanation>) => r.data),

  getSystemHealth: (): Promise<SystemHealthService[]> =>
    api
      .get<SystemHealthService[]>(`${BASE}/system-health`)
      .then((r: AxiosResponse<SystemHealthService[]>) => r.data),

  getRecommendations: (): Promise<Recommendation[]> =>
    api
      .get<Recommendation[]>(`${BASE}/recommendations`)
      .then((r: AxiosResponse<Recommendation[]>) => r.data),
}