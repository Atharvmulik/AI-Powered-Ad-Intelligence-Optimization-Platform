"""
Dashboard REST API router.

Prefix  : /api/v1/dashboard
Tag     : Dashboard

All endpoints are async, use response_model validation, and delegate
entirely to DashboardService.  HTTPException is raised on known error
conditions; unhandled exceptions propagate to the global exception handler.

Pagination notes
----------------
Endpoints that return lists accept optional `limit` / `offset` query
parameters (defaulted to sane values) so the frontend can page through
large result sets without schema changes.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.dashboard import (
    AIRecommendationResponse,
    CampaignAnalyticsResponse,
    CTRTrendResponse,
    ExecutiveSummaryResponse,
    FraudAlertResponse,
    GeographicTrafficResponse,
    OverviewResponse,
    SHAPExplanationResponse,
    SystemHealthResponse,
    TopAdResponse,
)
from app.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ---------------------------------------------------------------------------
# Dependency — DashboardService factory
# ---------------------------------------------------------------------------

async def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
) -> DashboardService:
    """Provide a DashboardService with an injected async DB session."""
    return DashboardService(db=db)


# ---------------------------------------------------------------------------
# 1. KPI Overview
# ---------------------------------------------------------------------------

@router.get(
    "/overview",
    response_model=OverviewResponse,
    summary="KPI Overview",
    description=(
        "Returns top-level KPI metrics: total clicks, CTR, active users "
        "(last 15 min), average fraud score, total revenue, and current "
        "events-per-second ingestion rate."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_overview(
    service: DashboardService = Depends(get_dashboard_service),
) -> OverviewResponse:
    try:
        return await service.get_overview()
    except Exception as exc:
        logger.exception("Failed to compute overview KPIs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute overview metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. Executive Summary
# ---------------------------------------------------------------------------

@router.get(
    "/executive-summary",
    response_model=ExecutiveSummaryResponse,
    summary="Executive Summary",
    description=(
        "Returns an AI-generated executive summary paragraph and a list of "
        "insight cards (CTR trend, fraud trend, revenue delta, top audience)."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_executive_summary(
    service: DashboardService = Depends(get_dashboard_service),
) -> ExecutiveSummaryResponse:
    try:
        return await service.get_executive_summary()
    except Exception as exc:
        logger.exception("Failed to generate executive summary")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate executive summary.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. CTR Trend
# ---------------------------------------------------------------------------

@router.get(
    "/ctr-trend",
    response_model=CTRTrendResponse,
    summary="Hourly CTR Trend (24 h)",
    description=(
        "Returns paired timestamp and CTR arrays covering the last 24 hours "
        "in hourly buckets.  Suitable for rendering a time-series chart."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_ctr_trend(
    service: DashboardService = Depends(get_dashboard_service),
) -> CTRTrendResponse:
    try:
        return await service.get_ctr_trend()
    except Exception as exc:
        logger.exception("Failed to fetch CTR trend")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve CTR trend data.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. Campaign Analytics
# ---------------------------------------------------------------------------

@router.get(
    "/campaign-analytics",
    response_model=CampaignAnalyticsResponse,
    summary="Campaign Analytics",
    description=(
        "Aggregated campaign performance after fraud filtering: raw clicks, "
        "fraud-filtered clicks, effective CTR, conversions, and total revenue."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_campaign_analytics(
    service: DashboardService = Depends(get_dashboard_service),
) -> CampaignAnalyticsResponse:
    try:
        return await service.get_campaign_analytics()
    except Exception as exc:
        logger.exception("Failed to compute campaign analytics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute campaign analytics.",
        ) from exc


# ---------------------------------------------------------------------------
# 5. Top Performing Ads
# ---------------------------------------------------------------------------

@router.get(
    "/top-ads",
    response_model=List[TopAdResponse],
    summary="Top Performing Campaigns",
    description=(
        "Returns the top N campaigns sorted by CTR descending.  "
        "Includes ROAS, fraud click count, and spend for each campaign."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_top_ads(
    limit: int = Query(default=10, ge=1, le=100, description="Number of campaigns to return"),
    service: DashboardService = Depends(get_dashboard_service),
) -> List[TopAdResponse]:
    try:
        return await service.get_top_ads(limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch top ads")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve top performing ads.",
        ) from exc


# ---------------------------------------------------------------------------
# 6. Geographic Traffic
# ---------------------------------------------------------------------------

@router.get(
    "/geographic-traffic",
    response_model=List[GeographicTrafficResponse],
    summary="Geographic Traffic Breakdown",
    description=(
        "Aggregated traffic, fraud rate, conversion rate, and top campaign "
        "per city.  Returns up to 50 cities ordered by traffic volume."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_geographic_traffic(
    service: DashboardService = Depends(get_dashboard_service),
) -> List[GeographicTrafficResponse]:
    try:
        return await service.get_geographic_traffic()
    except Exception as exc:
        logger.exception("Failed to fetch geographic traffic")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve geographic traffic data.",
        ) from exc


# ---------------------------------------------------------------------------
# 7. Fraud Alert Center
# ---------------------------------------------------------------------------

@router.get(
    "/fraud-alerts",
    response_model=List[FraudAlertResponse],
    summary="Fraud Alert Feed",
    description=(
        "Returns the most recent fraud events ordered by timestamp descending. "
        "Defaults to the latest 20 alerts; adjustable via the `limit` parameter."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_fraud_alerts(
    limit: int = Query(default=20, ge=1, le=200, description="Max fraud alerts to return"),
    service: DashboardService = Depends(get_dashboard_service),
) -> List[FraudAlertResponse]:
    try:
        return await service.get_fraud_alerts(limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch fraud alerts")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve fraud alerts.",
        ) from exc


# ---------------------------------------------------------------------------
# 8. SHAP Explanations
# ---------------------------------------------------------------------------

@router.get(
    "/explanations/{campaign_id}",
    response_model=SHAPExplanationResponse,
    summary="SHAP Feature Explanations",
    description=(
        "Returns SHAP feature attributions for the specified campaign.  "
        "This endpoint is ML-service–ready: the service layer currently "
        "returns typed placeholder data that will be replaced with real "
        "SHAP values once the ML pipeline integration is complete."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_campaign_explanations(
    campaign_id: int,
    service: DashboardService = Depends(get_dashboard_service),
) -> SHAPExplanationResponse:
    # 404 is raised inside the service layer; let it propagate.
    try:
        return await service.get_campaign_explanations(campaign_id=campaign_id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch SHAP explanations for campaign %d", campaign_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve SHAP explanations.",
        ) from exc


# ---------------------------------------------------------------------------
# 9. System Health
# ---------------------------------------------------------------------------

@router.get(
    "/system-health",
    response_model=List[SystemHealthResponse],
    summary="Infrastructure Health",
    description=(
        "Returns the latest heartbeat record for every registered service "
        "(Kafka, Redis, ML services, PostgreSQL, etc.)."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_system_health(
    service: DashboardService = Depends(get_dashboard_service),
) -> List[SystemHealthResponse]:
    try:
        return await service.get_system_health()
    except Exception as exc:
        logger.exception("Failed to fetch system health")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve system health metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 10. AI Recommendations
# ---------------------------------------------------------------------------

@router.get(
    "/recommendations",
    response_model=List[AIRecommendationResponse],
    summary="AI Business Recommendations",
    description=(
        "Returns data-driven business recommendations derived from live "
        "platform analytics: fraud thresholds, budget reallocation, "
        "audience targeting, and campaign scaling suggestions."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_ai_recommendations(
    service: DashboardService = Depends(get_dashboard_service),
) -> List[AIRecommendationResponse]:
    try:
        return await service.get_ai_recommendations()
    except Exception as exc:
        logger.exception("Failed to generate AI recommendations")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate AI recommendations.",
        ) from exc