"""
AI Insight REST API router.

Prefix  : /api/v1/aiinsight
Tag     : AI Insight

All endpoints are async, use response_model validation, and delegate
entirely to AIInsightService. HTTPException is raised on known error
conditions; unhandled exceptions propagate to the global exception handler.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.aiinsight import (
    AudienceResponse,
    CampaignInsightResponse,
    InfrastructureResponse,
    ModelStatusResponse,
    OverviewResponse,
    PredictionResponse,
    RecommendationResponse,
    ShapResponse,
)
from app.services.aiinsight_service import AIInsightService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/aiinsight",
    tags=["AI Insight"],
)


# ---------------------------------------------------------------------------
# Dependency — AIInsightService factory
# ---------------------------------------------------------------------------

async def get_aiinsight_service(
    db: AsyncSession = Depends(get_db),
) -> AIInsightService:
    """Provide an AIInsightService with an injected async DB session."""
    return AIInsightService(db=db)


# ---------------------------------------------------------------------------
# 1. Overview
# ---------------------------------------------------------------------------

@router.get(
    "/overview",
    response_model=OverviewResponse,
    summary="AI Insight Overview",
    description=(
        "Returns top-level AI insight KPIs including total predictions, "
        "average CTR prediction, average fraud probability, average "
        "recommendation score, active models, and the latest update time."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_overview(
    service: AIInsightService = Depends(get_aiinsight_service),
) -> OverviewResponse:
    try:
        return await service.get_overview()
    except Exception as exc:
        logger.exception("Failed to compute AI insight overview")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute overview metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. Model Status
# ---------------------------------------------------------------------------

@router.get(
    "/model-status",
    response_model=ModelStatusResponse,
    summary="Model Status",
    description=(
        "Returns the status of each model version observed in the prediction "
        "logs, including activity, latency, uptime, and accuracy when available."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_model_status(
    service: AIInsightService = Depends(get_aiinsight_service),
) -> ModelStatusResponse:
    try:
        return await service.get_model_status()
    except Exception as exc:
        logger.exception("Failed to fetch AI model status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve model status.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. Predictions
# ---------------------------------------------------------------------------

@router.get(
    "/predictions",
    response_model=PredictionResponse,
    summary="Recent Predictions",
    description=(
        "Returns the most recent prediction log rows with campaign, ad, and "
        "model metadata for downstream analysis."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_predictions(
    limit: int = Query(default=50, ge=1, le=200, description="Max predictions to return"),
    service: AIInsightService = Depends(get_aiinsight_service),
) -> PredictionResponse:
    try:
        return await service.get_predictions(limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch AI predictions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve predictions.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. SHAP Insights
# ---------------------------------------------------------------------------

@router.get(
    "/shap",
    response_model=ShapResponse,
    summary="SHAP Feature Insights",
    description=(
        "Returns SHAP feature attribution rows for campaigns, ordered by the "
        "latest created timestamp."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_shap(
    campaign_id: Optional[int] = Query(default=None, description="Optional campaign filter"),
    limit: int = Query(default=50, ge=1, le=200, description="Max SHAP rows to return"),
    service: AIInsightService = Depends(get_aiinsight_service),
) -> ShapResponse:
    try:
        return await service.get_shap(campaign_id=campaign_id, limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch SHAP insights")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve SHAP insights.",
        ) from exc


# ---------------------------------------------------------------------------
# 5. Recommendations
# ---------------------------------------------------------------------------

@router.get(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Recommendation Logs",
    description=(
        "Returns the latest recommendation log rows together with their "
        "explanations and recommendation scores."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_recommendations(
    limit: int = Query(default=50, ge=1, le=200, description="Max recommendations to return"),
    service: AIInsightService = Depends(get_aiinsight_service),
) -> RecommendationResponse:
    try:
        return await service.get_recommendations(limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch AI recommendations")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve recommendations.",
        ) from exc


# ---------------------------------------------------------------------------
# 6. Audience Segments
# ---------------------------------------------------------------------------

@router.get(
    "/audience-segments",
    response_model=AudienceResponse,
    summary="Audience Segments",
    description=(
        "Returns active audience segments and their top contributing features."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_audience_segments(
    top_features_limit: int = Query(default=3, ge=1, le=10, description="Max feature names per segment"),
    service: AIInsightService = Depends(get_aiinsight_service),
) -> AudienceResponse:
    try:
        return await service.get_audience_segments(top_features_limit=top_features_limit)
    except Exception as exc:
        logger.exception("Failed to fetch audience segments")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve audience segments.",
        ) from exc


# ---------------------------------------------------------------------------
# 7. Infrastructure
# ---------------------------------------------------------------------------

@router.get(
    "/infrastructure",
    response_model=InfrastructureResponse,
    summary="Infrastructure Health",
    description=(
        "Returns the latest heartbeat status for every registered AI-related "
        "service and infrastructure component."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_infrastructure(
    service: AIInsightService = Depends(get_aiinsight_service),
) -> InfrastructureResponse:
    try:
        return await service.get_infrastructure()
    except Exception as exc:
        logger.exception("Failed to fetch infrastructure metrics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve infrastructure metrics.",
        ) from exc


# ---------------------------------------------------------------------------
# 8. Campaign Insight
# ---------------------------------------------------------------------------

@router.get(
    "/campaign/{campaign_id}",
    response_model=CampaignInsightResponse,
    summary="Campaign Insight",
    description=(
        "Returns a consolidated AI insight view for a specific campaign, "
        "including spend, revenue, CTR, latest prediction, SHAP features, "
        "and the latest recommendation."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_campaign_insight(
    campaign_id: int,
    service: AIInsightService = Depends(get_aiinsight_service),
) -> CampaignInsightResponse:
    try:
        insight = await service.get_campaign_insight(campaign_id=campaign_id)
        if insight is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found.",
            )
        return insight
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch campaign insight for %d", campaign_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve campaign insight.",
        ) from exc
