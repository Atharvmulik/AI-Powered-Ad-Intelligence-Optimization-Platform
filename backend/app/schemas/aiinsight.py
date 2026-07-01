"""
Pydantic schemas for the AI Insight module.

All response models are fully typed and validated, following the same
conventions as app/schemas/dashboard.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

class OverviewResponse(BaseModel):
    """KPI summary cards for the AI Insight overview panel."""

    model_config = ConfigDict(from_attributes=True)

    total_predictions: int = Field(..., description="Total prediction log rows recorded", ge=0)
    average_ctr_prediction: float = Field(
        ..., description="Average predicted click-through rate as a percentage (0–100)", ge=0.0, le=100.0
    )
    average_fraud_probability: float = Field(
        ..., description="Average predicted fraud probability as a percentage (0–100)", ge=0.0, le=100.0
    )
    average_recommendation_score: float = Field(
        ..., description="Average recommendation score across all logged predictions", ge=0.0
    )
    active_models: int = Field(..., description="Distinct model versions seen in the prediction logs", ge=0)
    last_updated: datetime = Field(..., description="Timestamp of the most recent prediction log")


# ---------------------------------------------------------------------------
# Model Status
# ---------------------------------------------------------------------------

class ModelStatusItem(BaseModel):
    """Status card for a single deployed model version."""

    model_config = ConfigDict(from_attributes=True)

    model_name: str = Field(..., description="Human-readable model identifier")
    model_version: str = Field(..., description="Model version tag as logged by the inference service")
    status: str = Field(..., description="'Active' or 'Idle', derived from recent prediction activity")
    predictions_today: int = Field(..., ge=0, description="Predictions logged since midnight UTC")
    average_latency: float = Field(..., ge=0.0, description="Average inference latency in milliseconds")
    uptime: float = Field(..., ge=0.0, le=100.0, description="Percentage of the last 24 hourly buckets with activity")
    accuracy: Optional[float] = Field(
        None, ge=0.0, le=100.0, description="Prediction accuracy vs. observed click outcomes, if measurable"
    )
    last_prediction_time: datetime = Field(..., description="Timestamp of this model's most recent prediction")


class ModelStatusResponse(BaseModel):
    """Collection of model status cards."""

    model_config = ConfigDict(from_attributes=True)

    models: List[ModelStatusItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------

class PredictionItem(BaseModel):
    """Single prediction log row."""

    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    campaign_name: Optional[str] = None
    ad_id: str
    click_probability: float = Field(..., ge=0.0, le=1.0)
    fraud_probability: float = Field(..., ge=0.0, le=1.0)
    recommendation_score: float = Field(..., ge=0.0)
    model_version: str
    inference_latency_ms: float = Field(..., ge=0.0)


class PredictionResponse(BaseModel):
    """Collection of the latest prediction log rows."""

    model_config = ConfigDict(from_attributes=True)

    predictions: List[PredictionItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# SHAP Insights
# ---------------------------------------------------------------------------

class ShapFeatureItem(BaseModel):
    """Single SHAP feature attribution row for a campaign."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: Optional[str] = None
    feature_name: str
    shap_value: float
    predicted_ctr: float = Field(..., ge=0.0, le=100.0)
    auc_score: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime


class ShapResponse(BaseModel):
    """Collection of SHAP feature attribution rows."""

    model_config = ConfigDict(from_attributes=True)

    features: List[ShapFeatureItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

class RecommendationItem(BaseModel):
    """Single recommendation log row."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: Optional[str] = None
    ad_id: str
    recommendation_score: float = Field(..., ge=0.0)
    explanation: Optional[str] = None
    timestamp: datetime


class RecommendationResponse(BaseModel):
    """Collection of recommendation log rows."""

    model_config = ConfigDict(from_attributes=True)

    recommendations: List[RecommendationItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Audience Insights
# ---------------------------------------------------------------------------

class AudienceInsightItem(BaseModel):
    """Single audience segment card with its top contributing features."""

    model_config = ConfigDict(from_attributes=True)

    segment_name: str
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    reach: int = Field(..., ge=0)
    growth_pct: float = Field(..., description="Segment growth rate as a percentage")
    mobile_pct: float = Field(..., ge=0.0, le=100.0)
    desktop_pct: float = Field(..., ge=0.0, le=100.0)
    tablet_pct: float = Field(..., ge=0.0, le=100.0)
    fraud_risk: Optional[str] = None
    avg_ctr: float = Field(..., ge=0.0, le=100.0)
    tags: List[str] = Field(default_factory=list)
    top_features: List[str] = Field(default_factory=list, description="Top contributing feature names")


class AudienceResponse(BaseModel):
    """Collection of audience segment insight cards."""

    model_config = ConfigDict(from_attributes=True)

    segments: List[AudienceInsightItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------

class InfrastructureItem(BaseModel):
    """Health status row for a single infrastructure service."""

    model_config = ConfigDict(from_attributes=True)

    service_name: str
    status: str
    uptime: float = Field(..., ge=0.0, le=100.0)
    latency: float = Field(..., ge=0.0)
    heartbeat: datetime


class InfrastructureResponse(BaseModel):
    """Collection of infrastructure health rows."""

    model_config = ConfigDict(from_attributes=True)

    services: List[InfrastructureItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Campaign Insight (single campaign deep-dive)
# ---------------------------------------------------------------------------

class CampaignInsightResponse(BaseModel):
    """Consolidated AI insight view for a single campaign."""

    model_config = ConfigDict(from_attributes=True)

    campaign_name: str
    budget: float = Field(..., ge=0.0)
    spend: float = Field(..., ge=0.0)
    revenue: float = Field(..., ge=0.0)
    ctr: float = Field(..., ge=0.0, le=100.0)
    click_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    fraud_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    recommendation_score: Optional[float] = Field(None, ge=0.0)
    roas: float = Field(..., ge=0.0, description="Return on Ad Spend = revenue / spend")
    top_shap_features: List[ShapFeatureItem] = Field(default_factory=list)
    recommendation_explanation: Optional[str] = None


# ---------------------------------------------------------------------------
# WebSocket Live Update Payload
# ---------------------------------------------------------------------------

class AIInsightLiveUpdate(BaseModel):
    """Payload pushed over the AI Insight WebSocket channel."""

    total_predictions_today: int = Field(..., ge=0)
    average_ctr_prediction: float = Field(..., ge=0.0, le=100.0)
    average_fraud_probability: float = Field(..., ge=0.0, le=100.0)
    active_models: int = Field(..., ge=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)