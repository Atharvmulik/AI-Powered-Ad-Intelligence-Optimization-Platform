"""
Pydantic schemas for the Dashboard module.

All response models are fully typed and validated.
Designed for future Redis caching and Kafka stream integration.
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

    total_clicks: int = Field(..., description="Total click events recorded", ge=0)
    ctr: float = Field(..., description="Click-through rate as a percentage (0–100)", ge=0.0, le=100.0)
    active_users: int = Field(..., description="Users active in the last 15 minutes", ge=0)
    fraud_score: float = Field(..., description="Average fraud score scaled to 0–100", ge=0.0, le=100.0)
    revenue: float = Field(..., description="Total campaign revenue in USD", ge=0.0)
    events_per_second: float = Field(..., description="Real-time event ingestion rate", ge=0.0)


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
    """Aggregated campaign performance after fraud filtering."""

    model_config = ConfigDict(from_attributes=True)

    raw_clicks: int = Field(..., ge=0)
    fraud_filtered_clicks: int = Field(..., ge=0)
    effective_ctr: float = Field(..., ge=0.0, le=100.0)
    conversions: int = Field(..., ge=0)
    revenue: float = Field(..., ge=0.0)


# ---------------------------------------------------------------------------
# Top Performing Ads
# ---------------------------------------------------------------------------

class TopAdResponse(BaseModel):
    """Single campaign performance row sorted by CTR."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: str
    ctr: float = Field(..., ge=0.0, le=100.0)
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
# WebSocket Live Update Payload
# ---------------------------------------------------------------------------

class DashboardLiveUpdate(BaseModel):
    """Payload pushed over WebSocket every 5 seconds."""

    events_per_second: float = Field(..., ge=0.0)
    active_users: int = Field(..., ge=0)
    ctr: float = Field(..., ge=0.0, le=100.0)
    fraud_alert_count: int = Field(..., ge=0)
    revenue: float = Field(..., ge=0.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)