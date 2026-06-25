"""
Campaigns API Router — /api/v1/campaigns

All endpoints delegate exclusively to CampaignsService via dependency injection.
No SQL, no business logic lives here.

Conventions:
  - response_model on every route
  - Descriptive summary + description for OpenAPI docs
  - HTTPException with meaningful detail strings
  - Async throughout
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.campaigns import (
    CampaignIntelligenceResponse,
    FraudFeedResponse,
    FraudSummaryResponse,
    LiveOverviewResponse,
    PlacementAgentResponse,
    PlacementLogResponse,
    ReportResponse,
    SHAPCampaignResponse,
    ScheduledReportResponse,
    TopAdResponse,
)
from app.services.campaigns_service import CampaignsService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"],
)


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------


async def get_campaigns_service(
    db: AsyncSession = Depends(get_db),
) -> CampaignsService:
    """Inject CampaignsService with a scoped AsyncSession."""
    return CampaignsService(db=db)


# ---------------------------------------------------------------------------
# 1. Live Performance Monitor
# ---------------------------------------------------------------------------


@router.get(
    "/live-overview",
    response_model=LiveOverviewResponse,
    summary="Live Performance Overview",
    description=(
        "Returns real-time platform KPIs: events per second, active users, "
        "fraud blocked today, average ML inference latency, and the last 20 "
        "time-bucketed chart data points for CTR and fraud rate."
    ),
)
async def live_overview(
    service: CampaignsService = Depends(get_campaigns_service),
) -> LiveOverviewResponse:
    try:
        return await service.get_live_overview()
    except Exception as exc:
        logger.error("GET /live-overview failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch live overview metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. Campaign Intelligence
# ---------------------------------------------------------------------------


@router.get(
    "/intelligence",
    response_model=CampaignIntelligenceResponse,
    summary="Campaign Intelligence",
    description=(
        "Returns per-campaign KPIs including budget, spend, revenue, ROAS, CPA, "
        "click quality (raw vs clean vs fraud-filtered), fraud risk rating, "
        "channel, bid strategy, and status."
    ),
)
async def campaign_intelligence(
    service: CampaignsService = Depends(get_campaigns_service),
) -> CampaignIntelligenceResponse:
    try:
        return await service.get_campaign_intelligence()
    except Exception as exc:
        logger.error("GET /intelligence failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch campaign intelligence.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. Top Performing Ads
# ---------------------------------------------------------------------------


@router.get(
    "/top-ads",
    response_model=List[TopAdResponse],
    summary="Top Performing Ads",
    description=(
        "Returns the top 10 ads ranked by click-through rate (CTR), computed "
        "from click_events joined with ad_creatives and ad_campaigns."
    ),
)
async def top_ads(
    service: CampaignsService = Depends(get_campaigns_service),
) -> List[TopAdResponse]:
    try:
        return await service.get_top_ads()
    except Exception as exc:
        logger.error("GET /top-ads failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top ads.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. Reports Center
# ---------------------------------------------------------------------------


@router.get(
    "/reports",
    response_model=List[ReportResponse],
    summary="Reports Center",
    description="Returns all generated reports ordered by creation date, newest first.",
)
async def reports(
    service: CampaignsService = Depends(get_campaigns_service),
) -> List[ReportResponse]:
    try:
        return await service.get_reports()
    except Exception as exc:
        logger.error("GET /reports failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch reports.",
        ) from exc


# ---------------------------------------------------------------------------
# 5. Scheduled Reports
# ---------------------------------------------------------------------------


@router.get(
    "/scheduled-reports",
    response_model=List[ScheduledReportResponse],
    summary="Scheduled Reports",
    description=(
        "Returns all scheduled report definitions including frequency, "
        "next scheduled run time, and enabled status."
    ),
)
async def scheduled_reports(
    service: CampaignsService = Depends(get_campaigns_service),
) -> List[ScheduledReportResponse]:
    try:
        return await service.get_scheduled_reports()
    except Exception as exc:
        logger.error("GET /scheduled-reports failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch scheduled reports.",
        ) from exc


# ---------------------------------------------------------------------------
# 6. Fraud Detection Feed
# ---------------------------------------------------------------------------


@router.get(
    "/fraud-feed",
    response_model=FraudFeedResponse,
    summary="Fraud Detection Feed",
    description=(
        "Returns the 20 most recent fraud events ordered by timestamp descending. "
        "Each entry includes IP address, fraud score, category, status, and severity."
    ),
)
async def fraud_feed(
    service: CampaignsService = Depends(get_campaigns_service),
) -> FraudFeedResponse:
    try:
        return await service.get_fraud_feed()
    except Exception as exc:
        logger.error("GET /fraud-feed failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud feed.",
        ) from exc


# ---------------------------------------------------------------------------
# 7. Fraud Summary
# ---------------------------------------------------------------------------


@router.get(
    "/fraud-summary",
    response_model=FraudSummaryResponse,
    summary="Fraud Summary Analytics",
    description=(
        "Returns today's aggregated fraud analytics: blocked event count, "
        "model precision and recall, estimated budget saved, and distribution "
        "percentages across Clean / Suspicious / Blocked event statuses."
    ),
)
async def fraud_summary(
    service: CampaignsService = Depends(get_campaigns_service),
) -> FraudSummaryResponse:
    try:
        return await service.get_fraud_summary()
    except Exception as exc:
        logger.error("GET /fraud-summary failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud summary.",
        ) from exc


# ---------------------------------------------------------------------------
# 8. Smart Placement Agent
# ---------------------------------------------------------------------------


@router.get(
    "/placement-agent",
    response_model=List[PlacementLogResponse],
    summary="Smart Placement Agent",
    description=(
        "Returns the 3 most recent PPO placement agent decisions with action, "
        "expected reward, episode number, and creation timestamp."
    ),
)
async def placement_agent(
    service: CampaignsService = Depends(get_campaigns_service),
) -> List[PlacementLogResponse]:
    try:
        return await service.get_placement_agent()
    except Exception as exc:
        logger.error("GET /placement-agent failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch placement agent data.",
        ) from exc


# ---------------------------------------------------------------------------
# 9. SHAP / ML Prediction Insights
# ---------------------------------------------------------------------------


@router.get(
    "/shap-insights",
    response_model=List[SHAPCampaignResponse],
    summary="SHAP ML Prediction Insights",
    description=(
        "Returns SHAP feature importance values grouped by campaign, with "
        "aggregated predicted CTR and AUC scores for the current model version."
    ),
)
async def shap_insights(
    service: CampaignsService = Depends(get_campaigns_service),
) -> List[SHAPCampaignResponse]:
    try:
        return await service.get_shap_insights()
    except Exception as exc:
        logger.error("GET /shap-insights failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch SHAP insights.",
        ) from exc
