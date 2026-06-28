"""
API router for the Audience module.

Endpoint        : /api/v1/audience/*
Layering        : Router -> AudienceService -> ORM. No SQLAlchemy or
                  business logic lives in this file — every handler is a
                  thin pass-through to AudienceService.

Route ordering note
--------------------
GET /segments/insights is registered BEFORE GET /segments/{segment_id} so
that "insights" is never swallowed by the {segment_id}: int path parameter.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.audience import (
    AudienceDemographicsResponse,
    AudienceInsightsListResponse,
    AudienceOverviewResponse,
    AudienceSegmentCreate,
    AudienceSegmentResponse,
    AudienceSegmentUpdate,
    PaginatedAudienceSegmentsResponse,
)
from app.services.audience_service import AudienceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/audience", tags=["Audience"])


# ---------------------------------------------------------------------------
# 1. Overview
# ---------------------------------------------------------------------------

@router.get("/overview", response_model=AudienceOverviewResponse)
async def get_audience_overview(
    db: AsyncSession = Depends(get_db),
) -> AudienceOverviewResponse:
    """Return the four header KPI cards for the Audience page."""
    service = AudienceService(db)
    return await service.get_overview()


# ---------------------------------------------------------------------------
# 2. List Segments
# ---------------------------------------------------------------------------

@router.get("/segments", response_model=PaginatedAudienceSegmentsResponse)
async def list_audience_segments(
    q: Optional[str] = Query(None, description="Free-text search against segment name"),
    fraud_risk: Optional[str] = Query(None, description="'Low' | 'Medium' | 'High'"),
    device: Optional[str] = Query(None, description="'Mobile' | 'Desktop' | 'Tablet'"),
    sort_by: str = Query("avg_ctr", description="'avg_ctr' | 'growth_pct' | 'reach' | 'name'"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedAudienceSegmentsResponse:
    """Return a paginated, filterable, sortable list of audience segments."""
    service = AudienceService(db)
    return await service.list_segments(
        q=q,
        fraud_risk=fraud_risk,
        device=device,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# 3. Segment Insights (SHAP)  — must precede /segments/{segment_id}
# ---------------------------------------------------------------------------

@router.get("/segments/insights", response_model=AudienceInsightsListResponse)
async def get_audience_segment_insights(
    limit: int = Query(3, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> AudienceInsightsListResponse:
    """Return SHAP-style feature-contribution cards for the top segments."""
    service = AudienceService(db)
    return await service.get_segment_insights(limit=limit)


# ---------------------------------------------------------------------------
# 4. Get Segment
# ---------------------------------------------------------------------------

@router.get("/segments/{segment_id}", response_model=AudienceSegmentResponse)
async def get_audience_segment(
    segment_id: int,
    db: AsyncSession = Depends(get_db),
) -> AudienceSegmentResponse:
    """Return a single audience segment by id."""
    service = AudienceService(db)
    segment = await service.get_segment(segment_id)
    if segment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audience segment {segment_id} not found",
        )
    return segment


# ---------------------------------------------------------------------------
# 5. Create Segment
# ---------------------------------------------------------------------------

@router.post(
    "/segments",
    response_model=AudienceSegmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_audience_segment(
    payload: AudienceSegmentCreate,
    db: AsyncSession = Depends(get_db),
) -> AudienceSegmentResponse:
    """Create a new audience segment."""
    service = AudienceService(db)
    return await service.create_segment(payload)


# ---------------------------------------------------------------------------
# 6. Update Segment
# ---------------------------------------------------------------------------

@router.put("/segments/{segment_id}", response_model=AudienceSegmentResponse)
async def update_audience_segment(
    segment_id: int,
    payload: AudienceSegmentUpdate,
    db: AsyncSession = Depends(get_db),
) -> AudienceSegmentResponse:
    """Apply a partial update to an existing audience segment."""
    service = AudienceService(db)
    segment = await service.update_segment(segment_id, payload)
    if segment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audience segment {segment_id} not found",
        )
    return segment


# ---------------------------------------------------------------------------
# 7. Delete Segment
# ---------------------------------------------------------------------------

@router.delete("/segments/{segment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audience_segment(
    segment_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an audience segment and its associated SHAP insight rows."""
    service = AudienceService(db)
    deleted = await service.delete_segment(segment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audience segment {segment_id} not found",
        )
    return None


# ---------------------------------------------------------------------------
# 8. Demographics
# ---------------------------------------------------------------------------

@router.get("/demographics", response_model=AudienceDemographicsResponse)
async def get_audience_demographics(
    db: AsyncSession = Depends(get_db),
) -> AudienceDemographicsResponse:
    """Return platform-wide Gender / Age / Device breakdowns."""
    service = AudienceService(db)
    return await service.get_demographics()