"""
Pydantic schemas for the System Health module.

All response models are fully typed and validated.
Designed for future Redis caching and Kafka stream integration.
"""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Service Health Cards
# ---------------------------------------------------------------------------

class ServiceHealthResponse(BaseModel):
    """Health status row for a single registered infrastructure service."""

    model_config = ConfigDict(from_attributes=True)

    service_name: str = Field(..., description="Registered service identifier, e.g. 'Kafka Cluster'")
    status: str = Field(..., description="Operational status: Healthy | Degraded | Down")
    uptime: float = Field(..., ge=0.0, le=100.0, description="Uptime percentage over the last 30 days")
    latency_ms: float = Field(..., ge=0.0, description="Most recent observed latency in milliseconds")
    last_heartbeat: datetime = Field(..., description="UTC timestamp of the latest heartbeat record")


# ---------------------------------------------------------------------------
# NFR Badges
# ---------------------------------------------------------------------------

class NFRBadgeResponse(BaseModel):
    """
    Non-functional requirement SLA badge values shown at the top of the
    System Health page (Bid Response < 100 ms, ML Inference < 30 ms,
    Dashboard Lag < 3 s).
    """

    model_config = ConfigDict(from_attributes=True)

    bid_engine_sla: float = Field(
        ...,
        ge=0.0,
        description="Current end-to-end bid response latency in milliseconds. Target < 100 ms.",
    )
    ml_sla: float = Field(
        ...,
        ge=0.0,
        description="Current ML inference latency in milliseconds. Target < 30 ms.",
    )
    dashboard_sla: float = Field(
        ...,
        ge=0.0,
        description="Current dashboard WebSocket lag in seconds. Target < 3 s.",
    )
    bid_engine_status: str = Field(
        ...,
        description="SLA compliance status for bid engine: OK | WARNING | BREACH",
    )
    ml_status: str = Field(
        ...,
        description="SLA compliance status for ML inference: OK | WARNING | BREACH",
    )
    dashboard_status: str = Field(
        ...,
        description="SLA compliance status for dashboard lag: OK | WARNING | BREACH",
    )


# ---------------------------------------------------------------------------
# Global Latency Trend (P99)
# ---------------------------------------------------------------------------

class LatencyTrendResponse(BaseModel):
    """
    P99 latency time-series for a single deployment region.
    One instance per region; the frontend renders both on the same chart.
    """

    model_config = ConfigDict(from_attributes=True)

    region: str = Field(..., description="Deployment region identifier, e.g. 'EU-CENTRAL-1'")
    timestamps: List[str] = Field(
        ...,
        description="ISO-8601 timestamps for each latency sample, hour-aligned",
    )
    latency_p99_ms: List[float] = Field(
        ...,
        description="P99 latency value in milliseconds for each timestamp bucket",
    )


# ---------------------------------------------------------------------------
# Kafka Event Throughput
# ---------------------------------------------------------------------------

class KafkaThroughputResponse(BaseModel):
    """Current Kafka pipeline throughput vs the configured dev/prod target."""

    model_config = ConfigDict(from_attributes=True)

    events_per_second: float = Field(
        ...,
        ge=0.0,
        description="Instantaneous events-per-second measured by the Kafka consumer",
    )
    target: float = Field(
        ...,
        ge=0.0,
        description="Configured throughput target in events per second, e.g. 10000.0",
    )
    above_target: bool = Field(
        ...,
        description="True when events_per_second >= target; used for the green badge in the UI",
    )


# ---------------------------------------------------------------------------
# Live Audit Log
# ---------------------------------------------------------------------------

class AuditLogEntry(BaseModel):
    """Single structured log line emitted by any infrastructure service."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime = Field(..., description="UTC timestamp when the log entry was emitted")
    service_name: str = Field(
        ...,
        description="Originating service identifier, e.g. 'PostgreSQL'",
    )
    level: str = Field(
        ...,
        description="Log severity level: INFO | WARN | ERROR | TRACE | RUNNING",
    )
    message: str = Field(..., description="Human-readable log message body")


# ---------------------------------------------------------------------------
# WebSocket Live Update Payload
# ---------------------------------------------------------------------------

class SystemLiveUpdate(BaseModel):
    """Payload pushed over WebSocket every 5 seconds to all connected clients."""

    events_per_second: float = Field(
        ...,
        ge=0.0,
        description="Real-time Kafka ingestion rate at the moment of the push",
    )
    active_alerts: int = Field(
        ...,
        ge=0,
        description="Number of unresolved fraud or SLA-breach alerts currently active",
    )
    ml_latency: float = Field(
        ...,
        ge=0.0,
        description="Latest ML inference latency in milliseconds; compared against the 30 ms SLA",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp of this snapshot, set server-side at push time",
    )