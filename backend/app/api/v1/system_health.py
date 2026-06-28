"""
System Health REST API router.

Prefix  : /api/v1/system-health
Tag     : System Health

All endpoints are async, use response_model validation, and delegate
entirely to SystemHealthService.  HTTPException is raised on known error
conditions; unhandled exceptions propagate to the global exception handler.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.system_health import (
    AuditLogEntry,
    KafkaThroughputResponse,
    LatencyTrendResponse,
    NFRBadgeResponse,
    ServiceHealthResponse,
)
from app.services.system_health_service import SystemHealthService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/system-health",
    tags=["System Health"],
)


# ---------------------------------------------------------------------------
# Dependency — SystemHealthService factory
# ---------------------------------------------------------------------------

async def get_system_health_service(
    db: AsyncSession = Depends(get_db),
) -> SystemHealthService:
    """Provide a SystemHealthService with an injected async DB session."""
    return SystemHealthService(db=db)


# ---------------------------------------------------------------------------
# 1. Service Health Cards
# ---------------------------------------------------------------------------

@router.get(
    "/services",
    response_model=List[ServiceHealthResponse],
    summary="Service Health Cards",
    description=(
        "Returns the latest heartbeat record for every registered infrastructure "
        "service (Core API, Kafka Cluster, Redis Cache, ML Inference, Fraud "
        "Detection, PostgreSQL).  Results are sorted alphabetically by service name."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_services(
    service: SystemHealthService = Depends(get_system_health_service),
) -> List[ServiceHealthResponse]:
    try:
        return await service.get_service_cards()
    except Exception as exc:
        logger.exception("Failed to fetch service health cards")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve service health cards.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. NFR Badges
# ---------------------------------------------------------------------------

@router.get(
    "/nfr-badges",
    response_model=NFRBadgeResponse,
    summary="NFR SLA Badges",
    description=(
        "Returns the three non-functional requirement SLA badge values shown "
        "at the top of the System Health page: Bid Response (target < 100 ms), "
        "ML Inference (target < 30 ms), and Dashboard Lag (target < 3 s).  "
        "Each badge includes a status field: OK | WARNING | BREACH."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_nfr_badges(
    service: SystemHealthService = Depends(get_system_health_service),
) -> NFRBadgeResponse:
    try:
        return await service.get_nfr_badges()
    except Exception as exc:
        logger.exception("Failed to compute NFR badges")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute NFR SLA badges.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. Global Latency Trend (P99)
# ---------------------------------------------------------------------------

@router.get(
    "/latency-trend",
    response_model=List[LatencyTrendResponse],
    summary="Global Latency Trend (P99)",
    description=(
        "Returns P99 latency time-series for each deployment region over the "
        "last 12 hours in hourly buckets.  One LatencyTrendResponse is returned "
        "per region (EU-CENTRAL-1, US-EAST-1).  Suitable for rendering the "
        "dual-line Global Latency chart."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_latency_trend(
    service: SystemHealthService = Depends(get_system_health_service),
) -> List[LatencyTrendResponse]:
    try:
        return await service.get_latency_trend()
    except Exception as exc:
        logger.exception("Failed to fetch latency trend")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve latency trend data.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. Kafka Event Throughput
# ---------------------------------------------------------------------------

@router.get(
    "/kafka-throughput",
    response_model=KafkaThroughputResponse,
    summary="Kafka Event Throughput",
    description=(
        "Returns the current Kafka pipeline throughput in events per second, "
        "the configured dev target (10 000 events/s), and a boolean flag "
        "indicating whether the pipeline is above target.  "
        "Suitable for rendering the Kafka Event Throughput panel and its "
        "'Above 10K dev target' badge."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_kafka_throughput(
    service: SystemHealthService = Depends(get_system_health_service),
) -> KafkaThroughputResponse:
    try:
        return await service.get_kafka_throughput()
    except Exception as exc:
        logger.exception("Failed to fetch Kafka throughput")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve Kafka throughput metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 5. Live Audit Log
# ---------------------------------------------------------------------------

@router.get(
    "/audit-log",
    response_model=List[AuditLogEntry],
    summary="Live Audit Log",
    description=(
        "Returns the most recent structured audit log entries ordered by "
        "timestamp descending.  Defaults to the latest 50 entries; adjustable "
        "via the `limit` parameter.  Entries are derived from infrastructure "
        "heartbeat records and surfaced as INFO, WARN, or ERROR lines — "
        "matching the terminal panel in the System Health UI."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_audit_log(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
        description="Maximum number of audit log entries to return",
    ),
    service: SystemHealthService = Depends(get_system_health_service),
) -> List[AuditLogEntry]:
    try:
        return await service.get_audit_log(limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch audit log")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve audit log entries.",
        ) from exc