// ============================================================
// src/types/adManagement.ts
// ============================================================

// ---------------------------------------------------------------------------
// Backend response types (match exactly what FastAPI returns)
// ---------------------------------------------------------------------------

export interface Campaign {
  campaign_id: number
  advertiser_id: string
  campaign_name: string
  ad_format: string
  bid_strategy: string
  budget: number
  spend: number
  revenue: number
  ctr: number
  status: string
  fraud_risk: string
  engagement_pct: number
  target_demographics: string[]
  start_date: string | null
  end_date: string | null
  thumbnail_url: string | null
}

export interface CampaignCreatePayload {
  campaign_name: string
  daily_budget: number
  ad_format: string
  start_date: string
  end_date: string
  bid_strategy: string
  target_demographics: string[]
  category: string
  keywords: string[]
  image_url?: string | null
}

export interface NetworkHealth {
  score: number
  label: string
  narrative: string
}

export interface OptimizationFeedItem {
  id: string
  title: string
  description: string
  icon_type: string
  recommended_action: string
  priority: string
}

export interface ApplyActionResponse {
  success: boolean
  message: string
  applied_at: string
}

export interface GlobalStatus {
  running_pct: number
  paused_pct: number
  expired_pct: number
}

export interface AnalysisLogMessage {
  log_type: string
  message: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Frontend adapted types (what components actually receive)
// ---------------------------------------------------------------------------

export interface AdaptedCampaign {
  id: string
  name: string
  subtitle: string
  ctr: string
  status: string
  fraudRisk: string
  engagement: number
  logo: CampaignLogo
}

export interface CampaignLogo {
  type: 'image' | 'icon'
  alt?: string
  src?: string
  icon?: string
  wrapperClass: string
}

export interface AdaptedNetworkHealth {
  score: number
  label: string
  quote: string
  gaugeOffset: number
}

export interface AdaptedOptimizationItem {
  id: string
  icon: string
  iconColor: string
  title: string
  description: string
  actionLabel?: string
  note?: string
}

export interface AdaptedGlobalStatusSegment {
  label: string
  percent: string
  dotClass: string
  strokeColor: string
  dashoffset: number
}

export interface AdaptedLogEntry {
  time: string
  type: string
  msg: string
  color: string
}