// src/types/campaigns.ts

export interface LivePerformance {
  events_per_second: number
  active_users: number
  fraud_blocked_today: number
  avg_latency_ms: number
  ctr_history: number[]
  fraud_rate_history: number[]
  timestamps: string[]
}

export interface CampaignIntelligenceItem {
  campaign_id: number
  campaign_name: string
  raw_clicks: number
  clean_clicks: number
  fraud_filtered: number
  budget: number
  spend: number
  roas: number
  cpa: number
  status: string
  fraud_risk: string
  channel: string
  campaign_type: string
}

export interface TopAd {
  ad_id: string
  campaign_name: string
  format: string
  ctr: number
  revenue: number
}

export interface Report {
  report_id: number
  title: string
  report_type: string
  pages: number
  size_mb: number
  file_path: string
  created_at: string
}

export interface ScheduledReport {
  schedule_id: number
  name: string
  frequency: string
  next_run: string
  enabled: boolean
}

export interface FraudEvent {
  event_id: number
  timestamp: string
  ip_address: string
  fraud_score: number
  fraud_category: string
  status: string
  severity: string
}

export interface FraudFeed {
  period: string
  events: FraudEvent[]
}

export interface FraudSummary {
  period: string
  blocked: number
  precision: number
  recall: number
  budget_saved: number
  clean_percent: number
  suspicious_percent: number
  blocked_percent: number
}

export interface PlacementAgentLog {
  action: string
  expected_reward: number
  episode: number
  created_at: string
}

export interface ShapInsight {
  campaign_id: number
  campaign_name: string
  feature_name: string
  shap_value: number
  predicted_ctr: number
  auc_score: number
}

export interface WebSocketLivePayload {
  events_per_second: number
  active_users: number
  fraud_blocked_today: number
  avg_latency_ms: number
  timestamp: string
}

export interface CampaignsState {
  loading: boolean
  error: string | null
  livePerformance: LivePerformance | null
  campaigns: CampaignIntelligenceItem[]
  topAds: TopAd[]
  reports: Report[]
  scheduledReports: ScheduledReport[]
  fraudFeed: FraudFeed | null
  fraudSummary: FraudSummary | null
  placementAgent: PlacementAgentLog[]
  shapInsights: ShapInsight[]
}