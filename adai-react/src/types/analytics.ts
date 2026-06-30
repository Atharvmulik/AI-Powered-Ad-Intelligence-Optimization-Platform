// src/types/analytics.ts

export interface PlacementPerformanceItem {
  placement: string;
  impressions: number;
  ctr: number;
  revenue: number;
  performance_percentage: number;
  is_best: boolean;
}

export interface PlacementPerformanceResponse {
  placements: PlacementPerformanceItem[];
}

// src/types/analytics.ts

export interface PlacementPerformanceItem {
  placement: string;
  impressions: number;
  ctr: number;
  revenue: number;
  performance_percentage: number;
  is_best: boolean;
}

export interface PlacementPerformanceResponse {
  placements: PlacementPerformanceItem[];
}

export interface OverviewResponse {
  active_users: number;
  events_per_second: number;
  avg_bid_latency: number;
  fraud_rate: number;
  previous_active_users: number;
  previous_events_per_second: number;
  previous_avg_bid_latency: number;
  previous_fraud_rate: number;
}

export interface AiGrowthPredictionResponse {
  prediction_accuracy: number;
  recommendation_score: number;
  fraud_probability: number;
  click_probability: number;
  growth_forecast: number;
  confidence: number;
  model_version: string;
}
// APPEND to src/types/analytics.ts

export interface TerminalLog {
  timestamp: string;
  message: string;
  type: string;
  status: string;
}

export interface AnalyticsTerminalResponse {
  logs: TerminalLog[];
}
// APPEND to src/types/analytics.ts

export interface CampaignPerformanceItem {
  campaign_name: string;
  advertiser: string;
  raw_clicks: number;
  fraud_filtered: number;
  effective_ctr: number;
  spend: number;
  roas: number;
  status: string;
}

export interface CampaignPerformanceResponse {
  campaigns: CampaignPerformanceItem[];
}

export interface ClickDistributionChannel {
  label: string;
  percentage: number;
  clicks: number;
}

export interface ClickDistributionResponse {
  total_clicks: number;
  channels: ClickDistributionChannel[];
}

// APPEND to src/types/analytics.ts

export interface ConversionFunnelResponse {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_events: number;
  click_rate: number;
  conversion_rate: number;
  revenue_rate: number;
  impression_drop: number;
  click_drop: number;
  conversion_drop: number;
}

// APPEND to src/types/analytics.ts

export interface DeviceItem {
  device_type: string;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
  trend_value: string;
}

export interface DeviceSplitResponse {
  devices: DeviceItem[];
}

export interface EngagementResponse {
  average_session_duration: number;
  bounce_rate: number;
  returning_users: number;
  engagement_score: number;
}

export interface FraudEventItem {
  timestamp: string;
  ip_address: string;
  fraud_score: number;
  category: string;
  action: string;
  severity: string;
}

export interface FraudMonitorResponse {
  blocked_today: number;
  flagged: number;
  clean: number;
  events: FraudEventItem[];
}
// APPEND to src/types/analytics.ts

export interface CTRTrendPoint {
  timestamp: string;
  ctr: number;
}

export interface CTRTrendResponse {
  current_ctr: number;
  target_ctr: number;
  points: CTRTrendPoint[];
}

export interface ScheduleExportRequest {
  email: string;
  day: string;
  format: string;
}
// APPEND to src/types/analytics.ts

export interface TopAd {
  rank: number;
  campaign: string;
  brand: string;
  category: string;
  status: string;
  ctr: number;
  revenue: number;
}

export interface UserInterest {
  name: string;
  percentage: number;
}

export interface UserInterestResponse {
  interests: UserInterest[];
}