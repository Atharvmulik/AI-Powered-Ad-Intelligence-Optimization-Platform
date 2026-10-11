"""Pydantic schemas for the Dashboard module.

All response models are fully typed and validated for the current PostgreSQL-backed
synthetic-data dashboard flow. The schemas represent the API and WebSocket contract
currently consumed by the dashboard frontend.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# KPI Overview
# ---------------------------------------------------------------------------

class OverviewResponse(BaseModel):
    """KPI summary cards shown at the top of the dashboard."""

    model_config = ConfigDict(from_attributes=True)

    total_clicks: int = Field(..., description="Total click events recorded in ClickEvent rows", ge=0)
    ctr: float = Field(..., description="Click-through rate = clicks / impressions x 100 (%), 0–100", ge=0.0, le=100.0)
    active_users: int = Field(..., description="Distinct users with event activity in the last 15 minutes", ge=0)
    fraud_score: float = Field(..., description="Average FraudEvent.fraud_score scaled to 0–100", ge=0.0, le=100.0)
    revenue: float = Field(..., description="Campaign revenue sum from AdCampaign.revenue", ge=0.0)
    events_per_second: float = Field(..., description="Synthetic event throughput over the last 60 seconds / 60", ge=0.0)
    clicks_per_second: float = Field(..., description="Actual clicks over the last 60 seconds / 60", ge=0.0)


# ---------------------------------------------------------------------------
# Executive Summary
# ---------------------------------------------------------------------------

class InsightItem(BaseModel):
    """Single analytics insight with trend direction."""

    text: str = Field(..., description="Human-readable insight statement")
    trend: str = Field(..., description="Trend delta string, e.g. '+12%'")
    status: str = Field(..., description="'up', 'down', or 'neutral'")


class ExecutiveSummaryResponse(BaseModel):
    """AI-generated executive summary and insight list."""

    model_config = ConfigDict(from_attributes=True)

    insight_text: str = Field(..., description="Paragraph-level executive summary")
    insights: List[InsightItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# CTR Trend
# ---------------------------------------------------------------------------

class CTRTrendResponse(BaseModel):
    """Hourly CTR values for the last 24 hours."""

    model_config = ConfigDict(from_attributes=True)

    timestamps: List[datetime] = Field(..., description="UTC hour-aligned timestamps")
    ctr_values: List[float] = Field(..., description="CTR percentage for each hour bucket")


# ---------------------------------------------------------------------------
# Campaign Analytics
# ---------------------------------------------------------------------------

class CampaignAnalyticsResponse(BaseModel):
    """Campaign analytics for the most recent event window."""

    model_config = ConfigDict(from_attributes=True)

    impressions: int = Field(..., ge=0)
    raw_clicks: int = Field(..., ge=0)
    legit_clicks: int = Field(..., ge=0)
    effective_ctr: float = Field(..., ge=0.0, le=100.0)
    conversions: Optional[int] = Field(None, ge=0)
    conversion_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    revenue: float = Field(..., ge=0.0)
    fraud_rate: float = Field(..., ge=0.0, le=100.0)


# ---------------------------------------------------------------------------
# Top Performing Ads
# ---------------------------------------------------------------------------

class TopAdResponse(BaseModel):
    """Single campaign performance row sorted by CTR."""

    model_config = ConfigDict(from_attributes=True)

    campaign_id: int = Field(..., ge=0, description="Existing AdCampaign primary key")
    campaign_name: str
    impressions: int = Field(..., ge=0)
    ctr: float = Field(..., ge=0.0)
    clicks: int = Field(..., ge=0)
    revenue: float = Field(..., ge=0.0)
    spend: float = Field(..., ge=0.0)
    roas: float = Field(..., description="Return on Ad Spend = revenue / spend", ge=0.0)
    fraud_clicks: int = Field(..., ge=0)


# ---------------------------------------------------------------------------
# Geographic Traffic
# ---------------------------------------------------------------------------

class GeographicTrafficResponse(BaseModel):
    """Traffic and fraud metrics aggregated by city."""

    model_config = ConfigDict(from_attributes=True)

    city: str
    traffic: int = Field(..., ge=0, description="Total click events from this city")
    fraud_rate: float = Field(..., ge=0.0, le=100.0, description="Fraud percentage in this city")
    conversion_rate: float = Field(..., ge=0.0, le=100.0)
    top_campaign: Optional[str] = None


# ---------------------------------------------------------------------------
# Fraud Alert Center
# ---------------------------------------------------------------------------

class FraudAlertResponse(BaseModel):
    """Individual fraud event detail for the alert feed."""

    model_config = ConfigDict(from_attributes=True)

    ip_address: str
    fraud_score: float = Field(..., ge=0.0, le=1.0)
    fraud_category: str
    status: str
    severity: str = Field(..., description="CRITICAL | HIGH | MEDIUM | LOW")
    timestamp: datetime


# ---------------------------------------------------------------------------
# SHAP Explanations
# ---------------------------------------------------------------------------

class SHAPFeatureItem(BaseModel):
    """Individual SHAP feature contribution."""

    feature: str = Field(..., description="Feature name, e.g. 'Sports Interest'")
    impact: float = Field(..., description="Relative SHAP impact percentage (0–100)")
    description: str = Field(..., description="Plain-English explanation of feature effect")


class SHAPExplanationResponse(BaseModel):
    """SHAP feature attribution for a specific campaign."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: str
    features: List[SHAPFeatureItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Infrastructure / System Health
# ---------------------------------------------------------------------------

class SystemHealthResponse(BaseModel):
    """Health status row for a single infrastructure service."""

    model_config = ConfigDict(from_attributes=True)

    service_name: str
    status: str = Field(..., description="Healthy | Degraded | Down")
    uptime: float = Field(..., ge=0.0, le=100.0, description="Uptime percentage")
    latency_ms: float = Field(..., ge=0.0)
    last_heartbeat: datetime


# ---------------------------------------------------------------------------
# AI Recommendations
# ---------------------------------------------------------------------------

class AIRecommendationResponse(BaseModel):
    """Single AI-generated business recommendation."""

    model_config = ConfigDict(from_attributes=True)

    title: str
    description: str
    priority: str = Field(..., description="HIGH | MEDIUM | LOW")
    action: str = Field(..., description="Suggested action label, e.g. 'Increase Budget'")


# ---------------------------------------------------------------------------
# AI Ad Decision Center
# ---------------------------------------------------------------------------

class AIAdDecisionResponse(BaseModel):
    """Deterministic decision summary for the current best ad or campaign."""

    model_config = ConfigDict(from_attributes=True)

    ad_id: Optional[str] = None
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    ctr: Optional[float] = Field(None, ge=0.0)
    ctr_change: Optional[float] = None
    fraud_risk: Optional[float] = Field(None, ge=0.0, le=100.0)
    fraud_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    conversion_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    roas: Optional[float] = None
    decision: str = Field(default="NO_DATA", description="SCALE | KEEP_RUNNING | MONITOR | OPTIMIZE | REDUCE | PAUSE | NO_DATA")
    decision_score: float = Field(default=0.0, ge=0.0, le=100.0)
    recommended_action: str = "Monitor"
    reasons: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Live Model Intelligence
# ---------------------------------------------------------------------------

class CTRModelHealthResponse(BaseModel):
    """Monitoring summary for the CTR prediction model."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="healthy | degraded | no_data")
    prediction_count: int = Field(..., ge=0)
    average_prediction: Optional[float] = None
    min_prediction: Optional[float] = None
    max_prediction: Optional[float] = None


class FraudModelHealthResponse(BaseModel):
    """Monitoring summary for the fraud detection model."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="healthy | degraded | no_data")
    prediction_count: int = Field(..., ge=0)
    average_risk: Optional[float] = None
    min_risk: Optional[float] = None
    max_risk: Optional[float] = None
    high_risk_count: int = Field(..., ge=0)
    critical_count: int = Field(..., ge=0)


class RecommendationEngineHealthResponse(BaseModel):
    """Monitoring summary for the recommendation engine."""

    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="healthy | degraded | no_data")
    recommendation_count: int = Field(..., ge=0)
    unique_ads: int = Field(..., ge=0)
    average_score: Optional[float] = None


class ModelIntelligenceResponse(BaseModel):
    """Live monitoring payload for the platform intelligence stack."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ctr_model: CTRModelHealthResponse
    fraud_model: FraudModelHealthResponse
    recommendation_engine: RecommendationEngineHealthResponse


# ---------------------------------------------------------------------------
# Campaign Opportunity Radar
# ---------------------------------------------------------------------------

class CampaignOpportunityItem(BaseModel):
    """Single ranked campaign opportunity for action."""

    model_config = ConfigDict(from_attributes=True)

    campaign_id: int = Field(..., ge=0)
    campaign_name: str
    status: str = Field(..., description="SCALE | OPTIMIZE | MONITOR | REDUCE | PAUSE")
    priority: str = Field(..., description="HIGH | MEDIUM | LOW")
    ctr: Optional[float] = Field(None, ge=0.0)
    ctr_change: Optional[float] = None
    conversion_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    fraud_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    revenue: float = Field(default=0.0, ge=0.0)
    spend: float = Field(default=0.0, ge=0.0)
    roas: Optional[float] = None
    reason: str
    recommended_action: str


class CampaignOpportunityRadarResponse(BaseModel):
    """Ranked list of campaigns requiring attention in the live window."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    opportunities: List[CampaignOpportunityItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# WebSocket Live Update Payload
# ---------------------------------------------------------------------------

class DashboardLiveUpdate(BaseModel):
    """Payload pushed over WebSocket every 5 seconds."""

    model_config = ConfigDict(from_attributes=True)

    events_per_second: float = Field(..., ge=0.0)
    active_users: int = Field(..., ge=0)
    ctr: float = Field(..., ge=0.0, le=100.0)
    fraud_alert_count: int = Field(..., ge=0)
    revenue: float = Field(..., ge=0.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ai_decision: Optional[AIAdDecisionResponse] = None
    model_intelligence: Optional[ModelIntelligenceResponse] = None
    campaign_opportunities: Optional[List[CampaignOpportunityItem]] = None