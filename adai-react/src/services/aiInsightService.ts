// ============================================================
// src/services/aiInsightService.ts
// ============================================================

import api from '@/lib/api'
import type { AxiosResponse } from 'axios'
import { AI_INSIGHT_ENDPOINTS } from '@/lib/aiinsight'
import type {
  OverviewResponse,
  ModelStatusResponse,
  PredictionResponse,
  ShapResponse,
  RecommendationResponse,
  AudienceResponse,
  InfrastructureResponse,
  CampaignInsightResponse,
} from '@/types/aiinsight'

export interface GetPredictionsParams {
  limit?: number
}

export interface GetShapParams {
  campaign_id?: number
  limit?: number
}

export interface GetRecommendationsParams {
  limit?: number
}

export interface GetAudienceSegmentsParams {
  top_features_limit?: number
}

export const aiInsightService = {
  getOverview: (signal?: AbortSignal): Promise<OverviewResponse> =>
    api
      .get<OverviewResponse>(AI_INSIGHT_ENDPOINTS.overview, { signal })
      .then((r: AxiosResponse<OverviewResponse>) => r.data),

  getModelStatus: (signal?: AbortSignal): Promise<ModelStatusResponse> =>
    api
      .get<ModelStatusResponse>(AI_INSIGHT_ENDPOINTS.modelStatus, { signal })
      .then((r: AxiosResponse<ModelStatusResponse>) => r.data),

  getPredictions: (params: GetPredictionsParams = {}, signal?: AbortSignal): Promise<PredictionResponse> =>
    api
      .get<PredictionResponse>(AI_INSIGHT_ENDPOINTS.predictions, { params, signal })
      .then((r: AxiosResponse<PredictionResponse>) => r.data),

  getShap: (params: GetShapParams = {}, signal?: AbortSignal): Promise<ShapResponse> =>
    api
      .get<ShapResponse>(AI_INSIGHT_ENDPOINTS.shap, { params, signal })
      .then((r: AxiosResponse<ShapResponse>) => r.data),

  getRecommendations: (
    params: GetRecommendationsParams = {},
    signal?: AbortSignal
  ): Promise<RecommendationResponse> =>
    api
      .get<RecommendationResponse>(AI_INSIGHT_ENDPOINTS.recommendations, { params, signal })
      .then((r: AxiosResponse<RecommendationResponse>) => r.data),

  getAudienceSegments: (
    params: GetAudienceSegmentsParams = {},
    signal?: AbortSignal
  ): Promise<AudienceResponse> =>
    api
      .get<AudienceResponse>(AI_INSIGHT_ENDPOINTS.audienceSegments, { params, signal })
      .then((r: AxiosResponse<AudienceResponse>) => r.data),

  getInfrastructure: (signal?: AbortSignal): Promise<InfrastructureResponse> =>
    api
      .get<InfrastructureResponse>(AI_INSIGHT_ENDPOINTS.infrastructure, { signal })
      .then((r: AxiosResponse<InfrastructureResponse>) => r.data),

  getCampaignInsight: (campaignId: number | string, signal?: AbortSignal): Promise<CampaignInsightResponse> =>
    api
      .get<CampaignInsightResponse>(AI_INSIGHT_ENDPOINTS.campaignInsight(campaignId), { signal })
      .then((r: AxiosResponse<CampaignInsightResponse>) => r.data),
}