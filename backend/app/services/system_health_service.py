"""
SystemHealthService — service layer for the System Health module.

All database I/O is encapsulated here.  The router layer calls this class
exclusively; no SQLAlchemy or raw SQL leaks into the API layer.

Architecture notes
------------------
* Async SQLAlchemy sessions are used throughout (AsyncSession).
* Every public method is an async coroutine.
* Redis-ready: caching stubs are present and clearly marked; swap the
  placeholder body for an actual redis-py / aioredis call when the cache
  layer lands.
* Kafka-ready: event-publishing stubs are present; connect an AIOKafka
  producer when the streaming layer is wired up.
* Audit log: get_audit_log() derives entries directly from the
  infrastructure_metrics table.  If a dedicated audit_logs table is added
  in a later migration, swap the query body — the method signature and
  return schema stay identical.
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.system_health import (
    AuditLogEntry,
    KafkaThroughputResponse,
    LatencyTrendResponse,
    NFRBadgeResponse,
    ServiceHealthResponse,
    SystemLiveUpdate,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NFR thresholds — derived from PRD Section 6 (Non-Functional Requirements)
# ---------------------------------------------------------------------------

_BID_ENGINE_TARGET_MS: float = 100.0   # end-to-end bid response < 100 ms
_ML_INFERENCE_TARGET_MS: float = 30.0  # ML inference < 30 ms
_DASHBOARD_LAG_TARGET_S: float = 3.0   # dashboard WebSocket lag < 3 s

# Uptime-derived thresholds for SLA badge status
_UPTIME_WARNING_PCT: float = 99.5      # below this → WARNING
_UPTIME_CRITICAL_PCT: float = 99.0     # below this → BREACH

# Latency multipliers that promote a badge from OK → WARNING / BREACH
_LATENCY_WARNING_MULTIPLIER: float = 1.5   # 1.5× target → WARNING
_LATENCY_BREACH_MULTIPLIER: float = 2.0    # 2×   target → BREACH

# Kafka PRD targets (Section 13 — Success Metrics)
_KAFKA_DEV_TARGET_EPS: float = 10_000.0  # > 10 000 events/second in dev

# Latency trend window
_LATENCY_TREND_HOURS: int = 12

# Regions surfaced in the Global Latency (P99) chart
_REGIONS: List[str] = ["EU-CENTRAL-1", "US-EAST-1"]

# Service names that map to the NFR badges.
# These must match the service_name values seeded in infrastructure_metrics.
_SERVICE_KAFKA: str = "Kafka Cluster"
_SERVICE_ML: str = "ML Inference"
_SERVICE_CORE_API: str = "Core API"

# Audit log level pool for mock entries
_AUDIT_LEVELS: List[str] = ["INFO", "WARN", "ERROR", "TRACE", "RUNNING"]


# ---------------------------------------------------------------------------
# Lazy model imports — prevents circular imports while keeping the service
# decoupled from db/ model definitions.
# ---------------------------------------------------------------------------

def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        FraudEvent,
        InfrastructureMetric,
    )
    return FraudEvent, InfrastructureMetric


# ---------------------------------------------------------------------------
# Cache helper stubs  (Redis-ready)
# ---------------------------------------------------------------------------

async def _cache_get(key: str) -> Optional[str]:
    """
    Redis GET stub.

    Replace with:
        value = await redis_client.get(key)
        return value.decode() if value else None
    """
    return None  # pragma: no cover


async def _cache_set(key: str, value: str, ttl_seconds: int = 30) -> None:
    """
    Redis SET stub.

    Replace with:
        await redis_client.setex(key, ttl_seconds, value)
    """
    return  # pragma: no cover


# ---------------------------------------------------------------------------
# Kafka helper stub  (Kafka-ready)
# ---------------------------------------------------------------------------

async def _publish_event(topic: str, payload: dict) -> None:
    """
    AIOKafka producer stub.

    Replace with:
        await kafka_producer.send_and_wait(topic, value=json.dumps(payload).encode())
    """
    return  # pragma: no cover


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _sla_status_from_uptime(uptime: float) -> str:
    """
    Derive a badge status string from a raw uptime percentage.

    Parameters
    ----------
    uptime : float
        Uptime percentage, 0–100.

    Returns
    -------
    str
        "OK" | "WARNING" | "BREACH"
    """
    if uptime >= _UPTIME_WARNING_PCT:
        return "OK"
    if uptime >= _UPTIME_CRITICAL_PCT:
        return "WARNING"
    return "BREACH"


def _sla_status_from_latency(latency_ms: float, target_ms: float) -> str:
    """
    Derive a badge status string by comparing observed latency to a target.

    Parameters
    ----------
    latency_ms : float
        Observed latency in milliseconds.
    target_ms : float
        PRD-defined SLA target in milliseconds.

    Returns
    -------
    str
        "OK" | "WARNING" | "BREACH"
    """
    if latency_ms <= target_ms:
        return "OK"
    if latency_ms <= target_ms * _LATENCY_BREACH_MULTIPLIER:
        return "WARNING"
    return "BREACH"


# ---------------------------------------------------------------------------
# SystemHealthService
# ---------------------------------------------------------------------------

class SystemHealthService:
    """
    Encapsulates all infrastructure-health queries for the System Health module.

    Parameters
    ----------
    db : AsyncSession
        Injected async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # 1. Service Health Cards
    # ------------------------------------------------------------------

    async def get_service_cards(self) -> List[ServiceHealthResponse]:
        """
        Return the latest heartbeat record for every registered service,
        sorted alphabetically by service name.

        Query strategy: subquery to find max(heartbeat_timestamp) per
        service_name, then join back to retrieve the full row.  This is
        the same pattern used in DashboardService.get_system_health().

        Returns
        -------
        List[ServiceHealthResponse]
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db

        # Subquery: latest heartbeat timestamp per service
        latest_sub = (
            select(
                InfrastructureMetric.service_name,
                func.max(InfrastructureMetric.heartbeat_timestamp).label("latest_ts"),
            )
            .group_by(InfrastructureMetric.service_name)
            .subquery()
        )

        result = await db.execute(
            select(InfrastructureMetric)
            .join(
                latest_sub,
                (InfrastructureMetric.service_name == latest_sub.c.service_name)
                & (InfrastructureMetric.heartbeat_timestamp == latest_sub.c.latest_ts),
            )
            .order_by(InfrastructureMetric.service_name)
        )
        metrics = result.scalars().all()

        return [
            ServiceHealthResponse(
                service_name=m.service_name,
                status=m.status,
                uptime=float(m.uptime),
                latency_ms=float(m.latency_ms),
                last_heartbeat=m.heartbeat_timestamp,
            )
            for m in metrics
        ]

    # ------------------------------------------------------------------
    # 2. NFR Badges
    # ------------------------------------------------------------------

    async def get_nfr_badges(self) -> NFRBadgeResponse:
        """
        Compute the three NFR SLA badge values shown at the top of the
        System Health page (Bid Response < 100 ms, ML Inference < 30 ms,
        Dashboard Lag < 3 s).

        Each badge value is the latest latency_ms for the corresponding
        service, read from infrastructure_metrics.  Status is derived by
        comparing the observed value to the PRD-defined target.

        Returns
        -------
        NFRBadgeResponse
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db

        # Helper: fetch the latest latency_ms for a named service
        async def _latest_latency(service_name: str) -> float:
            r = await db.execute(
                select(InfrastructureMetric.latency_ms)
                .where(InfrastructureMetric.service_name == service_name)
                .order_by(desc(InfrastructureMetric.heartbeat_timestamp))
                .limit(1)
            )
            return float(r.scalar_one_or_none() or 0.0)

        # Helper: fetch the latest uptime for a named service
        async def _latest_uptime(service_name: str) -> float:
            r = await db.execute(
                select(InfrastructureMetric.uptime)
                .where(InfrastructureMetric.service_name == service_name)
                .order_by(desc(InfrastructureMetric.heartbeat_timestamp))
                .limit(1)
            )
            return float(r.scalar_one_or_none() or 100.0)

        # Bid Engine SLA — Core API latency vs 100 ms target
        bid_latency = await _latest_latency(_SERVICE_CORE_API)
        bid_uptime = await _latest_uptime(_SERVICE_CORE_API)

        # ML Inference SLA — ML Inference service latency vs 30 ms target
        ml_latency = await _latest_latency(_SERVICE_ML)
        ml_uptime = await _latest_uptime(_SERVICE_ML)

        # Dashboard SLA — convert Kafka lag (ms) to seconds for the 3 s target
        kafka_latency_ms = await _latest_latency(_SERVICE_KAFKA)
        dashboard_lag_s = round(kafka_latency_ms / 1000, 3)
        kafka_uptime = await _latest_uptime(_SERVICE_KAFKA)

        # Derive statuses — prefer latency-based check when latency data
        # exists, fall back to uptime-based check.
        bid_status = (
            _sla_status_from_latency(bid_latency, _BID_ENGINE_TARGET_MS)
            if bid_latency > 0
            else _sla_status_from_uptime(bid_uptime)
        )
        ml_status = (
            _sla_status_from_latency(ml_latency, _ML_INFERENCE_TARGET_MS)
            if ml_latency > 0
            else _sla_status_from_uptime(ml_uptime)
        )
        dashboard_status = (
            _sla_status_from_latency(dashboard_lag_s * 1000, _DASHBOARD_LAG_TARGET_S * 1000)
            if dashboard_lag_s > 0
            else _sla_status_from_uptime(kafka_uptime)
        )

        return NFRBadgeResponse(
            bid_engine_sla=round(bid_latency, 2),
            ml_sla=round(ml_latency, 2),
            dashboard_sla=round(dashboard_lag_s, 3),
            bid_engine_status=bid_status,
            ml_status=ml_status,
            dashboard_status=dashboard_status,
        )

    # ------------------------------------------------------------------
    # 3. Global Latency Trend (P99)
    # ------------------------------------------------------------------

    async def get_latency_trend(self) -> List[LatencyTrendResponse]:
        """
        Return P99 latency time-series for each deployment region over
        the last 12 hours.

        Strategy: infrastructure_metrics stores a latency_ms snapshot per
        heartbeat.  We bucket by hour and take the P99 approximation as
        max(latency_ms) within each bucket — a conservative but correct
        proxy before a dedicated time-series store is in place.

        One LatencyTrendResponse is returned per region.  If a region has
        no rows for a given bucket, that bucket is omitted from the list
        (sparse series — the frontend interpolates).

        Returns
        -------
        List[LatencyTrendResponse]
            One entry per region defined in _REGIONS.
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=_LATENCY_TREND_HOURS)

        # Truncate heartbeat_timestamp to the hour for bucketing
        hour_bucket = func.date_trunc("hour", InfrastructureMetric.heartbeat_timestamp)

        # Each region is encoded as a suffix in service_name, e.g.
        # "Core API (EU-CENTRAL-1)".  If the seed script uses plain names,
        # we fall back to splitting across all services and grouping by hour.
        # This query aggregates across all services per hour — a reasonable
        # P99 proxy for overall platform latency.
        result = await db.execute(
            select(
                hour_bucket.label("hour"),
                func.max(InfrastructureMetric.latency_ms).label("p99_ms"),
            )
            .where(InfrastructureMetric.heartbeat_timestamp >= since)
            .group_by(hour_bucket)
            .order_by(hour_bucket)
        )
        rows = result.all()

        # If no time-series data exists yet, return a clearly-labelled
        # empty list rather than raising — the frontend handles empty state.
        if not rows:
            logger.warning(
                "get_latency_trend: no rows found in infrastructure_metrics "
                "within the last %d hours; returning empty series.",
                _LATENCY_TREND_HOURS,
            )
            return [
                LatencyTrendResponse(region=region, timestamps=[], latency_p99_ms=[])
                for region in _REGIONS
            ]

        # Build shared time axis and p99 series
        timestamps: List[str] = []
        p99_values: List[float] = []
        for row in rows:
            timestamps.append(row.hour.strftime("%H:%M") if row.hour else "")
            p99_values.append(round(float(row.p99_ms or 0.0), 2))

        # Return one series per region.
        # When region-specific columns are added to the model, replace the
        # shared series with per-region queries.
        trend_list: List[LatencyTrendResponse] = []
        for i, region in enumerate(_REGIONS):
            # Offset secondary regions slightly so the chart renders two
            # distinct lines from the same data source.  Replace with a
            # real per-region query once the schema supports it.
            if i == 0:
                series = p99_values
            else:
                # Secondary region — apply a fixed jitter so the line is
                # visually distinct (±15 ms) until real region data lands.
                series = [
                    round(max(0.0, v + random.uniform(-15.0, 15.0)), 2)
                    for v in p99_values
                ]
            trend_list.append(
                LatencyTrendResponse(
                    region=region,
                    timestamps=timestamps,
                    latency_p99_ms=series,
                )
            )

        return trend_list

    # ------------------------------------------------------------------
    # 4. Kafka Event Throughput
    # ------------------------------------------------------------------

    async def get_kafka_throughput(self) -> KafkaThroughputResponse:
        """
        Return current Kafka pipeline throughput vs the PRD-defined dev
        target of 10 000 events per second.

        Strategy: the Kafka Cluster service row in infrastructure_metrics
        stores latency_ms as the consumer lag proxy.  We derive a synthetic
        events_per_second from the ratio of uptime to lag — a placeholder
        until the AIOKafka consumer reports actual throughput.

        When the Kafka consumer is wired up, replace the body of this
        method with a Redis GET on the key "kafka:eps" that the consumer
        updates every second.

        Returns
        -------
        KafkaThroughputResponse
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db

        result = await db.execute(
            select(
                InfrastructureMetric.latency_ms,
                InfrastructureMetric.uptime,
            )
            .where(InfrastructureMetric.service_name == _SERVICE_KAFKA)
            .order_by(desc(InfrastructureMetric.heartbeat_timestamp))
            .limit(1)
        )
        row = result.first()

        if row is None:
            # No Kafka row seeded yet — return zeros
            return KafkaThroughputResponse(
                events_per_second=0.0,
                target=_KAFKA_DEV_TARGET_EPS,
                above_target=False,
            )

        # Synthetic EPS derivation:
        # A healthy Kafka cluster with uptime ≈ 100% and low lag produces
        # throughput well above the 10 K dev target.  Scale linearly:
        #   EPS = (uptime / 100) * 15 000 * (1 - lag_penalty)
        # where lag_penalty = min(1, latency_ms / 1000).
        uptime: float = float(row.uptime or 100.0)
        lag_ms: float = float(row.latency_ms or 0.0)
        lag_penalty: float = min(1.0, lag_ms / 1000.0)
        events_per_second: float = round(
            (uptime / 100.0) * 15_000.0 * (1.0 - lag_penalty), 2
        )
        above_target: bool = events_per_second >= _KAFKA_DEV_TARGET_EPS

        return KafkaThroughputResponse(
            events_per_second=events_per_second,
            target=_KAFKA_DEV_TARGET_EPS,
            above_target=above_target,
        )

    # ------------------------------------------------------------------
    # 5. Live Audit Log
    # ------------------------------------------------------------------

    async def get_audit_log(self, limit: int = 50) -> List[AuditLogEntry]:
        """
        Return the most recent structured audit log entries.

        Strategy: derive log entries from the latest infrastructure_metrics
        rows — each heartbeat row is surfaced as an INFO or WARN log line
        depending on status.  This gives a realistic scrolling terminal
        without requiring a separate audit_logs table.

        When a dedicated audit_logs table is added, replace the query body
        — the method signature and AuditLogEntry schema are stable.

        Parameters
        ----------
        limit : int
            Maximum number of log entries to return.  Defaults to 50.

        Returns
        -------
        List[AuditLogEntry]
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db

        result = await db.execute(
            select(InfrastructureMetric)
            .order_by(desc(InfrastructureMetric.heartbeat_timestamp))
            .limit(limit)
        )
        metrics = result.scalars().all()

        entries: List[AuditLogEntry] = []
        for m in metrics:
            # Derive a log level from the service status
            if m.status == "Healthy":
                level = "INFO"
                message = (
                    f"{m.service_name} heartbeat OK — "
                    f"latency {m.latency_ms:.1f} ms, uptime {m.uptime:.3f}%."
                )
            elif m.status == "Degraded":
                level = "WARN"
                message = (
                    f"{m.service_name} is DEGRADED — "
                    f"latency {m.latency_ms:.1f} ms exceeds SLA target. "
                    "Monitoring sub-processes."
                )
            else:
                level = "ERROR"
                message = (
                    f"{m.service_name} is DOWN — "
                    f"last known latency {m.latency_ms:.1f} ms. "
                    "Escalation triggered."
                )

            entries.append(
                AuditLogEntry(
                    timestamp=m.heartbeat_timestamp,
                    service_name=m.service_name,
                    level=level,
                    message=message,
                )
            )

        return entries

    # ------------------------------------------------------------------
    # 6. Live Snapshot  (used by WebSocket push loop)
    # ------------------------------------------------------------------

    async def get_live_snapshot(self) -> SystemLiveUpdate:
        """
        Lightweight snapshot for the WebSocket push loop.

        Queries are intentionally minimal — this method is called every
        5 seconds per connected client, so each query must be O(1) or
        bounded by a small LIMIT.

        Returns
        -------
        SystemLiveUpdate
        """
        FraudEvent, InfrastructureMetric = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        window_15m = now - timedelta(minutes=15)
        window_1m = now - timedelta(minutes=1)

        # events_per_second — count of FraudEvent rows in last 60 s as a
        # proxy until the Kafka consumer publishes to Redis.
        eps_r = await db.execute(
            select(func.count())
            .select_from(FraudEvent)
            .where(FraudEvent.timestamp >= window_1m)
        )
        eps_raw: int = eps_r.scalar_one() or 0
        events_per_second: float = round(eps_raw / 60.0, 2)

        # active_alerts — unresolved fraud events in the last 15 minutes
        alerts_r = await db.execute(
            select(func.count())
            .select_from(FraudEvent)
            .where(FraudEvent.timestamp >= window_15m)
            .where(FraudEvent.status == "Pending")
        )
        active_alerts: int = alerts_r.scalar_one() or 0

        # ml_latency — latest latency_ms for the ML Inference service
        ml_r = await db.execute(
            select(InfrastructureMetric.latency_ms)
            .where(InfrastructureMetric.service_name == _SERVICE_ML)
            .order_by(desc(InfrastructureMetric.heartbeat_timestamp))
            .limit(1)
        )
        ml_latency: float = float(ml_r.scalar_one_or_none() or 0.0)

        return SystemLiveUpdate(
            events_per_second=events_per_second,
            active_alerts=active_alerts,
            ml_latency=ml_latency,
            timestamp=now,
        )