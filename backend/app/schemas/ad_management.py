"""
Pydantic schemas for the Ad Management module.

All response models are fully typed and validated, following the same
conventions as app/schemas/dashboard.py:
    * model_config = ConfigDict(from_attributes=True) on every ORM-backed model
    * Field(..., description=..., ge=/le=...) for constraints
    * Plain BaseModel composition for nested objects (no inheritance tricks)

Designed for future Redis caching and Kafka stream integration, matching
the dashboard module's _cache_get / _cache_set / _publish_event stubs.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


# ---------------------------------------------------------------------------
# Shared constant choices — kept here so router/service can import the same
# source of truth instead of re-declaring literals.
# ---------------------------------------------------------------------------

ALLOWED_AD_FORMATS = {"Banner", "Video", "Native"}
ALLOWED_BID_STRATEGIES = {"CPC", "CPM", "CPA"}
ALLOWED_FRAUD_RISK = {"Low", "Medium", "Critical"}
ALLOWED_CAMPAIGN_STATUSES = {"ACTIVE", "PAUSED", "HALTED"}
ALLOWED_AUDIENCE_TAGS = {
    "Gen-Z", "Millennials", "Urban Commuters", "Tech Early Adopters",
    "Sports Enthusiasts", "Gamers", "Parents", "Students", "Professionals",
    "High-Income", "Budget-Conscious", "Mobile Users", "Desktop Users",
    "Night Owls", "Weekend Shoppers",
}


# ---------------------------------------------------------------------------
# 1. Campaign Create Request
# ---------------------------------------------------------------------------

class CampaignCreateRequest(BaseModel):
    """Request body for creating a new campaign + its first creative.

    Maps directly to the "Create AI-Optimized Creative" form fields.
    """

    campaign_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Campaign title shown in the Active Ad Portfolio table",
        examples=["Winter Performance Boost"],
    )
    daily_budget: float = Field(
        ...,
        gt=0.0,
        description="Daily budget cap in USD; must be greater than zero",
        examples=[1500.00],
    )
    ad_format: str = Field(
        default="Banner",
        description="One of: Banner | Video | Native",
        examples=["Banner"],
    )
    start_date: date = Field(
        ...,
        description="Campaign start date",
        examples=["2026-07-01"],
    )
    end_date: date = Field(
        ...,
        description="Campaign end date; must not be before start_date",
        examples=["2026-07-31"],
    )
    bid_strategy: str = Field(
        default="CPC",
        description="One of: CPC | CPM | CPA",
        examples=["CPC"],
    )
    target_demographics: List[str] = Field(
        ...,
        min_length=1,
        description="Audience segment tags; each must be from the allowed list",
        examples=[["Gen-Z", "Urban Commuters", "Tech Early Adopters"]],
    )
    category: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Ad category for content-based filtering",
        examples=["Technology"],
    )
    keywords: List[str] = Field(
        default_factory=list,
        description="Free-form keyword tags for TF-IDF matching",
        examples=[["performance", "lifestyle", "trending"]],
    )
    image_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL of the uploaded creative asset, if provided",
        examples=["https://cdn.adai.app/creatives/winter-boost.png"],
    )

    @field_validator("ad_format")
    @classmethod
    def _validate_ad_format(cls, v: str) -> str:
        if v not in ALLOWED_AD_FORMATS:
            raise ValueError(f"ad_format must be one of {sorted(ALLOWED_AD_FORMATS)}")
        return v

    @field_validator("bid_strategy")
    @classmethod
    def _validate_bid_strategy(cls, v: str) -> str:
        if v not in ALLOWED_BID_STRATEGIES:
            raise ValueError(f"bid_strategy must be one of {sorted(ALLOWED_BID_STRATEGIES)}")
        return v

    @field_validator("target_demographics")
    @classmethod
    def _validate_target_demographics(cls, v: List[str]) -> List[str]:
        invalid = [tag for tag in v if tag not in ALLOWED_AUDIENCE_TAGS]
        if invalid:
            raise ValueError(f"Invalid audience tag(s): {invalid}")
        return v

    @model_validator(mode="after")
    def _validate_date_range(self) -> "CampaignCreateRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        return self


# ---------------------------------------------------------------------------
# 2. Campaign Update Request
# ---------------------------------------------------------------------------

class CampaignUpdateRequest(BaseModel):
    """Partial update payload for PATCH /campaigns/{campaign_id}.

    All fields optional; only provided fields are applied.
    """

    campaign_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        examples=["Winter Performance Boost — Phase 2"],
    )
    daily_budget: Optional[float] = Field(
        default=None,
        gt=0.0,
        examples=[2000.00],
    )
    ad_format: Optional[str] = Field(
        default=None,
        description="One of: Banner | Video | Native",
        examples=["Video"],
    )
    start_date: Optional[date] = Field(default=None, examples=["2026-07-01"])
    end_date: Optional[date] = Field(default=None, examples=["2026-08-15"])
    bid_strategy: Optional[str] = Field(
        default=None,
        description="One of: CPC | CPM | CPA",
        examples=["CPM"],
    )
    target_demographics: Optional[List[str]] = Field(
        default=None,
        examples=[["Gamers", "Mobile Users"]],
    )
    category: Optional[str] = Field(default=None, max_length=100, examples=["Gaming"])
    keywords: Optional[List[str]] = Field(
        default=None,
        examples=[["console", "new-release"]],
    )
    image_url: Optional[str] = Field(default=None, max_length=500)
    status: Optional[str] = Field(
        default=None,
        description="One of: ACTIVE | PAUSED | HALTED",
        examples=["PAUSED"],
    )

    @field_validator("ad_format")
    @classmethod
    def _validate_ad_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_AD_FORMATS:
            raise ValueError(f"ad_format must be one of {sorted(ALLOWED_AD_FORMATS)}")
        return v

    @field_validator("bid_strategy")
    @classmethod
    def _validate_bid_strategy(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_BID_STRATEGIES:
            raise ValueError(f"bid_strategy must be one of {sorted(ALLOWED_BID_STRATEGIES)}")
        return v

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_CAMPAIGN_STATUSES:
            raise ValueError(f"status must be one of {sorted(ALLOWED_CAMPAIGN_STATUSES)}")
        return v

    @field_validator("target_demographics")
    @classmethod
    def _validate_target_demographics(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        invalid = [tag for tag in v if tag not in ALLOWED_AUDIENCE_TAGS]
        if invalid:
            raise ValueError(f"Invalid audience tag(s): {invalid}")
        return v

    @model_validator(mode="after")
    def _validate_date_range(self) -> "CampaignUpdateRequest":
        if self.start_date is not None and self.end_date is not None:
            if self.end_date < self.start_date:
                raise ValueError("end_date must not be before start_date")
        return self


# ---------------------------------------------------------------------------
# 3. Campaign Response
# ---------------------------------------------------------------------------

class CampaignResponse(BaseModel):
    """Single campaign row for the Active Ad Portfolio table."""

    model_config = ConfigDict(from_attributes=True)

    campaign_id: int = Field(..., description="Primary key", examples=[101])
    advertiser_id: str = Field(..., examples=["adv_001"])
    campaign_name: str = Field(..., examples=["Nike Air Max Pro — Q4 Campaign"])
    ad_format: str = Field(..., description="Banner | Video | Native", examples=["Banner"])
    bid_strategy: str = Field(..., description="CPC | CPM | CPA", examples=["CPC"])
    budget: float = Field(..., ge=0.0, examples=[150000.00])
    spend: float = Field(..., ge=0.0, examples=[98500.00])
    revenue: float = Field(..., ge=0.0, examples=[212000.00])
    ctr: float = Field(..., ge=0.0, le=100.0, description="Click-through rate as a percentage", examples=[3.42])
    status: str = Field(..., description="ACTIVE | PAUSED | HALTED", examples=["ACTIVE"])
    fraud_risk: str = Field(..., description="Low | Medium | Critical", examples=["Low"])
    engagement_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Engagement score shown as the progress bar in the portfolio table",
        examples=[72.5],
    )
    target_demographics: List[str] = Field(
        default_factory=list,
        examples=[["Gen-Z", "Urban Commuters"]],
    )
    start_date: Optional[date] = Field(default=None, examples=["2026-07-01"])
    end_date: Optional[date] = Field(default=None, examples=["2026-07-31"])
    thumbnail_url: Optional[str] = Field(
        default=None,
        description="URL of the latest creative asset for the portfolio thumbnail",
        examples=["https://cdn.adai.app/creatives/nike-air-max-v1.png"],
    )

# ---------------------------------------------------------------------------
# 4. Network Health Response
# ---------------------------------------------------------------------------

class NetworkHealthResponse(BaseModel):
    """Network Health Score donut shown on the right rail."""

    model_config = ConfigDict(from_attributes=True)

    score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Weighted health score: 50% CTR vs benchmark, 30% inverse fraud, 20% active ratio",
        examples=[92],
    )
    label: str = Field(
        ...,
        description="Human-readable status label, e.g. 'Optimum', 'Stable', 'At Risk'",
        examples=["Optimum"],
    )
    narrative: str = Field(
        ...,
        description="One-line AI-generated explanation of the score",
        examples=["Ad relevance is at peak efficiency for 84% of clusters."],
    )


# ---------------------------------------------------------------------------
# 5. AI Optimization Feed Item
# ---------------------------------------------------------------------------

class OptimizationFeedItem(BaseModel):
    """Single card in the AI Optimization Feed panel."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Stable identifier used by the apply endpoint", examples=["audience-expansion-001"])
    title: str = Field(..., examples=["Audience Expansion"])
    description: str = Field(
        ...,
        examples=["High affinity detected in 'Solo Travelers' (Europe). Re-targeting recommended."],
    )
    icon_type: str = Field(
        ...,
        description="Icon key the frontend maps to a Material symbol, e.g. 'audience', 'device', 'time'",
        examples=["audience"],
    )
    recommended_action: str = Field(..., examples=["Apply Recommendation"])
    priority: str = Field(
        default="MEDIUM",
        description="HIGH | MEDIUM | LOW",
        examples=["HIGH"],
    )

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: str) -> str:
        allowed = {"HIGH", "MEDIUM", "LOW"}
        if v not in allowed:
            raise ValueError(f"priority must be one of {sorted(allowed)}")
        return v


# ---------------------------------------------------------------------------
# 6. Apply Action Response
# ---------------------------------------------------------------------------

class ApplyActionResponse(BaseModel):
    """Confirmation payload returned after applying an optimization action."""

    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(..., examples=[True])
    message: str = Field(
        ...,
        examples=["Budget reallocation applied. Mobile pools increased by 15%."],
    )
    applied_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp when the action was applied",
        examples=["2026-06-21T14:32:05Z"],
    )


# ---------------------------------------------------------------------------
# 7. Global Status Response
# ---------------------------------------------------------------------------

class GlobalStatusResponse(BaseModel):
    """Running / Paused / Expired donut breakdown."""

    model_config = ConfigDict(from_attributes=True)

    running_pct: float = Field(..., ge=0.0, le=100.0, examples=[64.0])
    paused_pct: float = Field(..., ge=0.0, le=100.0, examples=[24.0])
    expired_pct: float = Field(..., ge=0.0, le=100.0, examples=[12.0])

    @model_validator(mode="after")
    def _validate_sums_to_100(self) -> "GlobalStatusResponse":
        total = self.running_pct + self.paused_pct + self.expired_pct
        if abs(total - 100.0) > 0.5:
            raise ValueError(
                f"running_pct + paused_pct + expired_pct must be ~100.0 (±0.5), got {total:.2f}"
            )
        return self


# ---------------------------------------------------------------------------
# 8. WebSocket Live Log Message
# ---------------------------------------------------------------------------

class AnalysisLogMessage(BaseModel):
    """Single line pushed over WS /ws/ad-management/live every ~4 seconds.

    Mirrors the role DashboardLiveUpdate plays for the Dashboard WS feed —
    a dedicated streaming payload schema, separate from REST response models.
    """

    log_type: str = Field(
        ...,
        description="INTELLIGENCE | INGESTION | OPTIMIZATION | FRAUD_DETECTION",
        examples=["FRAUD_DETECTION"],
    )
    message: str = Field(
        ...,
        examples=["Blocked suspicious traffic burst from node IP.202.12.x."],
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        examples=["2026-06-21T14:57:33Z"],
    )

    @field_validator("log_type")
    @classmethod
    def _validate_log_type(cls, v: str) -> str:
        allowed = {"INTELLIGENCE", "INGESTION", "OPTIMIZATION", "FRAUD_DETECTION"}
        if v not in allowed:
            raise ValueError(f"log_type must be one of {sorted(allowed)}")
        return v