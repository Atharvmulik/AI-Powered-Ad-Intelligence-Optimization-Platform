// Domain types for dashboard API

export type KpiOverview = {
  total_clicks: number
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
  campaign_name: string
  budget: number
  spend: number
  revenue: number
  ctr: number
  status?: string
}

export type TopAd = {
  campaign_id: string
  campaign_name: string
  impressions: number
  clicks: number
  ctr: number
  revenue: number
  spend?: number
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

export type WebSocketLivePayload = {
  timestamp: number
  event_type?: string
  message?: string
  events_per_second?: number
  active_users?: number
  ctr?: number
  revenue?: number
  fraud_alert_count?: number
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
  loading: boolean
  error: string | null
}
