// ============================================================
// src/types/aiinsight.ts
//
// Mirrors app/schemas/aiinsight.py field-for-field. Follows the same
// conventions as src/types/dashboard.ts.
// ============================================================

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface OverviewResponse {
  total_predictions: number
  average_ctr_prediction: number
  average_fraud_probability: number
  average_recommendation_score: number
  active_models: number
  last_updated: string
}

// ---------------------------------------------------------------------------
// Model Status
// ---------------------------------------------------------------------------

export interface ModelStatusItem {
  model_name: string
  model_version: string
  status: string
  predictions_today: number
  average_latency: number
  uptime: number
  accuracy: number | null
  last_prediction_time: string
}

export interface ModelStatusResponse {
  models: ModelStatusItem[]
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

export interface PredictionItem {
  timestamp: string
  campaign_name: string | null
  ad_id: string
  click_probability: number
  fraud_probability: number
  recommendation_score: number
  model_version: string
  inference_latency_ms: number
}

export interface PredictionResponse {
  predictions: PredictionItem[]
}

// ---------------------------------------------------------------------------
// SHAP Insights
// ---------------------------------------------------------------------------

export interface ShapFeatureItem {
  campaign_name: string | null
  feature_name: string
  shap_value: number
  predicted_ctr: number
  auc_score: number
  created_at: string
}

export interface ShapResponse {
  features: ShapFeatureItem[]
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export interface RecommendationItem {
  campaign_name: string | null
  ad_id: string
  recommendation_score: number
  explanation: string | null
  timestamp: string
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[]
}

// ---------------------------------------------------------------------------
// Audience Insights
// ---------------------------------------------------------------------------

export interface AudienceInsightItem {
  segment_name: string
  subtitle: string | null
  icon: string | null
  reach: number
  growth_pct: number
  mobile_pct: number
  desktop_pct: number
  tablet_pct: number
  fraud_risk: string | null
  avg_ctr: number
  tags: string[]
  top_features: string[]
}

export interface AudienceResponse {
  segments: AudienceInsightItem[]
}

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

export interface InfrastructureItem {
  service_name: string
  status: string
  uptime: number
  latency: number
  heartbeat: string
}

export interface InfrastructureResponse {
  services: InfrastructureItem[]
}

// ---------------------------------------------------------------------------
// Campaign Insight (single campaign deep-dive)
// ---------------------------------------------------------------------------

export interface CampaignInsightResponse {
  campaign_name: string
  budget: number
  spend: number
  revenue: number
  ctr: number
  click_probability: number | null
  fraud_probability: number | null
  recommendation_score: number | null
  roas: number
  top_shap_features: ShapFeatureItem[]
  recommendation_explanation: string | null
}

// ---------------------------------------------------------------------------
// WebSocket Live Update Payload
// ---------------------------------------------------------------------------

export interface AIInsightLiveUpdate {
  total_predictions_today: number
  average_ctr_prediction: number
  average_fraud_probability: number
  active_models: number
  timestamp: string
}

// ---------------------------------------------------------------------------
// Aggregate hook state
// ---------------------------------------------------------------------------

export interface AIInsightState {
  overview: OverviewResponse | null
  modelStatus: ModelStatusResponse | null
  predictions: PredictionResponse | null
  shap: ShapResponse | null
  recommendations: RecommendationResponse | null
  audienceSegments: AudienceResponse | null
  infrastructure: InfrastructureResponse | null
  campaignInsight: CampaignInsightResponse | null
  loading: boolean
  error: string | null
}