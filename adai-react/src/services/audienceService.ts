/**
 * AudienceService.ts
 * ---------------------------------------------------------------------------
 * REST client for the Audience module backend (/api/v1/audience/*).
 *
 * WebSocket live updates (/ws/audience/live) are handled separately in
 * useAudienceWebSocket.ts, matching the dashboard/campaigns split between
 * <feature>Service.ts (REST) and use<Feature>WebSocket.ts (WS).
 *
 * Types are defined inline here pending extraction into types/audience.ts,
 * mirroring types/dashboard.ts / types/campaigns.ts once that file exists.
 */

import api from '../lib/api'

// ---------------------------------------------------------------------------
// Types — mirror backend Pydantic schemas in schemas/audience.py exactly
// ---------------------------------------------------------------------------

export interface AudienceOverviewResponse {
  total_addressable_reach: number
  avg_fraud_risk: string
  live_active_now: number
  top_performing_segment: string
  top_performing_segment_ctr: number
}

export interface AudienceSegmentResponse {
  id: number
  name: string
  subtitle: string | null
  icon_name: string
  reach: number
  growth_pct: number
  device_mobile_pct: number
  device_desktop_pct: number
  device_tablet_pct: number
  fraud_risk_level: string
  avg_ctr: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AudienceSegmentCreate {
  name: string
  subtitle?: string | null
  icon_name?: string
  reach?: number
  growth_pct?: number
  device_mobile_pct?: number
  device_desktop_pct?: number
  device_tablet_pct?: number
  fraud_risk_level?: string
  avg_ctr?: number
  tags?: string[]
  is_active?: boolean
}

export type AudienceSegmentUpdate = Partial<AudienceSegmentCreate>

export interface PaginatedAudienceSegmentsResponse {
  items: AudienceSegmentResponse[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface ListAudienceSegmentsParams {
  q?: string
  fraud_risk?: 'Low' | 'Medium' | 'High'
  device?: 'Mobile' | 'Desktop' | 'Tablet'
  sort_by?: 'avg_ctr' | 'growth_pct' | 'reach' | 'name'
  page?: number
  limit?: number
}

export interface GenderBreakdown {
  male_pct: number
  female_pct: number
  other_pct: number
}

export interface AgeBreakdown {
  label: string
  percentage: number
}

export interface DeviceBreakdown {
  mobile_pct: number
  desktop_pct: number
  tablet_pct: number
}

export interface AudienceDemographicsResponse {
  gender: GenderBreakdown
  age_groups: AgeBreakdown[]
  device: DeviceBreakdown
}

export interface AudienceInsightFeatureItem {
  feature: string
  contribution: number
}

export interface AudienceInsightResponse {
  segment_id: number
  segment_name: string
  features: AudienceInsightFeatureItem[]
  recommended_because: string
}

export interface AudienceInsightsListResponse {
  insights: AudienceInsightResponse[]
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const BASE_URL = '/api/v1/audience'

const AudienceService = {
  /**
   * GET /api/v1/audience/overview
   * Four header KPI cards: reach, fraud risk, live active, top segment.
   */
  async getOverview(): Promise<AudienceOverviewResponse> {
    const response = await api.get<AudienceOverviewResponse>(`${BASE_URL}/overview`)
    return response.data
  },

  /**
   * GET /api/v1/audience/segments
   * Paginated, filterable, sortable segment list for AudienceSegmentsTable.
   */
  async listSegments(
    params: ListAudienceSegmentsParams = {}
  ): Promise<PaginatedAudienceSegmentsResponse> {
    const response = await api.get<PaginatedAudienceSegmentsResponse>(`${BASE_URL}/segments`, {
      params,
    })
    return response.data
  },

  /**
   * GET /api/v1/audience/segments/insights
   * SHAP-style feature contribution cards for the top performing segments.
   * Registered before getSegment() calls in usage order to mirror the
   * backend's route-ordering note (insights vs /{segment_id}).
   */
  async getSegmentInsights(limit = 3): Promise<AudienceInsightsListResponse> {
    const response = await api.get<AudienceInsightsListResponse>(
      `${BASE_URL}/segments/insights`,
      { params: { limit } }
    )
    return response.data
  },

  /**
   * GET /api/v1/audience/segments/{id}
   */
  async getSegment(segmentId: number): Promise<AudienceSegmentResponse> {
    const response = await api.get<AudienceSegmentResponse>(
      `${BASE_URL}/segments/${segmentId}`
    )
    return response.data
  },

  /**
   * POST /api/v1/audience/segments
   */
  async createSegment(payload: AudienceSegmentCreate): Promise<AudienceSegmentResponse> {
    const response = await api.post<AudienceSegmentResponse>(`${BASE_URL}/segments`, payload)
    return response.data
  },

  /**
   * PUT /api/v1/audience/segments/{id}
   */
  async updateSegment(
    segmentId: number,
    payload: AudienceSegmentUpdate
  ): Promise<AudienceSegmentResponse> {
    const response = await api.put<AudienceSegmentResponse>(
      `${BASE_URL}/segments/${segmentId}`,
      payload
    )
    return response.data
  },

  /**
   * DELETE /api/v1/audience/segments/{id}
   */
  async deleteSegment(segmentId: number): Promise<void> {
    await api.delete(`${BASE_URL}/segments/${segmentId}`)
  },

  /**
   * GET /api/v1/audience/demographics
   * Combined Gender / Age / Device breakdown for AudienceDemographicsPanel.
   */
  async getDemographics(): Promise<AudienceDemographicsResponse> {
    const response = await api.get<AudienceDemographicsResponse>(`${BASE_URL}/demographics`)
    return response.data
  },
}

export default AudienceService