from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


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