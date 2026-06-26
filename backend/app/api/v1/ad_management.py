"""
Ad Management REST API router.

Prefix  : /api/v1/ad-management   (prefix="/ad-management" here; "/api/v1"
          is applied at mount time in main.py, identical to dashboard.py)
Tag     : Ad Management

All endpoints are async, use response_model validation, and delegate
entirely to AdManagementService.  HTTPException is raised on known error
conditions; unhandled exceptions propagate to the global exception handler.

Pagination notes
----------------
GET /campaigns accepts an optional `limit` query parameter (defaulted to a
sane value) so the frontend can page through large result sets without
schema changes — identical in spirit to GET /dashboard/top-ads.
"""

from __future__ import annotations

import logging, uuid, os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.ad_management import (
    ApplyActionResponse,
    CampaignCreateRequest,
    CampaignResponse,
    CampaignUpdateRequest,
    GlobalStatusResponse,
    NetworkHealthResponse,
    OptimizationFeedItem,
)
from app.services.ad_management_service import AdManagementService, CampaignNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ad-management",
    tags=["Ad Management"],
)


# ---------------------------------------------------------------------------
# Dependency — AdManagementService factory
# ---------------------------------------------------------------------------

async def get_ad_management_service(
    db: AsyncSession = Depends(get_db),
) -> AdManagementService:
    """Provide an AdManagementService with an injected async DB session."""
    return AdManagementService(db=db)


# ---------------------------------------------------------------------------
# 1. Active Ad Portfolio
# ---------------------------------------------------------------------------

@router.get(
    "/campaigns",
    response_model=List[CampaignResponse],
    summary="Active Ad Portfolio",
    description=(
        "Returns all campaigns for the Active Ad Portfolio table: CTR, "
        "status, fraud risk, engagement, and budget/spend/revenue figures. "
        "Supports optional search by name and filters by status and fraud risk."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_campaigns(
    limit: int = Query(default=100, ge=1, le=500, description="Number of campaigns to return"),
    search: Optional[str] = Query(default=None, description="Filter by campaign name (case-insensitive)"),
    campaign_status: Optional[str] = Query(default=None, alias="status", description="Filter by status: ACTIVE | PAUSED | HALTED"),
    fraud_risk: Optional[str] = Query(default=None, description="Filter by fraud risk: Low | Medium | Critical"),
    service: AdManagementService = Depends(get_ad_management_service),
) -> List[CampaignResponse]:
    try:
        return await service.get_campaigns(
            limit=limit,
            search=search,
            status=campaign_status,
            fraud_risk=fraud_risk,
        )
    except Exception as exc:
        logger.exception("Failed to fetch campaigns")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve campaigns.",
        ) from exc


# ---------------------------------------------------------------------------
# 2. Create Campaign
# ---------------------------------------------------------------------------

@router.post(
    "/campaigns",
    response_model=CampaignResponse,
    summary="Create Campaign",
    description=(
        "Creates a new AdCampaign and its first AdCreative in a single "
        "transaction, from the Create AI-Optimized Creative form payload."
    ),
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign(
    payload: CampaignCreateRequest,
    service: AdManagementService = Depends(get_ad_management_service),
) -> CampaignResponse:
    try:
        return await service.create_campaign(payload=payload)
    except Exception as exc:
        logger.exception("Failed to create campaign")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create campaign.",
        ) from exc


# ---------------------------------------------------------------------------
# 3. Update Campaign (pause / resume / edit)
# ---------------------------------------------------------------------------

@router.patch(
    "/campaigns/{campaign_id}",
    response_model=CampaignResponse,
    summary="Update Campaign",
    description=(
        "Applies a partial update to an existing campaign — pause, resume, "
        "or edit budget, targeting, bid strategy, or creative fields."
    ),
    status_code=status.HTTP_200_OK,
)
async def update_campaign(
    campaign_id: int,
    payload: CampaignUpdateRequest,
    service: AdManagementService = Depends(get_ad_management_service),
) -> CampaignResponse:
    try:
        return await service.update_campaign(campaign_id=campaign_id, payload=payload)
    except CampaignNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to update campaign %d", campaign_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update campaign.",
        ) from exc


# ---------------------------------------------------------------------------
# 4. Network Health Score
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 4. Network Health Score
# ---------------------------------------------------------------------------

@router.get(
    "/network-health",
    response_model=NetworkHealthResponse,
    summary="Network Health Score",
    description=(
        "Returns the weighted Network Health Score: 50% CTR vs benchmark, "
        "30% inverse fraud score, 20% ratio of active campaigns, plus a "
        "human-readable label and narrative."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_network_health(
    service: AdManagementService = Depends(get_ad_management_service),
):
    try:
        print("ROUTER START")

        result = await service.get_network_health()

        print("SERVICE RETURNED")
        print(result)

        print("ROUTER RETURNING")

        return result

    except Exception as exc:
        print("ROUTER EXCEPTION:", exc)
        logger.exception("Failed to compute network health")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute network health score.",
        ) from exc

# ---------------------------------------------------------------------------
# 5. AI Optimization Feed
# ---------------------------------------------------------------------------


@router.get(
    "/network-health",
    response_model=NetworkHealthResponse,
    summary="Network Health Score",
    description=(
        "Returns the weighted Network Health Score: 50% CTR vs benchmark, "
        "30% inverse fraud score, 20% ratio of active campaigns, plus a "
        "human-readable label and narrative."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_network_health(
    service: AdManagementService = Depends(get_ad_management_service),
):
    try:
        print("ROUTER START")

        result = await service.get_network_health()

        print("SERVICE RETURNED")
        print(result)

        print("ROUTER RETURNING")

        return result

    except Exception as exc:
        print("ROUTER EXCEPTION:", exc)
        logger.exception("Failed to compute network health")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute network health score.",
        ) from exc

# ---------------------------------------------------------------------------
# 5. AI Optimization Feed
# ---------------------------------------------------------------------------

@router.get(
    "/optimization-feed",
    response_model=List[OptimizationFeedItem],
    summary="AI Optimization Feed",
    description=(
        "Returns data-driven optimization recommendations: audience "
        "expansion, device allocation, and prime-time bidding suggestions."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_optimization_feed(
    service: AdManagementService = Depends(get_ad_management_service),
) -> List[OptimizationFeedItem]:
    try:
        return await service.get_optimization_feed()
    except Exception as exc:
        logger.exception("Failed to generate optimization feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate optimization feed.",
        ) from exc


# ---------------------------------------------------------------------------
# 6. Apply Optimization Recommendation
# ---------------------------------------------------------------------------

@router.post(
    "/optimization-feed/{item_id}/apply",
    response_model=ApplyActionResponse,
    summary="Apply Optimization Recommendation",
    description=(
        "Applies the specified optimization recommendation, writes an "
        "audit log entry, and publishes a Kafka event stub."
    ),
    status_code=status.HTTP_200_OK,
)
# NEW
async def apply_optimization_recommendation(
    item_id: str,
    service: AdManagementService = Depends(get_ad_management_service),
) -> ApplyActionResponse:
    try:
        return await service.apply_recommendation(item_id=item_id)
    except CampaignNotFoundError as exc:        # ← replaces the old HTTPException catch
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to apply optimization recommendation %s", item_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not apply optimization recommendation.",
        ) from exc

# ---------------------------------------------------------------------------
# 7. Global Status
# ---------------------------------------------------------------------------

@router.get(
    "/global-status",
    response_model=GlobalStatusResponse,
    summary="Global Campaign Status Breakdown",
    description=(
        "Returns the Running / Paused / Expired percentage breakdown across "
        "all campaigns, for the Global Status donut."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_global_status(
    service: AdManagementService = Depends(get_ad_management_service),
) -> GlobalStatusResponse:
    try:
        return await service.get_global_status()
    except Exception as exc:
        logger.exception("Failed to compute global status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not compute global status breakdown.",
        ) from exc
    

# ---------------------------------------------------------------------------
# 8. Delete Campaign
# ---------------------------------------------------------------------------

@router.delete(
    "/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Campaign",
    description=(
        "Permanently deletes a campaign and its associated creatives."
    ),
)
async def delete_campaign(
    campaign_id: int,
    service: AdManagementService = Depends(get_ad_management_service),
) -> None:
    try:
        await service.delete_campaign(campaign_id=campaign_id)
    except CampaignNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to delete campaign %d", campaign_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete campaign.",
        ) from exc


@router.post("/campaigns/upload-creative", status_code=200)
async def upload_creative(file: UploadFile = File(...)):
    allowed = {"image/png", "image/jpeg", "video/mp4"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Unsupported file type")
    filename = f"{uuid.uuid4()}_{file.filename}"
    save_path = f"uploads/{filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(await file.read())
    return {"image_url": f"/static/{filename}"}