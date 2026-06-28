"""
Pydantic schemas for the Audience module.

All response models are fully typed and validated.
Mirrors the conventions established in dashboard.py and ad_management.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

class AudienceOverviewResponse(BaseModel):
    """KPI summary cards shown at the top of the Audience page."""

    model_config = ConfigDict(from_attributes=True)

    total_addressable_reach: int = Field(..., description="Sum of reach across all active segments", ge=0)
    avg_fraud_risk: str = Field(..., description="Aggregate fraud risk label, e.g. 'Low', 'Medium', 'Low-Medium'")
    live_active_now: int = Field(..., description="Distinct users active in the last 15 minutes", ge=0)
    top_performing_segment: str = Field(..., description="Name of the segment with the highest avg CTR")
    top_performing_segment_ctr: float = Field(..., description="CTR of the top performing segment as a percentage (0–100)", ge=0.0, le=100.0)


# ---------------------------------------------------------------------------
# Segment — Response / Create / Update
# ---------------------------------------------------------------------------

class AudienceSegmentResponse(BaseModel):
    """Single audience segment row for the segments table."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subtitle: Optional[str] = None
    icon_name: str = Field(..., description="Material Symbols icon key, e.g. 'sports_esports'")
    reach: int = Field(..., ge=0)
    growth_pct: float = Field(..., description="Signed growth percentage vs previous period, e.g. -1.2 or 12.4")
    device_mobile_pct: float = Field(..., ge=0.0, le=100.0)
    device_desktop_pct: float = Field(..., ge=0.0, le=100.0)
    device_tablet_pct: float = Field(..., ge=0.0, le=100.0)
    fraud_risk_level: str = Field(..., description="'Low' | 'Medium' | 'High'")
    avg_ctr: float = Field(..., description="Average CTR as a percentage (0–100)", ge=0.0, le=100.0)
    tags: List[str] = Field(default_factory=list, description="Segment tags, e.g. ['High Scroll Depth', 'Evening Peak']")
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class AudienceSegmentCreate(BaseModel):
    """Payload for creating a new audience segment."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    icon_name: str = Field("group", description="Material Symbols icon key")
    reach: int = Field(0, ge=0)
    growth_pct: float = Field(0.0)
    device_mobile_pct: float = Field(0.0, ge=0.0, le=100.0)
    device_desktop_pct: float = Field(0.0, ge=0.0, le=100.0)
    device_tablet_pct: float = Field(0.0, ge=0.0, le=100.0)
    fraud_risk_level: str = Field("Low", description="'Low' | 'Medium' | 'High'")
    avg_ctr: float = Field(0.0, ge=0.0, le=100.0)
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True


class AudienceSegmentUpdate(BaseModel):
    """Partial update payload for an existing audience segment. All fields optional."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    icon_name: Optional[str] = None
    reach: Optional[int] = Field(None, ge=0)
    growth_pct: Optional[float] = None
    device_mobile_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    device_desktop_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    device_tablet_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    fraud_risk_level: Optional[str] = None
    avg_ctr: Optional[float] = Field(None, ge=0.0, le=100.0)
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Segment Listing
# ---------------------------------------------------------------------------

class AudienceSegmentsListResponse(BaseModel):
    """Simple, non-paginated list of audience segments."""

    model_config = ConfigDict(from_attributes=True)

    segments: List[AudienceSegmentResponse] = Field(default_factory=list)
    total: int = Field(..., ge=0, description="Total count of segments returned")


class PaginatedAudienceSegmentsResponse(BaseModel):
    """Paginated audience segments list for the main segments table."""

    model_config = ConfigDict(from_attributes=True)

    items: List[AudienceSegmentResponse] = Field(default_factory=list)
    total: int = Field(..., ge=0, description="Total count of segments matching the query")
    page: int = Field(..., ge=1)
    limit: int = Field(..., ge=1)
    total_pages: int = Field(..., ge=0)


# ---------------------------------------------------------------------------
# Demographics
# ---------------------------------------------------------------------------

class GenderBreakdown(BaseModel):
    """Platform-wide gender distribution."""

    model_config = ConfigDict(from_attributes=True)

    male_pct: float = Field(..., ge=0.0, le=100.0)
    female_pct: float = Field(..., ge=0.0, le=100.0)
    other_pct: float = Field(..., ge=0.0, le=100.0)


class AgeBreakdown(BaseModel):
    """Single age-band percentage entry."""

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(..., description="Age band label, e.g. '18-24'")
    percentage: float = Field(..., ge=0.0, le=100.0)


class DeviceBreakdown(BaseModel):
    """Platform-wide device distribution."""

    model_config = ConfigDict(from_attributes=True)

    mobile_pct: float = Field(..., ge=0.0, le=100.0)
    desktop_pct: float = Field(..., ge=0.0, le=100.0)
    tablet_pct: float = Field(..., ge=0.0, le=100.0)


class AudienceDemographicsResponse(BaseModel):
    """Combined gender, age, and device breakdown for the Audience page."""

    model_config = ConfigDict(from_attributes=True)

    gender: GenderBreakdown
    age_groups: List[AgeBreakdown] = Field(default_factory=list)
    device: DeviceBreakdown


# ---------------------------------------------------------------------------
# SHAP Insights
# ---------------------------------------------------------------------------

class AudienceInsightFeatureItem(BaseModel):
    """Single SHAP feature contribution for a segment. Mirrors SHAPFeatureItem in dashboard.py."""

    model_config = ConfigDict(from_attributes=True)

    feature: str = Field(..., description="Feature name, e.g. 'user_interest=gaming'")
    contribution: float = Field(..., description="SHAP-style contribution value, e.g. 0.31")


class AudienceInsightResponse(BaseModel):
    """AI-driven SHAP explanation card for a single segment."""

    model_config = ConfigDict(from_attributes=True)

    segment_id: int
    segment_name: str
    features: List[AudienceInsightFeatureItem] = Field(default_factory=list)
    recommended_because: str = Field(..., description="Explanation string, e.g. 'Recommended because of user_interest=gaming'")


class AudienceInsightsListResponse(BaseModel):
    """Wrapper for the 'AI-Driven Segment Insights' card grid."""

    model_config = ConfigDict(from_attributes=True)

    insights: List[AudienceInsightResponse] = Field(default_factory=list)