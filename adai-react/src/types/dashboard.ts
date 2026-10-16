// Domain types for dashboard API

export type KpiOverview = {
  total_clicks: number
  clicks_per_second: number
  ctr: number
  active_users: number
  events_per_second: number
  fraud_score: number
  revenue: number
}

export type ExecutiveInsight = { text: string; status?: 'up' | 'down' | 'neutral'; trend?: string }
export type ExecutiveSummary = { insights: ExecutiveInsight[]; insight_text?: string }

export type CtrTrend = { ctr_values: number[]; timestamps: string[] }

export type CampaignAnalytics = {
  impressions: number
  raw_clicks: number
  legit_clicks: number
  effective_ctr: number
  conversions: number
  conversion_rate: number
  revenue: number
  fraud_rate: number
}

export type TopAd = {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  ctr: number
  revenue: number
  spend: number
  roas: number
  fraud_clicks: number
}

export type GeoTrafficCity = {
  city: string
  traffic: number
  fraud_rate: number
  conversion_rate: number
  top_campaign?: string
}

export type FraudAlert = {
  ip_address: string
  timestamp: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string
  fraud_score: number
  fraud_category: string
  status: string
}

export type ShapFeature = { feature: string; impact: number; details?: string }
export type ShapExplanation = { features: ShapFeature[] }

export type SystemHealthService = {
  service_name: string
  status: 'healthy' | 'degraded' | 'down' | string
  latency_ms: number
  uptime: number
  last_heartbeat: string
}

export type Recommendation = { title: string; description?: string; priority?: string; action?: string }

export type AiAdDecision = {
  ad_id?: string | number | null
  campaign_id?: string | number | null
  campaign_name?: string | null
  ctr?: number | null
  ctr_change?: number | null
  fraud_risk?: number | null
  fraud_rate?: number | null
  conversion_rate?: number | null
  roas?: number | null
  decision?: string | null
  decision_score?: number | null
  recommended_action?: string | null
  reasons?: string[] | null
  timestamp?: string | null
}

export type ModelMetric = {
  name?: string | null
  status?: 'healthy' | 'degraded' | 'no_data' | string | null
  predictions?: number | null
  prediction_count?: number | null
  total_predictions?: number | null
  average?: number | null
  average_score?: number | null
  min?: number | null
  min_value?: number | null
  max?: number | null
  max_value?: number | null
  range?: { min?: number | null; max?: number | null } | null
  high_risk_count?: number | null
  critical_count?: number | null
  recommendations?: number | null
  recommendation_count?: number | null
  unique_ads?: number | null
  avg_score?: number | null
  [key: string]: unknown
}

export type ModelIntelligence = {
  timestamp?: string | null
  ctr_model?: ModelMetric | null
  fraud_model?: ModelMetric | null
  recommendation_engine?: ModelMetric | null
  [key: string]: unknown
}

export type CampaignOpportunity = {
  id?: string | number | null
  campaign_id?: string | number | null
  campaign_name?: string | null
  status?: string | null
  priority?: string | null
  ctr?: number | null
  conversion_rate?: number | null
  fraud_rate?: number | null
  roas?: number | null
  reason?: string | null
  recommended_action?: string | null
  [key: string]: unknown
}

export type CampaignOpportunityResponse = {
  timestamp?: string | null
  opportunities?: CampaignOpportunity[] | null
  [key: string]: unknown
}

export type WebSocketLivePayload = {
  timestamp: number
  event_type?: string
  message?: string
  events_per_second?: number
  active_users?: number
  ctr?: number
  revenue?: number
  fraud_alert_count?: number
  ai_decision?: AiAdDecision | null
  model_intelligence?: ModelIntelligence | null
  campaign_opportunities?: CampaignOpportunity[] | null
}

export type DashboardState = {
  overview: KpiOverview | null
  executiveSummary: ExecutiveSummary | null
  ctrTrend: CtrTrend | null
  campaignAnalytics: CampaignAnalytics | null
  topAds: TopAd[]
  geoTraffic: GeoTrafficCity[]
  fraudAlerts: FraudAlert[]
  infraStatus: SystemHealthService[]
  recommendations: Recommendation[]
  aiAdDecision: AiAdDecision | null
  modelIntelligence: ModelIntelligence | null
  campaignOpportunities: CampaignOpportunity[]
  loading: boolean
  error: string | null
  aiAdDecisionError: string | null
  modelIntelligenceError: string | null
  campaignOpportunitiesError: string | null
}
