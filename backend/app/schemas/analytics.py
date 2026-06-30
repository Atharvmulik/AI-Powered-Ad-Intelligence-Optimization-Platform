"""
Pydantic v2 schemas for the Analytics module.

All response models are typed, validated, and serialization-ready.
Designed for direct use as FastAPI response_model targets by
analytics.py, analytics_service.py, and analytics_ws.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Shared / Primitives
# ---------------------------------------------------------------------------


class CTRDataPoint(BaseModel):
    """A single time-bucketed CTR snapshot for the live trend chart."""

    model_config = ConfigDict(from_attributes=True)

    time: str = Field(..., description="HH:MM:SS bucket label for the chart x-axis")
    ctr: float = Field(..., description="Click-through rate for this time bucket (%)")
    events: int = Field(..., description="Total click events recorded in this bucket")


class PieChartItem(BaseModel):
    """A single segment of a pie or donut distribution chart."""

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(..., description="Channel or segment label (e.g. 'Search Ads')")
    percentage: float = Field(..., description="Percentage share of total clicks (0–100)")
    clicks: int = Field(..., description="Absolute click count for this segment")


class InterestItem(BaseModel):
    """A single user interest category with its relative weight."""

    model_config = ConfigDict(from_attributes=True)

    category: str = Field(..., description="Interest category label (e.g. 'Technology')")
    percentage: float = Field(..., description="Percentage of users attributed to this category")


class FraudEventItem(BaseModel):
    """A single fraud event entry returned inside FraudMonitorResponse."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="UTC timestamp of the fraud event")
    ip_address: str = Field(..., description="Source IP address of the suspicious request")
    fraud_score: float = Field(..., ge=0.0, le=1.0, description="Model-assigned fraud probability (0.0–1.0)")
    category: str = Field(..., description="Fraud category (e.g. 'Bot Traffic', 'Click Injection')")
    action: str = Field(..., description="Action taken by the system (e.g. 'Blocked', 'Flagged')")
    severity: str = Field(..., description="Severity level: Low | Medium | High | Critical")


class CampaignPerformanceItem(BaseModel):
    """Per-campaign performance row inside CampaignPerformanceResponse."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: str = Field(..., description="Display name of the campaign")
    advertiser: str = Field(..., description="Advertiser or brand running the campaign")
    raw_clicks: int = Field(..., description="Total raw click events before fraud filtering")
    fraud_filtered: int = Field(..., description="Click events removed by the fraud detection model")
    effective_ctr: float = Field(..., description="CTR computed on clean (post-filter) clicks (%)")
    spend: float = Field(..., description="Total ad spend for this campaign ($)")
    roas: float = Field(..., description="Return on Ad Spend = revenue / spend")
    status: str = Field(..., description="Current delivery status: ACTIVE | PAUSED | COMPLETED")


class PlacementPerformanceItem(BaseModel):
    """Per-placement performance row inside PlacementPerformanceResponse."""

    model_config = ConfigDict(from_attributes=True)

    placement: str = Field(..., description="Placement slot identifier (e.g. 'Above the Fold')")
    impressions: int = Field(..., description="Total impressions served through this placement")
    ctr: float = Field(..., description="Click-through rate for this placement (%)")
    revenue: float = Field(..., description="Revenue generated through this placement ($)")
    performance_percentage: float = Field(
        ..., description="Performance score relative to the best placement (0–100)"
    )
    is_best: bool = Field(..., description="True if this is the highest-performing placement")


class TopAdAnalyticsResponse(BaseModel):
    """A single top-performing ad entry ranked by CTR."""

    model_config = ConfigDict(from_attributes=True)

    rank: int = Field(..., description="Rank position (1 = highest CTR)")
    campaign: str = Field(..., description="Campaign name the ad belongs to")
    brand: str = Field(..., description="Brand or advertiser name")
    category: str = Field(..., description="Ad creative category (e.g. 'E-commerce', 'SaaS')")
    status: str = Field(..., description="Current ad delivery status: ACTIVE | PAUSED | COMPLETED")
    ctr: float = Field(..., description="Click-through rate for this ad (%)")
    revenue: float = Field(..., description="Revenue attributed to this ad ($)")


class TerminalLogItem(BaseModel):
    """A single AI system terminal log entry."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="UTC timestamp when the log entry was recorded")
    message: str = Field(..., description="Human-readable log message from the AI pipeline")
    type: str = Field(..., description="Log source type (e.g. 'ML', 'Placement', 'Fraud')")
    status: str = Field(..., description="Processing status: SUCCESS | WARNING | ERROR | INFO")


# ---------------------------------------------------------------------------
# 1. Analytics Overview
# ---------------------------------------------------------------------------


class AnalyticsOverviewResponse(BaseModel):
    """Aggregated analytics dashboard KPIs with period-over-period comparison values."""

    model_config = ConfigDict(from_attributes=True)

    active_users: int = Field(..., description="Users active in the current measurement window")
    previous_active_users: int = Field(..., description="Active users in the previous equivalent window")
    events_per_second: float = Field(..., description="Current platform event throughput (events/sec)")
    previous_events_per_second: float = Field(..., description="Events per second in the prior period")
    avg_bid_latency_ms: float = Field(..., description="Average ML bid inference latency in milliseconds")
    previous_bid_latency_ms: float = Field(..., description="Average bid latency in the prior period (ms)")
    fraud_rate: float = Field(..., description="Current fraud rate as a percentage of total events")
    previous_fraud_rate: float = Field(..., description="Fraud rate in the prior period (%)")
    current_ctr: float = Field(..., description="Current overall click-through rate (%)")
    summary: str = Field(..., description="Natural-language summary of the current analytics state")


# ---------------------------------------------------------------------------
# 2 & 3. CTR Trend
# ---------------------------------------------------------------------------


class CTRTrendResponse(BaseModel):
    """Rolling CTR trend data for the live analytics chart."""

    model_config = ConfigDict(from_attributes=True)

    current_ctr: float = Field(..., description="Current overall CTR across all active campaigns (%)")
    target_ctr: float = Field(..., description="Configured target CTR threshold for chart reference (%)")
    points: List[CTRDataPoint] = Field(
        default_factory=list,
        description="Last 20 time-bucketed CTR data points ordered oldest to newest",
    )


# ---------------------------------------------------------------------------
# 4 & 5. Click Distribution
# ---------------------------------------------------------------------------


class ClickDistributionResponse(BaseModel):
    """Click distribution breakdown across advertising channels."""

    model_config = ConfigDict(from_attributes=True)

    total_clicks: int = Field(..., description="Aggregate click count across all channels")
    channels: List[PieChartItem] = Field(
        default_factory=list,
        description="Per-channel click counts and percentage shares",
    )


# ---------------------------------------------------------------------------
# 6. Engagement Analytics
# ---------------------------------------------------------------------------


class EngagementResponse(BaseModel):
    """User engagement metrics for the current measurement window."""

    model_config = ConfigDict(from_attributes=True)

    average_session_duration: float = Field(
        ..., description="Mean session duration across active users (seconds)"
    )
    bounce_rate: float = Field(
        ..., description="Percentage of sessions that ended after a single page view"
    )
    returning_users: int = Field(
        ..., description="Count of users who have returned within the current window"
    )
    engagement_score: float = Field(
        ..., description="Composite engagement score derived from duration, bounce, and return signals (0–100)"
    )


# ---------------------------------------------------------------------------
# 7. Device Split
# ---------------------------------------------------------------------------


class DeviceSplitResponse(BaseModel):
    """Percentage distribution of active users across device categories."""

    model_config = ConfigDict(from_attributes=True)

    desktop: float = Field(..., description="Percentage of traffic originating from Desktop devices")
    mobile: float = Field(..., description="Percentage of traffic originating from Mobile devices")
    tablet: float = Field(..., description="Percentage of traffic originating from Tablet devices")
    total_users: int = Field(..., description="Total user count used as the denominator for percentages")


# ---------------------------------------------------------------------------
# 8. Top Performing Ads — uses TopAdAnalyticsResponse (defined in shared)
# ---------------------------------------------------------------------------

# TopAdAnalyticsResponse defined above in shared section.


# ---------------------------------------------------------------------------
# 9. AI Growth Prediction
# ---------------------------------------------------------------------------


class GrowthForecastPoint(BaseModel):
    """A single forward-looking data point in the growth forecast series."""

    model_config = ConfigDict(from_attributes=True)

    period: str = Field(..., description="Forecast period label (e.g. 'Week 1', 'Month 2')")
    predicted_value: float = Field(..., description="Predicted metric value for this period")


class AIGrowthPredictionResponse(BaseModel):
    """ML model forward-looking growth prediction."""

    model_config = ConfigDict(from_attributes=True)

    prediction_accuracy: float = Field(
        ...,
        description="Historical prediction accuracy (%)",
    )

    recommendation_score: float = Field(
        ...,
        description="Recommendation score (0-1 or normalized score).",
    )

    fraud_probability: float = Field(
        ...,
        description="Average fraud probability.",
    )

    click_probability: float = Field(
        ...,
        description="Average click probability.",
    )

    growth_forecast: float = Field(
        ...,
        description="Predicted campaign growth percentage.",
    )

    confidence: float = Field(
        ...,
        description="Overall model confidence percentage.",
    )

    model_version: str = Field(
        ...,
        description="Latest deployed ML model version.",
    )

# ---------------------------------------------------------------------------
# 10 & 11. User Interests
# ---------------------------------------------------------------------------


class UserInterestResponse(BaseModel):
    """Distribution of user interest categories inferred from engagement signals."""

    model_config = ConfigDict(from_attributes=True)

    interests: List[InterestItem] = Field(
        default_factory=list,
        description="List of interest categories with percentage share of total user signal",
    )


# ---------------------------------------------------------------------------
# 12. Conversion Funnel
# ---------------------------------------------------------------------------


class ConversionFunnelResponse(BaseModel):
    """Full advertising conversion funnel with stage counts and drop-off rates."""

    model_config = ConfigDict(from_attributes=True)

    impressions: int = Field(..., description="Total ad impressions served (top of funnel)")
    clicks: int = Field(..., description="Total click events recorded")
    conversions: int = Field(..., description="Total conversion events (e.g. sign-ups, purchases)")
    revenue_events: int = Field(..., description="Total revenue-generating events (bottom of funnel)")
    click_rate: float = Field(..., description="Clicks as a percentage of impressions (%)")
    conversion_rate: float = Field(..., description="Conversions as a percentage of clicks (%)")
    revenue_rate: float = Field(..., description="Revenue events as a percentage of conversions (%)")
    impression_drop: float = Field(
        ..., description="Drop-off percentage from impressions to clicks (%)"
    )
    click_drop: float = Field(
        ..., description="Drop-off percentage from clicks to conversions (%)"
    )
    conversion_drop: float = Field(
        ..., description="Drop-off percentage from conversions to revenue events (%)"
    )


# ---------------------------------------------------------------------------
# 13 & 14. Placement Performance
# ---------------------------------------------------------------------------


class PlacementPerformanceResponse(BaseModel):
    """Aggregated placement performance across all active ad slots."""

    model_config = ConfigDict(from_attributes=True)

    placements: List[PlacementPerformanceItem] = Field(
        default_factory=list,
        description="Per-placement performance records ordered by revenue descending",
    )


# ---------------------------------------------------------------------------
# 15 & 16. Fraud Monitor
# ---------------------------------------------------------------------------


class FraudMonitorResponse(BaseModel):
    """Real-time fraud monitoring snapshot with event feed and aggregate counters."""

    model_config = ConfigDict(from_attributes=True)

    blocked_today: int = Field(..., description="Total fraud events blocked since midnight UTC")
    flagged: int = Field(..., description="Events currently in a Flagged / under-review state")
    clean: int = Field(..., description="Events cleared as legitimate traffic")
    events: List[FraudEventItem] = Field(
        default_factory=list,
        description="Latest fraud events ordered by timestamp descending",
    )


# ---------------------------------------------------------------------------
# 17 & 18. Campaign Performance
# ---------------------------------------------------------------------------


class CampaignPerformanceResponse(BaseModel):
    """Aggregated performance summary across all campaigns."""

    model_config = ConfigDict(from_attributes=True)

    campaigns: List[CampaignPerformanceItem] = Field(
        default_factory=list,
        description="Per-campaign performance records ordered by spend descending",
    )


# ---------------------------------------------------------------------------
# 19 & 20. Analytics Terminal
# ---------------------------------------------------------------------------


class AnalyticsTerminalResponse(BaseModel):
    """Latest AI system log entries powering the analytics terminal view."""

    model_config = ConfigDict(from_attributes=True)

    logs: List[TerminalLogItem] = Field(
        default_factory=list,
        description="AI pipeline log entries ordered by timestamp descending",
    )


# ---------------------------------------------------------------------------
# 21. Report Response
# ---------------------------------------------------------------------------


class ReportResponse(BaseModel):
    """A generated analytics report record."""

    model_config = ConfigDict(from_attributes=True)

    report_id: int = Field(..., description="Primary key of the report record")
    title: str = Field(..., description="Human-readable report title")
    report_type: str = Field(..., description="Report category (e.g. 'Campaign', 'Fraud', 'Revenue')")
    pages: int = Field(..., description="Number of pages in the generated report")
    size_mb: float = Field(..., description="File size in megabytes")
    file_path: str = Field(..., description="Relative path to the generated report file")
    created_at: datetime = Field(..., description="UTC timestamp when the report was generated")


# ---------------------------------------------------------------------------
# 22. Scheduled Report Response
# ---------------------------------------------------------------------------


class ScheduledReportResponse(BaseModel):
    """A scheduled report definition controlling automated report generation."""

    model_config = ConfigDict(from_attributes=True)

    schedule_id: int = Field(..., description="Primary key of the scheduled report definition")
    name: str = Field(..., description="Display name of the scheduled report")
    frequency: str = Field(..., description="Delivery frequency: Daily | Weekly | Monthly")
    next_run: datetime = Field(..., description="UTC timestamp of the next scheduled generation")
    enabled: bool = Field(..., description="Whether this schedule is currently active")
    created_at: datetime = Field(..., description="UTC timestamp when the schedule was created")


# ---------------------------------------------------------------------------
# WebSocket Lightweight Models
# ---------------------------------------------------------------------------


class AnalyticsLiveUpdate(BaseModel):
    """
    Lightweight analytics snapshot pushed via WebSocket on each tick.

    Contains only the fields required for the live KPI banner to avoid
    over-fetching on high-frequency push intervals.
    """

    model_config = ConfigDict(from_attributes=True)

    active_users: int = Field(..., description="Users active at the moment of this update")
    events_per_second: float = Field(..., description="Platform event throughput at the moment of this update")
    avg_bid_latency_ms: float = Field(..., description="Average ML bid latency at the moment of this update (ms)")
    fraud_rate: float = Field(..., description="Current fraud rate at the moment of this update (%)")
    current_ctr: float = Field(..., description="Current overall CTR at the moment of this update (%)")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of this push event")


class CTRUpdate(BaseModel):
    """
    Single CTR data point pushed via WebSocket for the live CTR trend chart.

    Appended client-side to the existing chart series on each tick.
    """

    model_config = ConfigDict(from_attributes=True)

    time: str = Field(..., description="HH:MM:SS label for the new chart data point")
    ctr: float = Field(..., description="CTR value for this tick (%)")
    events: int = Field(..., description="Total events recorded in the current tick window")


class FraudMonitorUpdate(BaseModel):
    """
    Single fraud event pushed via WebSocket to update the live fraud monitor feed.

    Contains the minimum fields needed to render a new row in the event table.
    """

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="UTC timestamp of the fraud event")
    ip_address: str = Field(..., description="Source IP address of the suspicious request")
    fraud_score: float = Field(..., ge=0.0, le=1.0, description="Model-assigned fraud probability (0.0–1.0)")
    category: str = Field(..., description="Fraud category (e.g. 'Bot Traffic', 'Click Injection')")
    action: str = Field(..., description="Action taken by the system (e.g. 'Blocked', 'Flagged')")


class TerminalLogUpdate(BaseModel):
    """
    Single terminal log entry pushed via WebSocket to the analytics terminal view.

    Appended client-side to the scrolling log display on each push.
    """

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="UTC timestamp when the log entry was recorded")
    message: str = Field(..., description="Human-readable log message from the AI pipeline")
    type: str = Field(..., description="Log source type (e.g. 'ML', 'Placement', 'Fraud')")
    status: str = Field(..., description="Processing status: SUCCESS | WARNING | ERROR | INFO")