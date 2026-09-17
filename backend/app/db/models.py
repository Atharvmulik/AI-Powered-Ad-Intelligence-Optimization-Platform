from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# realtime_event_logs
# ---------------------------------------------------------------------------

class RealtimeEventLog(Base):
    __tablename__ = "realtime_event_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    event_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    # CLICK | FRAUD | PRED | SHAP

    campaign_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        index=True,
    )

    shard: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    offset: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    line_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    payload: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )
    # for FRAUD rows this carries {"reason", "ip_address", "fraud_score"} —
    # replaces the old separate FraudBlockEvent table.

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index("ix_realtime_event_logs_type_created", "event_type", "created_at"),
        Index("ix_realtime_event_logs_campaign_created", "campaign_id", "created_at"),
    )


# ---------------------------------------------------------------------------
# stream_metric_snapshots
# ---------------------------------------------------------------------------

class StreamMetricSnapshot(Base):
    __tablename__ = "stream_metric_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    events_per_second: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_events_today: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    kafka_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    clicks_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fraud_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    preds_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shap_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index("ix_stream_metric_snapshots_captured_at", "captured_at"),
    )


# ---------------------------------------------------------------------------
# cluster_nodes
# ---------------------------------------------------------------------------

class ClusterNode(Base):
    __tablename__ = "cluster_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    node_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    region: Mapped[str] = mapped_column(String(50), nullable=False, default="US-EAST-1", index=True)
    is_healthy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    last_heartbeat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index("ix_cluster_nodes_region_healthy", "region", "is_healthy"),
    )


# ---------------------------------------------------------------------------
# system_patch_infos
# ---------------------------------------------------------------------------

class SystemPatchInfo(Base):
    __tablename__ = "system_patch_infos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    version: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    deployed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index("ix_system_patch_infos_deployed_at", "deployed_at"),
    )


# ---------------------------------------------------------------------------
# stream_control_states
# ---------------------------------------------------------------------------

class StreamControlState(Base):
    __tablename__ = "stream_control_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # singleton row — always id = 1

    is_paused: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    paused_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paused_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    fraud_counter_reset_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    # non-destructive reset baseline — fraud counts are filtered to
    # created_at >= this timestamp instead of deleting rows.

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
# ---------------------------------------------------------------------------
# users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    gender: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    device_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    interests: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    last_active: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    __table_args__ = (
        Index("ix_users_last_active", "last_active"),
    )


# ---------------------------------------------------------------------------
# ad_campaigns
# ---------------------------------------------------------------------------

class AdCampaign(Base):
    __tablename__ = "ad_campaigns"

    campaign_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    advertiser_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    campaign_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    spend: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    revenue: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="ACTIVE",
        index=True,
    )

    bid_strategy: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="CPC",
    )

    target_demographics: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    fraud_risk: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Low",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

# ---------------------------------------------------------------------------
# ad_creatives
# ---------------------------------------------------------------------------

class AdCreative(Base):
    __tablename__ = "ad_creatives"

    ad_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    campaign_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ad_campaigns.campaign_id"),
        nullable=False,
        index=True,
    )

    format: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Banner",
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    keywords: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="DRAFT",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index("ix_ad_creatives_campaign_status", "campaign_id", "status"),
    )

# ---------------------------------------------------------------------------
# audience_segments
# ---------------------------------------------------------------------------

class AudienceSegment(Base):
    __tablename__ = "audience_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    subtitle: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    icon_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="group",
    )

    reach: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    growth_pct: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    device_mobile_pct: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    device_desktop_pct: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    device_tablet_pct: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    fraud_risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Low",
        index=True,
    )

    avg_ctr: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    tags: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ---------------------------------------------------------------------------
# audience_segment_insights
# ---------------------------------------------------------------------------

class AudienceSegmentInsight(Base):
    __tablename__ = "audience_segment_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    segment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("audience_segments.id"),
        nullable=False,
        index=True,
    )

    feature_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    contribution_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index(
            "ix_audience_insight_segment_feature",
            "segment_id",
            "feature_name",
        ),
    )

# ---------------------------------------------------------------------------
# click_events
# ---------------------------------------------------------------------------

class ClickEvent(Base):
    __tablename__ = "click_events"

    event_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    ad_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    campaign_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    clicked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    predicted_ctr: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    actual_outcome: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    __table_args__ = (
        Index("ix_click_events_timestamp_clicked", "timestamp", "clicked"),
    )


# ---------------------------------------------------------------------------
# fraud_events
# ---------------------------------------------------------------------------

class FraudEvent(Base):
    __tablename__ = "fraud_events"

    event_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    ip_address: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    fraud_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    fraud_category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Pending",
    )

    severity: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="LOW",
    )

    __table_args__ = (
        Index("ix_fraud_events_score_severity", "fraud_score", "severity"),
    )


# ---------------------------------------------------------------------------
# recommendation_logs
# ---------------------------------------------------------------------------

class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    recommendation_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    ad_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    recommendation_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    explanation: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )


# ---------------------------------------------------------------------------
# infrastructure_metrics
# ---------------------------------------------------------------------------

class InfrastructureMetric(Base):
    __tablename__ = "infrastructure_metrics"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    service_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    uptime: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    latency_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    detail: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    # short badge annotation, e.g. "HIT RATE: 94%" for redis_cache

    heartbeat_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )



class MLPredictionLog(Base):
    __tablename__ = "ml_prediction_logs"

    prediction_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    ad_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    campaign_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    click_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    fraud_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    recommendation_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    inference_latency_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )




# ---------------------------------------------------------------------------
# reports
# ---------------------------------------------------------------------------

class Report(Base):
    __tablename__ = "reports"

    report_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    report_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    size_mb: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    file_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )


# ---------------------------------------------------------------------------
# scheduled_reports
# ---------------------------------------------------------------------------

class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    schedule_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    frequency: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    next_run: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )


# ---------------------------------------------------------------------------
# placement_agent_logs
# ---------------------------------------------------------------------------

class PlacementAgentLog(Base):
    __tablename__ = "placement_agent_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    action: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    expected_reward: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    episode: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )


# ---------------------------------------------------------------------------
# shap_insights
# ---------------------------------------------------------------------------

class ShapInsight(Base):
    __tablename__ = "shap_insights"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    campaign_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ad_campaigns.campaign_id"),
        nullable=False,
        index=True,
    )

    feature_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    shap_value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    predicted_ctr: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    auc_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        Index(
            "ix_shap_campaign_feature",
            "campaign_id",
            "feature_name",
        ),
    )