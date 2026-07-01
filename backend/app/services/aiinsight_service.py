"""
AIInsightService — service layer for the AI Insight module.

All database I/O is encapsulated here.  The router layer calls this class
exclusively; no SQLAlchemy or raw SQL leaks into the API layer.

Architecture notes
------------------
* Async SQLAlchemy sessions are used throughout (AsyncSession).
* Every public method is an async coroutine.
* Follows exactly the same conventions as app/services/dashboard_service.py:
  lazy model imports, async-first design, no raw SQL, typed Pydantic
  response models, timezone-aware datetimes, and graceful handling of an
  empty database (empty lists / zeroed metrics instead of exceptions).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import cast, String, func

from app.schemas.aiinsight import (
    AIInsightLiveUpdate,
    AudienceInsightItem,
    AudienceResponse,
    CampaignInsightResponse,
    InfrastructureItem,
    InfrastructureResponse,
    ModelStatusItem,
    ModelStatusResponse,
    PredictionItem,
    PredictionResponse,
    RecommendationItem,
    RecommendationResponse,
    ShapFeatureItem,
    ShapResponse,
    OverviewResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy model imports — prevents circular imports while keeping the service
# decoupled from db/ model definitions.
# ---------------------------------------------------------------------------

def _models():
    """Return ORM model classes at call time to avoid circular imports."""
    from app.db.models import (  # noqa: PLC0415
        AdCampaign,
        AdCreative,
        AudienceSegment,
        AudienceSegmentInsight,
        ClickEvent,
        FraudEvent,
        InfrastructureMetric,
        MLPredictionLog,
        RecommendationLog,
        ShapInsight,
        User,
    )
    return (
        AdCampaign,
        AdCreative,
        AudienceSegment,
        AudienceSegmentInsight,
        ClickEvent,
        FraudEvent,
        InfrastructureMetric,
        MLPredictionLog,
        RecommendationLog,
        ShapInsight,
        User,
    )


def _parse_tags(raw) -> List[str]:
    """
    Normalise the audience_segments.tags column into a list of strings.

    Handles the two most common storage shapes without assuming a schema
    change: a native array/JSON column (already a list) or a delimited
    string column.
    """
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(tag).strip() for tag in raw if str(tag).strip()]
    if isinstance(raw, str):
        return [tag.strip() for tag in raw.split(",") if tag.strip()]
    return []


# ---------------------------------------------------------------------------
# AIInsightService
# ---------------------------------------------------------------------------

class AIInsightService:
    """
    Encapsulates all analytics queries for the AI Insight module.

    Parameters
    ----------
    db : AsyncSession
        Injected async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # 1. Overview
    # ------------------------------------------------------------------

    async def get_overview(self) -> OverviewResponse:
        """
        Compute top-level KPI metrics for the AI Insight overview panel.

        Returns
        -------
        OverviewResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)

        total_result = await db.execute(select(func.count()).select_from(MLPredictionLog))
        total_predictions: int = total_result.scalar_one() or 0

        ctr_result = await db.execute(select(func.avg(MLPredictionLog.click_probability)))
        avg_ctr_raw: float = ctr_result.scalar_one() or 0.0
        average_ctr_prediction: float = round(avg_ctr_raw * 100, 2)

        fraud_result = await db.execute(select(func.avg(MLPredictionLog.fraud_probability)))
        avg_fraud_raw: float = fraud_result.scalar_one() or 0.0
        average_fraud_probability: float = round(avg_fraud_raw * 100, 2)

        rec_result = await db.execute(select(func.avg(MLPredictionLog.recommendation_score)))
        average_recommendation_score: float = round(rec_result.scalar_one() or 0.0, 2)

        active_models_result = await db.execute(
            select(func.count(func.distinct(MLPredictionLog.model_version)))
        )
        active_models: int = active_models_result.scalar_one() or 0

        last_updated_result = await db.execute(select(func.max(MLPredictionLog.timestamp)))
        last_updated: Optional[datetime] = last_updated_result.scalar_one()

        return OverviewResponse(
            total_predictions=total_predictions,
            average_ctr_prediction=average_ctr_prediction,
            average_fraud_probability=average_fraud_probability,
            average_recommendation_score=average_recommendation_score,
            active_models=active_models,
            last_updated=last_updated or now,
        )

    # ------------------------------------------------------------------
    # 2. Model Status
    # ------------------------------------------------------------------

    async def get_model_status(self) -> ModelStatusResponse:
        """
        Return one status card per distinct model version present in the
        prediction logs.

        Status is derived as 'Active' when the model has logged a
        prediction in the last 15 minutes, otherwise 'Idle'.  Uptime is
        derived as the percentage of the last 24 hourly buckets in which
        the model produced at least one prediction.  Accuracy is derived
        by matching predictions to observed click outcomes via
        click_events on (user_id, ad_id, campaign_id); it is omitted when
        no matching click events exist.

        Returns
        -------
        ModelStatusResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        active_window = now - timedelta(minutes=15)
        day_window = now - timedelta(hours=24)

        base_result = await db.execute(
            select(
                MLPredictionLog.model_version,
                func.count().label("predictions_today"),
                func.avg(MLPredictionLog.inference_latency_ms).label("avg_latency"),
                func.max(MLPredictionLog.timestamp).label("last_prediction_time"),
            )
            .where(MLPredictionLog.timestamp >= today_start)
            .group_by(MLPredictionLog.model_version)
        )
        base_rows = base_result.all()

        if not base_rows:
            return ModelStatusResponse(models=[])

        # Uptime: distinct hourly buckets with activity in the last 24h.
        hour_bucket = func.date_trunc("hour", MLPredictionLog.timestamp)
        uptime_result = await db.execute(
            select(
                MLPredictionLog.model_version,
                func.count(func.distinct(hour_bucket)).label("active_hours"),
            )
            .where(MLPredictionLog.timestamp >= day_window)
            .group_by(MLPredictionLog.model_version)
        )
        uptime_map: Dict[str, int] = {row.model_version: row.active_hours for row in uptime_result.all()}

        # Accuracy: match predictions to click outcomes on shared keys.
        accuracy_result = await db.execute(
            select(
                MLPredictionLog.model_version,
                func.count().label("matched"),
                func.sum(
                    case(
                        (
                            (
                                (MLPredictionLog.click_probability >= 0.5)
                                & (ClickEvent.clicked == True)  # noqa: E712
                            )
                            | (
                                (MLPredictionLog.click_probability < 0.5)
                                & (ClickEvent.clicked == False)  # noqa: E712
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ).label("correct"),
            )
            .join(
                ClickEvent,
                (ClickEvent.user_id == MLPredictionLog.user_id)
                & (ClickEvent.ad_id == MLPredictionLog.ad_id)
                & (ClickEvent.campaign_id == MLPredictionLog.campaign_id),
            )
            .group_by(MLPredictionLog.model_version)
        )
        accuracy_map: Dict[str, float] = {}
        for row in accuracy_result.all():
            matched = row.matched or 0
            correct = row.correct or 0
            if matched > 0:
                accuracy_map[row.model_version] = round(correct / matched * 100, 2)

        models: List[ModelStatusItem] = []
        for row in base_rows:
            version = row.model_version
            last_prediction_time: datetime = row.last_prediction_time
            status = "Active" if last_prediction_time and last_prediction_time >= active_window else "Idle"
            active_hours = uptime_map.get(version, 0)
            uptime = round(min(active_hours, 24) / 24 * 100, 2)

            models.append(
                ModelStatusItem(
                    model_name=version,
                    model_version=version,
                    status=status,
                    predictions_today=row.predictions_today or 0,
                    average_latency=round(float(row.avg_latency or 0.0), 2),
                    uptime=uptime,
                    accuracy=accuracy_map.get(version),
                    last_prediction_time=last_prediction_time or now,
                )
            )

        return ModelStatusResponse(models=models)

    # ------------------------------------------------------------------
    # 3. Predictions
    # ------------------------------------------------------------------

    async def get_predictions(self, limit: int = 50) -> PredictionResponse:
        """
        Return the latest prediction log rows, joined against ad_campaigns
        for the campaign name.

        Parameters
        ----------
        limit : int
            Max number of rows to return.

        Returns
        -------
        PredictionResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        result = await db.execute(
            select(
                MLPredictionLog.timestamp,
                AdCampaign.campaign_name,
                MLPredictionLog.ad_id,
                MLPredictionLog.click_probability,
                MLPredictionLog.fraud_probability,
                MLPredictionLog.recommendation_score,
                MLPredictionLog.model_version,
                MLPredictionLog.inference_latency_ms,
            )
            .outerjoin(AdCampaign, AdCampaign.campaign_id == MLPredictionLog.campaign_id)
            .order_by(desc(MLPredictionLog.timestamp))
            .limit(limit)
        )
        rows = result.all()

        predictions = [
            PredictionItem(
                timestamp=row.timestamp,
                campaign_name=row.campaign_name,
                ad_id=row.ad_id,
                click_probability=float(row.click_probability or 0.0),
                fraud_probability=float(row.fraud_probability or 0.0),
                recommendation_score=float(row.recommendation_score or 0.0),
                model_version=row.model_version,
                inference_latency_ms=float(row.inference_latency_ms or 0.0),
            )
            for row in rows
        ]
        return PredictionResponse(predictions=predictions)

    # ------------------------------------------------------------------
    # 4. SHAP Insights
    # ------------------------------------------------------------------

    async def get_shap(self, campaign_id: Optional[int] = None, limit: int = 50) -> ShapResponse:
        """
        Return SHAP feature attribution rows, joined against ad_campaigns
        for the campaign name.

        Parameters
        ----------
        campaign_id : Optional[int]
            When provided, restrict results to a single campaign.
        limit : int
            Max number of rows to return.

        Returns
        -------
        ShapResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        query = (
            select(
                AdCampaign.campaign_name,
                ShapInsight.feature_name,
                ShapInsight.shap_value,
                ShapInsight.predicted_ctr,
                ShapInsight.auc_score,
                ShapInsight.created_at,
            )
            .outerjoin(AdCampaign, AdCampaign.campaign_id == ShapInsight.campaign_id)
            .order_by(desc(ShapInsight.created_at))
            .limit(limit)
        )
        if campaign_id is not None:
            query = query.where(ShapInsight.campaign_id == campaign_id)

        result = await db.execute(query)
        rows = result.all()

        features = [
            ShapFeatureItem(
                campaign_name=row.campaign_name,
                feature_name=row.feature_name,
                shap_value=float(row.shap_value or 0.0),
                predicted_ctr=round(float(row.predicted_ctr or 0.0) * 100, 2)
                if row.predicted_ctr is not None and row.predicted_ctr <= 1.0
                else float(row.predicted_ctr or 0.0),
                auc_score=float(row.auc_score or 0.0),
                created_at=row.created_at,
            )
            for row in rows
        ]
        return ShapResponse(features=features)

    # ------------------------------------------------------------------
    # 5. Recommendations
    # ------------------------------------------------------------------

    async def get_recommendations(self, limit: int = 50) -> RecommendationResponse:
        """
        Return the latest recommendation log rows, joined through
        ad_creatives to ad_campaigns for the campaign name where possible.

        Parameters
        ----------
        limit : int
            Max number of rows to return.

        Returns
        -------
        RecommendationResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        result = await db.execute(

    select(

        AdCampaign.campaign_name,

        RecommendationLog.ad_id,

        RecommendationLog.recommendation_score,

        RecommendationLog.explanation,

        RecommendationLog.timestamp,

    )

    .outerjoin(

        AdCreative,

        func.concat(
            "ad_",
            func.lpad(
                cast(AdCreative.ad_id, String),
                3,
                "0"
            )
        ) == RecommendationLog.ad_id,

    )

    .outerjoin(

        AdCampaign,

        AdCampaign.campaign_id == AdCreative.campaign_id,

    )

    .order_by(

        RecommendationLog.timestamp.desc()

    )

    .limit(limit)

)
        rows = result.all()

        recommendations = [
            RecommendationItem(
                campaign_name=row.campaign_name,
                ad_id=row.ad_id,
                recommendation_score=float(row.recommendation_score or 0.0),
                explanation=row.explanation,
                timestamp=row.timestamp,
            )
            for row in rows
        ]
        return RecommendationResponse(recommendations=recommendations)

    # ------------------------------------------------------------------
    # 6. Audience Segments
    # ------------------------------------------------------------------

    async def get_audience_segments(self, top_features_limit: int = 3) -> AudienceResponse:
        """
        Return active audience segments joined with their top contributing
        features from audience_segment_insights.

        Parameters
        ----------
        top_features_limit : int
            Max number of top contributing features to attach per segment.

        Returns
        -------
        AudienceResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        segments_result = await db.execute(
            select(AudienceSegment)
            .where(AudienceSegment.is_active == True)  # noqa: E712
            .order_by(desc(AudienceSegment.reach))
        )
        segments = segments_result.scalars().all()

        if not segments:
            return AudienceResponse(segments=[])

        segment_ids = [seg.id for seg in segments]
        insights_result = await db.execute(
            select(AudienceSegmentInsight)
            .where(AudienceSegmentInsight.segment_id.in_(segment_ids))
            .order_by(desc(AudienceSegmentInsight.contribution_value))
        )
        insight_rows = insights_result.scalars().all()

        # Group top contributing feature names per segment_id.
        features_by_segment: Dict[int, List[str]] = {}
        for insight in insight_rows:
            bucket = features_by_segment.setdefault(insight.segment_id, [])
            if len(bucket) < top_features_limit:
                bucket.append(insight.feature_name)

        items: List[AudienceInsightItem] = [
            AudienceInsightItem(
                segment_name=seg.name,
                subtitle=seg.subtitle,
                icon=seg.icon_name,
                reach=int(seg.reach or 0),
                growth_pct=round(float(seg.growth_pct or 0.0), 2),
                mobile_pct=round(float(seg.device_mobile_pct or 0.0), 2),
                desktop_pct=round(float(seg.device_desktop_pct or 0.0), 2),
                tablet_pct=round(float(seg.device_tablet_pct or 0.0), 2),
                fraud_risk=seg.fraud_risk_level,
                avg_ctr=round(float(seg.avg_ctr or 0.0), 2),
                tags=_parse_tags(seg.tags),
                top_features=features_by_segment.get(seg.id, []),
            )
            for seg in segments
        ]
        return AudienceResponse(segments=items)

    # ------------------------------------------------------------------
    # 7. Infrastructure
    # ------------------------------------------------------------------

    async def get_infrastructure(self) -> InfrastructureResponse:
        """
        Return the latest heartbeat status for every registered service.

        Returns
        -------
        InfrastructureResponse
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        latest_sub = (
            select(
                InfrastructureMetric.service_name,
                func.max(InfrastructureMetric.heartbeat_timestamp).label("latest_ts"),
            )
            .group_by(InfrastructureMetric.service_name)
            .subquery()
        )

        result = await db.execute(
            select(InfrastructureMetric)
            .join(
                latest_sub,
                (InfrastructureMetric.service_name == latest_sub.c.service_name)
                & (InfrastructureMetric.heartbeat_timestamp == latest_sub.c.latest_ts),
            )
            .order_by(InfrastructureMetric.service_name)
        )
        metrics = result.scalars().all()

        services = [
            InfrastructureItem(
                service_name=m.service_name,
                status=m.status,
                uptime=round(float(m.uptime or 0.0), 2),
                latency=round(float(m.latency_ms or 0.0), 2),
                heartbeat=m.heartbeat_timestamp,
            )
            for m in metrics
        ]
        return InfrastructureResponse(services=services)

    # ------------------------------------------------------------------
    # 8. Campaign Insight (single campaign deep-dive)
    # ------------------------------------------------------------------

    async def get_campaign_insight(self, campaign_id: int) -> Optional[CampaignInsightResponse]:
        """
        Return a consolidated AI insight view for a single campaign,
        combining spend/revenue, the latest prediction, top SHAP features,
        and the latest recommendation.

        Parameters
        ----------
        campaign_id : int

        Returns
        -------
        Optional[CampaignInsightResponse]
            None when the campaign does not exist.
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        campaign_result = await db.execute(
            select(AdCampaign).where(AdCampaign.campaign_id == campaign_id)
        )
        campaign = campaign_result.scalar_one_or_none()
        if campaign is None:
            return None

        budget = float(campaign.budget or 0.0)
        spend = float(campaign.spend or 0.0)
        revenue = float(campaign.revenue or 0.0)
        roas = round(revenue / spend, 2) if spend > 0 else 0.0

        # CTR from click_events for this campaign.
        total_clicks_result = await db.execute(
            select(func.count()).select_from(ClickEvent).where(ClickEvent.campaign_id == campaign_id)
        )
        total_clicks = total_clicks_result.scalar_one() or 0
        clicked_result = await db.execute(
            select(func.count())
            .select_from(ClickEvent)
            .where(ClickEvent.campaign_id == campaign_id)
            .where(ClickEvent.clicked == True)  # noqa: E712
        )
        clicked = clicked_result.scalar_one() or 0
        ctr = round((clicked / total_clicks * 100) if total_clicks > 0 else 0.0, 2)

        # Latest prediction for this campaign.
        prediction_result = await db.execute(
            select(MLPredictionLog)
            .where(MLPredictionLog.campaign_id == campaign_id)
            .order_by(desc(MLPredictionLog.timestamp))
            .limit(1)
        )
        prediction = prediction_result.scalar_one_or_none()

        # Top SHAP features for this campaign.
        shap_result = await db.execute(
            select(ShapInsight)
            .where(ShapInsight.campaign_id == campaign_id)
            .order_by(desc(func.abs(ShapInsight.shap_value)))
            .limit(5)
        )
        shap_rows = shap_result.scalars().all()
        top_shap_features = [
            ShapFeatureItem(
                campaign_name=campaign.campaign_name,
                feature_name=row.feature_name,
                shap_value=float(row.shap_value or 0.0),
                predicted_ctr=round(float(row.predicted_ctr or 0.0), 2),
                auc_score=float(row.auc_score or 0.0),
                created_at=row.created_at,
            )
            for row in shap_rows
        ]

        # Latest recommendation for any ad creative under this campaign.
        recommendation_result = await db.execute(
    select(
        RecommendationLog.explanation
    )
    .join(
        AdCreative,
        func.concat(
            "ad_",
            func.lpad(
                cast(AdCreative.ad_id, String),
                3,
                "0",
            ),
        ) == RecommendationLog.ad_id,
    )
    .where(
        AdCreative.campaign_id == campaign_id
    )
    .order_by(
        RecommendationLog.timestamp.desc()
    )
    .limit(1)
)
        recommendation_explanation = recommendation_result.scalar_one_or_none()

        recommendation_score_result = await db.execute(
            select(RecommendationLog.recommendation_score)
            .join(
        AdCreative,
        func.concat(
            "ad_",
            func.lpad(
                cast(AdCreative.ad_id, String),
                3,
                "0",
            ),
        ) == RecommendationLog.ad_id,
    )
            .where(AdCreative.campaign_id == campaign_id)
            .order_by(desc(RecommendationLog.timestamp))
            .limit(1)
        )
        recommendation_score = recommendation_score_result.scalar_one_or_none()

        return CampaignInsightResponse(
            campaign_name=campaign.campaign_name,
            budget=budget,
            spend=spend,
            revenue=revenue,
            ctr=ctr,
            click_probability=float(prediction.click_probability) if prediction else None,
            fraud_probability=float(prediction.fraud_probability) if prediction else None,
            recommendation_score=float(recommendation_score) if recommendation_score is not None else None,
            roas=roas,
            top_shap_features=top_shap_features,
            recommendation_explanation=recommendation_explanation,
        )

    # ------------------------------------------------------------------
    # Live update snapshot  (used by WebSocket)
    # ------------------------------------------------------------------

    async def get_live_snapshot(self) -> AIInsightLiveUpdate:
        """
        Lightweight snapshot for the AI Insight WebSocket push loop.

        Returns
        -------
        AIInsightLiveUpdate
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        total_today_result = await db.execute(
            select(func.count())
            .select_from(MLPredictionLog)
            .where(MLPredictionLog.timestamp >= today_start)
        )
        total_predictions_today: int = total_today_result.scalar_one() or 0

        ctr_result = await db.execute(select(func.avg(MLPredictionLog.click_probability)))
        average_ctr_prediction: float = round((ctr_result.scalar_one() or 0.0) * 100, 2)

        fraud_result = await db.execute(select(func.avg(MLPredictionLog.fraud_probability)))
        average_fraud_probability: float = round((fraud_result.scalar_one() or 0.0) * 100, 2)

        active_models_result = await db.execute(
            select(func.count(func.distinct(MLPredictionLog.model_version)))
        )
        active_models: int = active_models_result.scalar_one() or 0

        return AIInsightLiveUpdate(
            total_predictions_today=total_predictions_today,
            average_ctr_prediction=average_ctr_prediction,
            average_fraud_probability=average_fraud_probability,
            active_models=active_models,
            timestamp=now,
        )