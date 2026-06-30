"""
Analytics API Router — /api/v1/analytics

All endpoints delegate exclusively to AnalyticsService via dependency injection.
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
from app.schemas.analytics import (
    AIGrowthPredictionResponse,
    AnalyticsOverviewResponse,
    AnalyticsTerminalResponse,
    CTRTrendResponse,
    CampaignPerformanceResponse,
    ClickDistributionResponse,
    ConversionFunnelResponse,
    DeviceSplitResponse,
    EngagementResponse,
    FraudMonitorResponse,
    PlacementPerformanceResponse,
    ReportResponse,
    ScheduledReportResponse,
    TopAdAnalyticsResponse,
    UserInterestResponse,
)
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------


async def get_analytics_service(
    db: AsyncSession = Depends(get_db),
) -> AnalyticsService:
    """Inject AnalyticsService with a scoped AsyncSession."""
    return AnalyticsService(db=db)


# ---------------------------------------------------------------------------
# 1. Analytics Overview
# ---------------------------------------------------------------------------


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Analytics Overview",
    description=(
        "Returns the top-level analytics dashboard KPIs including active users, "
        "events per second, average bid latency, current and previous fraud rate, "
        "current and previous CTR, and aggregated summary metrics used for "
        "period-over-period comparison cards."
    ),
)
async def analytics_overview(
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsOverviewResponse:
    try:
        return await service.get_overview()
    except Exception as exc:
        logger.error("GET /overview failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics overview.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. Live CTR Trend
# ---------------------------------------------------------------------------


@router.get(
    "/ctr-trend",
    response_model=CTRTrendResponse,
    summary="Live CTR Trend",
    description=(
        "Returns a rolling click-through rate graph consisting of the last 20 "
        "time-bucketed data points, the current overall CTR, and the configured "
        "target CTR threshold for visual reference on the trend chart."
    ),
)
async def ctr_trend(
    service: AnalyticsService = Depends(get_analytics_service),
) -> CTRTrendResponse:
    try:
        return await service.get_ctr_trend()
    except Exception as exc:
        logger.error("GET /ctr-trend failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch CTR trend data.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. Click Distribution
# ---------------------------------------------------------------------------


@router.get(
    "/click-distribution",
    response_model=ClickDistributionResponse,
    summary="Click Distribution by Channel",
    description=(
        "Returns the breakdown of total clicks across advertising channels "
        "such as Search Ads and Social Media, with per-channel click counts "
        "and percentage share of total clicks for the current period."
    ),
)
async def click_distribution(
    service: AnalyticsService = Depends(get_analytics_service),
) -> ClickDistributionResponse:
    try:
        return await service.get_click_distribution()
    except Exception as exc:
        logger.error("GET /click-distribution failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch click distribution data.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. Engagement Analytics
# ---------------------------------------------------------------------------


@router.get(
    "/engagement",
    response_model=EngagementResponse,
    summary="Engagement Analytics",
    description=(
        "Returns user engagement metrics including average session duration "
        "(seconds), bounce rate, a composite engagement score, and the count "
        "of returning users within the current measurement window."
    ),
)
async def engagement(
    service: AnalyticsService = Depends(get_analytics_service),
) -> EngagementResponse:
    try:
        return await service.get_engagement()
    except Exception as exc:
        logger.error("GET /engagement failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch engagement analytics.",
        ) from exc


# ---------------------------------------------------------------------------
# 5. Device Split
# ---------------------------------------------------------------------------


@router.get(
    "/device-split",
    response_model=DeviceSplitResponse,
    summary="Device Split",
    description=(
        "Returns the percentage distribution of active users across device "
        "categories: Desktop, Mobile, and Tablet, along with the total user "
        "count used as the denominator for percentage calculations."
    ),
)
async def device_split(
    service: AnalyticsService = Depends(get_analytics_service),
) -> DeviceSplitResponse:
    try:
        return await service.get_device_split()
    except Exception as exc:
        logger.error("GET /device-split failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch device split data.",
        ) from exc


# ---------------------------------------------------------------------------
# 6. Top Performing Ads
# ---------------------------------------------------------------------------


@router.get(
    "/top-ads",
    response_model=List[TopAdAnalyticsResponse],
    summary="Top Performing Ads",
    description=(
        "Returns a ranked list of the best-performing ads by CTR, including "
        "each ad's rank, associated campaign name, category, CTR percentage, "
        "revenue generated, current delivery status, and brand identifier."
    ),
)
async def top_ads(
    service: AnalyticsService = Depends(get_analytics_service),
) -> List[TopAdAnalyticsResponse]:
    try:
        return await service.get_top_ads()
    except Exception as exc:
        logger.error("GET /top-ads failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top performing ads.",
        ) from exc


# ---------------------------------------------------------------------------
# 7. AI Growth Prediction
# ---------------------------------------------------------------------------


@router.get(
    "/ai-growth",
    response_model=AIGrowthPredictionResponse,
    summary="AI Growth Prediction",
    description=(
        "Returns the ML model's forward-looking growth forecast including "
        "predicted growth percentage, prediction accuracy, recommended budget "
        "increase, confidence level, a time-series forecast array, and the "
        "current model version powering the prediction."
    ),
)
async def ai_growth_prediction(
    service: AnalyticsService = Depends(get_analytics_service),
) -> AIGrowthPredictionResponse:
    try:
        return await service.get_ai_growth_prediction()
    except Exception as exc:
        logger.error("GET /ai-growth failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch AI growth prediction.",
        ) from exc


# ---------------------------------------------------------------------------
# 8. User Interests
# ---------------------------------------------------------------------------


@router.get(
    "/interest-distribution",
    response_model=UserInterestResponse,
    summary="User Interest Distribution",
    description=(
        "Returns the distribution of user interest categories inferred from "
        "click and engagement behaviour, with each category's label and its "
        "percentage share of the total interest signal."
    ),
)
async def interest_distribution(
    service: AnalyticsService = Depends(get_analytics_service),
) -> UserInterestResponse:
    try:
        return await service.get_user_interests()
    except Exception as exc:
        logger.error("GET /interest-distribution failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user interest distribution.",
        ) from exc


# ---------------------------------------------------------------------------
# 9. Conversion Funnel
# ---------------------------------------------------------------------------


@router.get(
    "/conversion-funnel",
    response_model=ConversionFunnelResponse,
    summary="Conversion Funnel",
    description=(
        "Returns the full advertising conversion funnel broken down into "
        "Impressions, Clicks, Conversions, and Revenue Events stages. Each "
        "stage includes the absolute count, the drop-off percentage from the "
        "previous stage, and the cumulative conversion rate from the top of "
        "the funnel."
    ),
)
async def conversion_funnel(
    service: AnalyticsService = Depends(get_analytics_service),
) -> ConversionFunnelResponse:
    try:
        return await service.get_conversion_funnel()
    except Exception as exc:
        logger.error("GET /conversion-funnel failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversion funnel data.",
        ) from exc


# ---------------------------------------------------------------------------
# 10. Placement Performance
# ---------------------------------------------------------------------------


@router.get(
    "/placement-performance",
    response_model=PlacementPerformanceResponse,
    summary="Placement Performance",
    description=(
        "Returns performance metrics for each ad placement slot, including "
        "impression count, CTR, revenue generated, a relative performance "
        "percentage against the best-performing placement, and a flag "
        "indicating whether this slot is the top performer."
    ),
)
async def placement_performance(
    service: AnalyticsService = Depends(get_analytics_service),
) -> PlacementPerformanceResponse:
    try:
        return await service.get_placement_performance()
    except Exception as exc:
        logger.error("GET /placement-performance failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch placement performance data.",
        ) from exc


# ---------------------------------------------------------------------------
# 11. Fraud Monitor
# ---------------------------------------------------------------------------


@router.get(
    "/fraud-monitor",
    response_model=FraudMonitorResponse,
    summary="Fraud Monitor",
    description=(
        "Returns a real-time fraud monitoring snapshot including the latest "
        "fraud events with severity and fraud score, aggregated counts for "
        "Blocked, Flagged, and Clean events today, and the overall fraud "
        "score computed across active traffic."
    ),
)
async def fraud_monitor(
    service: AnalyticsService = Depends(get_analytics_service),
) -> FraudMonitorResponse:
    try:
        return await service.get_fraud_monitor()
    except Exception as exc:
        logger.error("GET /fraud-monitor failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch fraud monitor data.",
        ) from exc


# ---------------------------------------------------------------------------
# 12. Campaign Performance
# ---------------------------------------------------------------------------


@router.get(
    "/campaign-performance",
    response_model=CampaignPerformanceResponse,
    summary="Campaign Performance",
    description=(
        "Returns an aggregated performance summary across all campaigns, "
        "including campaign name, advertiser, total clicks, fraud-filtered "
        "click count, effective CTR (post-fraud-filter), total spend, "
        "return on ad spend (ROAS), and current delivery status."
    ),
)
async def campaign_performance(
    service: AnalyticsService = Depends(get_analytics_service),
) -> CampaignPerformanceResponse:
    try:
        return await service.get_campaign_performance()
    except Exception as exc:
        logger.error("GET /campaign-performance failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch campaign performance data.",
        ) from exc


# ---------------------------------------------------------------------------
# 13. Analytics Terminal
# ---------------------------------------------------------------------------


@router.get(
    "/system-terminal",
    response_model=AnalyticsTerminalResponse,
    summary="Analytics System Terminal",
    description=(
        "Returns the latest AI system log entries from the ML pipeline and "
        "placement agent, each entry including timestamp, log type, severity "
        "level, and processing status. Used to power the live terminal view "
        "on the analytics dashboard."
    ),
)
async def system_terminal(
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsTerminalResponse:
    try:
        return await service.get_terminal_logs()
    except Exception as exc:
        logger.error("GET /system-terminal failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch system terminal logs.",
        ) from exc


# ---------------------------------------------------------------------------
# 14. Reports Center
# ---------------------------------------------------------------------------


@router.get(
    "/reports",
    response_model=List[ReportResponse],
    summary="Analytics Reports",
    description=(
        "Returns all generated analytics reports ordered by creation date, "
        "newest first. Each record includes the report title, type, page count, "
        "file size, download path, and creation timestamp."
    ),
)
async def reports(
    service: AnalyticsService = Depends(get_analytics_service),
) -> List[ReportResponse]:
    try:
        return await service.get_reports()
    except Exception as exc:
        logger.error("GET /reports failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics reports.",
        ) from exc


# ---------------------------------------------------------------------------
# 15. Scheduled Reports
# ---------------------------------------------------------------------------


@router.get(
    "/scheduled-reports",
    response_model=List[ScheduledReportResponse],
    summary="Scheduled Analytics Reports",
    description=(
        "Returns all scheduled report definitions including report name, "
        "delivery frequency, next scheduled run time, and enabled status. "
        "Ordered by next run date ascending so the most imminent reports "
        "appear first."
    ),
)
async def scheduled_reports(
    service: AnalyticsService = Depends(get_analytics_service),
) -> List[ScheduledReportResponse]:
    try:
        return await service.get_scheduled_reports()
    except Exception as exc:
        logger.error("GET /scheduled-reports failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch scheduled analytics reports.",
        ) from exc