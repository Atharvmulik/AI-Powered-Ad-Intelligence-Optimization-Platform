// ============================================================
// src/types/dashboard.ts
// ============================================================

export interface KpiOverview {
  total_clicks: number
  ctr: number
  active_users: number
  fraud_score: number
  revenue: number
  events_per_second: number
}

export interface ExecutiveSummaryInsight {
  text: string
  status: 'up' | 'down' | 'neutral'
  trend: string
}

export interface ExecutiveSummary {
  insight_text: string
  insights: ExecutiveSummaryInsight[]
}

export interface CtrTrend {
  timestamps: string[]
  ctr_values: number[]
}

export interface CampaignAnalytics {
  raw_clicks: number
  fraud_filtered_clicks: number
  effective_ctr: number
  conversions: number
  revenue: number
}

export interface TopAd {
  campaign_name: string
  ctr: number
  clicks: number
  revenue: number
  spend: number
  roas: number
  fraud_clicks: number
}

export interface GeoTrafficCity {
  city: string
  traffic: number
  fraud_rate: number
  conversion_rate: number
  top_campaign: string
}

export interface FraudAlert {
  ip_address: string
  fraud_score: number
  fraud_category: string
  status: string
  severity: string
  timestamp: string
}

export interface ShapFeature {
  feature: string
  impact: number
  details: string
}

export interface ShapExplanation {
  campaign_name: string
  features: ShapFeature[]
}

export interface SystemHealthService {
  service_name: string
  status: string
  uptime: number
  latency_ms: number
  last_heartbeat: string
}

export interface Recommendation {
  title: string
  description: string
  priority: string
  action: string
}

export interface WebSocketLivePayload {
  events_per_second: number
  active_users: number
  ctr: number
  fraud_alert_count: number
  revenue: number
  timestamp: string
}

export interface DashboardState {
  overview: KpiOverview | null
  executiveSummary: ExecutiveSummary | null
  ctrTrend: CtrTrend | null
  campaignAnalytics: CampaignAnalytics | null
  topAds: TopAd[]
  geoTraffic: GeoTrafficCity[]
  fraudAlerts: FraudAlert[]
  infraStatus: SystemHealthService[]
  recommendations: Recommendation[]
  loading: boolean
  error: string | null
}

export interface TerminalLogEntry {
  time: string
  module: string
  msg: string
  color: string
}