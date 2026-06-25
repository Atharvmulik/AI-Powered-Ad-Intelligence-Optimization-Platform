"""
Pydantic v2 schemas for the Campaigns module.

All response models are typed, validated, and serialization-ready.
Designed for direct use as FastAPI response_model targets.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Shared / primitives
# ---------------------------------------------------------------------------


class ChartDataPoint(BaseModel):
    """A single time-bucketed metric snapshot for the live chart."""

    model_config = ConfigDict(from_attributes=True)

    time: str = Field(..., description="HH:MM:SS bucket label")
    ctr: float = Field(..., description="Click-through rate for this bucket (%)")
    fraud_rate: float = Field(..., description="Fraud rate for this bucket (%)")
    events: int = Field(..., description="Total events recorded in this bucket")


# ---------------------------------------------------------------------------
# 1. Live Overview
# ---------------------------------------------------------------------------


class LiveOverviewResponse(BaseModel):
    """Aggregated real-time platform KPIs."""

    model_config = ConfigDict(from_attributes=True)

    events_per_second: float = Field(..., description="Derived from click_events frequency")
    active_users: int = Field(..., description="Users active in the last 15 minutes")
    fraud_blocked_today: int = Field(..., description="Fraud events with status=Blocked today")
    avg_latency_ms: float = Field(..., description="Average ML inference latency (ms)")
    chart_data: List[ChartDataPoint] = Field(
        default_factory=list, description="Last 20 time buckets"
    )


# ---------------------------------------------------------------------------
# 2. Campaign Intelligence
# ---------------------------------------------------------------------------


class CampaignCardResponse(BaseModel):
    """Per-campaign aggregated intelligence card."""

    model_config = ConfigDict(from_attributes=True)

    campaign_id: int
    name: str
    budget: float
    spend: float
    revenue: float
    roas: float = Field(..., description="Return on Ad Spend = revenue / spend")
    cpa: float = Field(..., description="Cost Per Acquisition = spend / conversions")
    raw_clicks: int
    clean_clicks: int
    fraud_filtered: int
    fraud_risk: str = Field(..., description="LOW | MEDIUM | HIGH")
    channel: str = Field(default="Programmatic", description="Ad channel / DSP")
    bid_strategy: str = Field(default="Target ROAS")
    status: str = Field(..., description="ACTIVE | PAUSED | COMPLETED")


class CampaignIntelligenceResponse(BaseModel):
    """Wrapper for the list of campaign intelligence cards."""

    model_config = ConfigDict(from_attributes=True)

    campaigns: List[CampaignCardResponse]


# ---------------------------------------------------------------------------
# 3. Top Performing Ads
# ---------------------------------------------------------------------------


class TopAdResponse(BaseModel):
    """Top ad ranked by CTR."""

    model_config = ConfigDict(from_attributes=True)

    ad_id: str
    campaign_name: str
    format: str
    category: str
    ctr: float
    revenue: float


# ---------------------------------------------------------------------------
# 4. Reports Center
# ---------------------------------------------------------------------------


class ReportResponse(BaseModel):
    """A generated report record."""

    model_config = ConfigDict(from_attributes=True)

    report_id: int
    title: str
    report_type: str
    pages: int
    size_mb: float
    file_path: str
    created_at: datetime


# ---------------------------------------------------------------------------
# 5. Scheduled Reports
# ---------------------------------------------------------------------------


class ScheduledReportResponse(BaseModel):
    """A scheduled report definition."""

    model_config = ConfigDict(from_attributes=True)

    schedule_id: int
    name: str
    frequency: str = Field(..., description="Daily | Weekly | Monthly")
    next_run: datetime
    enabled: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# 6. Fraud Detection Feed
# ---------------------------------------------------------------------------




class FraudFeedItemResponse(BaseModel):
    """A single fraud event entry."""

    model_config = ConfigDict(from_attributes=True)

    event_id: int
    timestamp: datetime
    ip_address: str
    fraud_score: float = Field(..., ge=0.0, le=1.0)
    fraud_category: str
    status: str
    severity: str = Field(..., description="Low | Medium | High | Critical")


class FraudFeedResponse(BaseModel):
    """Fraud feed response with period metadata."""

    model_config = ConfigDict(from_attributes=True)

    period: str = Field(
        ...,
        description="today | last_24_hours | last_7_days"
    )

    events: List[FraudFeedItemResponse]


# ---------------------------------------------------------------------------
# 7. Fraud Summary
# ---------------------------------------------------------------------------


class FraudSummaryResponse(BaseModel):
    """Aggregated fraud analytics for the current day."""

    model_config = ConfigDict(from_attributes=True)

    blocked: int
    precision: float = Field(..., description="Fraud model precision (%)")
    recall: float = Field(..., description="Fraud model recall (%)")
    budget_saved: float = Field(..., description="Estimated ad spend protected ($)")
    clean_percent: float
    suspicious_percent: float
    blocked_percent: float


# ---------------------------------------------------------------------------
# 8. Smart Placement Agent
# ---------------------------------------------------------------------------


class PlacementLogResponse(BaseModel):
    """A single RL agent placement log entry."""

    model_config = ConfigDict(from_attributes=True)

    action: str
    expected_reward: float = Field(..., description="Expected reward from agent")
    episode: int
    created_at: datetime


class PlacementAgentResponse(BaseModel):
    """Smart placement agent status and recent decision log."""

    model_config = ConfigDict(from_attributes=True)

    algorithm: str = Field(default="PPO", description="RL algorithm in use")
    logs: List[PlacementLogResponse]
    next_update_seconds: int = Field(..., description="Seconds until next model update")


# ---------------------------------------------------------------------------
# Additional WS and ML models
# ---------------------------------------------------------------------------


class CampaignChartUpdate(BaseModel):
    """Single chart data point pushed via WebSocket."""

    model_config = ConfigDict(from_attributes=True)

    time: str
    ctr: float
    fraud_rate: float
    events: int


class CampaignLiveUpdate(BaseModel):
    """Lightweight live overview payload for WebSocket pushes."""

    model_config = ConfigDict(from_attributes=True)

    events_per_second: float
    active_users: int
    fraud_blocked_today: int
    avg_latency_ms: float
    timestamp: str = Field(..., description="ISO 8601 timestamp of the update")


class FraudFeedUpdate(BaseModel):
    """Single fraud event used by WebSocket feed (matches FraudFeedResponse)."""

    model_config = ConfigDict(from_attributes=True)

    event_id: int
    timestamp: datetime
    ip_address: str
    fraud_score: float
    fraud_category: str
    status: str
    severity: str


class SHAPFeatureResponse(BaseModel):
    """A single SHAP feature contribution entry."""

    model_config = ConfigDict(from_attributes=True)

    feature: str
    shap_value: float


class SHAPCampaignResponse(BaseModel):
    """Per-campaign SHAP aggregation for ML insights."""

    model_config = ConfigDict(from_attributes=True)

    campaign_id: int
    campaign_name: str
    predicted_ctr: float
    auc_score: float
    features: List[SHAPFeatureResponse]
