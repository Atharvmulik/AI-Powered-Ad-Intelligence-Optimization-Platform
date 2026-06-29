/**
 * types/audience.ts
 * ---------------------------------------------------------------------------
 * Shared TypeScript types for the Audience module.
 * Mirrors backend Pydantic schemas in backend/app/schemas/audience.py exactly.
 *
 * Currently duplicated inline in services/audienceService.ts — that file
 * should be updated to import from here instead of redeclaring these.
 */

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface AudienceOverviewResponse {
  total_addressable_reach: number
  avg_fraud_risk: string
  live_active_now: number
  top_performing_segment: string
  top_performing_segment_ctr: number
}

// ---------------------------------------------------------------------------
// Segment — Response / Create / Update
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Segment Listing
// ---------------------------------------------------------------------------

export interface PaginatedAudienceSegmentsResponse {
  items: AudienceSegmentResponse[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export type AudienceFraudRiskLevel = 'Low' | 'Medium' | 'High'
export type AudienceDeviceType = 'Mobile' | 'Desktop' | 'Tablet'
export type AudienceSegmentSortBy = 'avg_ctr' | 'growth_pct' | 'reach' | 'name'

export interface ListAudienceSegmentsParams {
  q?: string
  fraud_risk?: AudienceFraudRiskLevel
  device?: AudienceDeviceType
  sort_by?: AudienceSegmentSortBy
  page?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Demographics
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SHAP Insights
// ---------------------------------------------------------------------------

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
// WebSocket payload — WS /ws/audience/live
// ---------------------------------------------------------------------------

export interface AudienceLiveSnapshot {
  live_active_now: number
  timestamp: string
}