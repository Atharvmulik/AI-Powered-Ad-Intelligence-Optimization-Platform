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
from collections import Counter, defaultdict
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
    PredictionShapFeatureItem,
    PredictionShapResponse,
    RecommendationItem,
    RecommendationResponse,
    ShapFeatureItem,
    ShapResponse,
    OverviewResponse,
)

logger = logging.getLogger(__name__)

_ACTIVE_WINDOW = timedelta(minutes=15)
_ACTIVITY_WINDOW = timedelta(hours=24)
_AUDIENCE_WINDOW = timedelta(days=7)
_NO_DATA_TIMESTAMP = datetime(1970, 1, 1, tzinfo=timezone.utc)

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


def _extract_interest_values(raw: Optional[str]) -> List[str]:
    """Split a user interest string into deterministic interest buckets."""
    if not raw:
        return []
    values: List[str] = []
    for chunk in str(raw).replace(";", ",").replace("|", ",").split(","):
        value = chunk.strip().lower()
        if value:
            values.append(value)
    return values


def _normalise_device(raw: Optional[str]) -> str:
    """Map a user device string to a platform-normalised device bucket."""
    if raw is None:
        return "unknown"
    value = str(raw).strip().lower()
    if value in {"mobile", "android", "iphone", "ios", "smartphone"}:
        return "mobile"
    if value in {"desktop", "windows", "mac", "linux", "laptop"}:
        return "desktop"
    if value in {"tablet", "ipad", "ipados"}:
        return "tablet"
    return "unknown"


def _bucket_fraud_risk(score: Optional[float]) -> str:
    """Map numeric fraud risk scores to the audit-friendly Low/Medium/High labels."""
    if score is None:
        return "Low"
    value = float(score)
    if value >= 0.7:
        return "High"
    if value >= 0.35:
        return "Medium"
    return "Low"


def _humanise_interest(value: str) -> str:
    """Turn an interest key into a stable user-facing title."""
    tokens = [part.strip() for part in str(value).replace("_", " ").split() if part.strip()]
    if not tokens:
        return "Audience"
    return " ".join(token.capitalize() for token in tokens)


def _interest_icon(value: str) -> str:
    """Return a material icon key for a detected interest."""
    normalised = str(value).lower()
    if "tech" in normalised or "technology" in normalised:
        return "memory"
    if "gaming" in normalised or "game" in normalised:
        return "sports_esports"
    if "sport" in normalised:
        return "fitness_center"
    if "fitness" in normalised or "health" in normalised:
        return "monitor_heart"
    if "travel" in normalised:
        return "flight"
    if "money" in normalised or "finance" in normalised:
        return "payments"
    if "fashion" in normalised:
        return "checkroom"
    return "group"


def _as_utc_datetime(value: Optional[datetime]) -> Optional[datetime]:
    """Normalize datetime values to timezone-aware UTC for comparisons."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _percentage_from_probability(value: Optional[float]) -> float:
    """Convert a model probability in [0, 1] to a 0–100 percentage scale."""
    if value is None:
        return 0.0
    probability = float(value)
    if probability < 0.0 or probability > 1.0:
        return 0.0
    return round(probability * 100.0, 2)


def _average_probability_percentage(values: List[Optional[float]]) -> float:
    """Average a list of model probabilities and return the percentage-scale value."""
    cleaned = [float(value) for value in values if value is not None and 0.0 <= float(value) <= 1.0]
    if not cleaned:
        return 0.0
    return round((sum(cleaned) / len(cleaned)) * 100.0, 2)


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

        The overview uses prediction rows from the current UTC calendar day for
        the main totals and averages, while the live model count is based on the
        last 15 minutes of activity to match the dashboard's active/live status.
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        recent_activity_start = now - _ACTIVE_WINDOW

        total_result = await db.execute(
            select(func.count())
            .select_from(MLPredictionLog)
            .where(MLPredictionLog.timestamp >= today_start)
        )
        total_predictions: int = total_result.scalar_one() or 0

        ctr_result = await db.execute(
            select(func.avg(MLPredictionLog.click_probability))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        avg_ctr_raw: float = ctr_result.scalar_one() or 0.0
        average_ctr_prediction: float = round(avg_ctr_raw * 100, 2)

        fraud_result = await db.execute(
            select(func.avg(MLPredictionLog.fraud_probability))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        avg_fraud_raw: float = fraud_result.scalar_one() or 0.0
        average_fraud_probability: float = round(avg_fraud_raw * 100, 2)

        rec_result = await db.execute(
            select(func.avg(MLPredictionLog.recommendation_score))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        average_recommendation_score: float = round(rec_result.scalar_one() or 0.0, 2)

        active_models_result = await db.execute(
            select(func.count(func.distinct(MLPredictionLog.model_version)))
            .where(MLPredictionLog.timestamp >= recent_activity_start)
        )
        active_models: int = active_models_result.scalar_one() or 0

        last_updated_result = await db.execute(
            select(func.max(MLPredictionLog.timestamp))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        last_updated: datetime = last_updated_result.scalar_one() or _NO_DATA_TIMESTAMP

        return OverviewResponse(
            total_predictions=total_predictions,
            average_ctr_prediction=average_ctr_prediction,
            average_fraud_probability=average_fraud_probability,
            average_recommendation_score=average_recommendation_score,
            active_models=active_models,
            last_updated=last_updated,
        )

    # ------------------------------------------------------------------
    # 2. Model Status
    # ------------------------------------------------------------------

    async def get_model_status(self) -> ModelStatusResponse:
        """
        Return one status card per distinct model version observed in the last
        24 hours. A model is Active only if it logged a prediction in the last
        15 minutes; otherwise it is Idle. Uptime is derived from hourly activity
        buckets in the last 24 hours; accuracy is computed only when valid
        prediction/outcome joins exist in the click event data.
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        active_window = now - _ACTIVE_WINDOW
        day_window = now - _ACTIVITY_WINDOW

        base_result = await db.execute(
            select(
                MLPredictionLog.model_version,
                func.sum(case((MLPredictionLog.timestamp >= today_start, 1), else_=0)).label("predictions_today"),
                func.avg(MLPredictionLog.inference_latency_ms).label("avg_latency"),
                func.max(MLPredictionLog.timestamp).label("last_prediction_time"),
            )
            .where(MLPredictionLog.timestamp >= day_window)
            .group_by(MLPredictionLog.model_version)
            .order_by(desc(func.max(MLPredictionLog.timestamp)))
        )
        base_rows = base_result.all()

        if not base_rows:
            return ModelStatusResponse(models=[])

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

        accuracy_result = await db.execute(
            select(
                MLPredictionLog.model_version,
                func.count().label("matched"),
                func.sum(
                    case(
                        (
                            (
                                (MLPredictionLog.click_probability >= 0.5)
                                & (ClickEvent.actual_outcome == 1)
                            )
                            | (
                                (MLPredictionLog.click_probability < 0.5)
                                & (ClickEvent.actual_outcome == 0)
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
                & (ClickEvent.campaign_id == MLPredictionLog.campaign_id)
                & (ClickEvent.timestamp >= MLPredictionLog.timestamp - timedelta(minutes=5))
                & (ClickEvent.timestamp <= MLPredictionLog.timestamp + timedelta(minutes=5)),
            )
            .where(MLPredictionLog.timestamp >= day_window)
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
            last_prediction_time: Optional[datetime] = row.last_prediction_time
            if last_prediction_time is not None:
                if last_prediction_time.tzinfo is None:
                    last_prediction_time = last_prediction_time.replace(tzinfo=timezone.utc)
                else:
                    last_prediction_time = last_prediction_time.astimezone(timezone.utc)
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
                    last_prediction_time=last_prediction_time or _NO_DATA_TIMESTAMP,
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
                MLPredictionLog.prediction_id,
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
                prediction_id=row.prediction_id,
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
            .where(ShapInsight.prediction_id.is_(None))
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

    async def get_prediction_shap(
        self,
        prediction_id: int,
    ) -> Optional[PredictionShapResponse]:
        """Return genuine SHAP rows for one prediction, or None if it does not exist."""
        from app.db.models import MLPredictionLog, ShapInsight  # noqa: PLC0415

        prediction_result = await self._db.execute(
            select(MLPredictionLog).where(MLPredictionLog.prediction_id == prediction_id)
        )
        prediction = prediction_result.scalar_one_or_none()
        if prediction is None:
            return None

        shap_result = await self._db.execute(
            select(
                ShapInsight.feature_name,
                ShapInsight.feature_value,
                ShapInsight.shap_value,
                ShapInsight.explanation_model,
                ShapInsight.created_at,
            )
            .where(ShapInsight.prediction_id == prediction_id)
            .order_by(desc(func.abs(ShapInsight.shap_value)))
        )
        features = [
            PredictionShapFeatureItem(
                feature_name=row.feature_name,
                feature_value=row.feature_value,
                shap_value=float(row.shap_value),
                explanation_model=row.explanation_model,
                created_at=row.created_at,
            )
            for row in shap_result.all()
        ]
        return PredictionShapResponse(
            prediction_id=prediction.prediction_id,
            model_version=prediction.model_version,
            timestamp=prediction.timestamp,
            features=features,
        )

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

    async def get_audience_segments(
        self,
        top_features_limit: int = 3,
        limit: Optional[int] = None,
    ) -> AudienceResponse:
        """
        Return audience segments derived from persisted synthetic user behavior.

        The synthetic pipeline generates rich user-level signals in `users` and
        transactional outcomes in `click_events` / `fraud_events`. This endpoint
        derives a deterministic, explainable segment list from those real rows
        instead of relying on static segment snapshots.
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db

        user_rows = await db.execute(
            select(User.user_id, User.interests, User.device_type)
        )
        persisted_users = user_rows.all()

        if persisted_users:
            now = datetime.now(timezone.utc)
            current_window_start = now - _AUDIENCE_WINDOW
            previous_window_start = current_window_start - _AUDIENCE_WINDOW
            current_window_start_db = current_window_start.replace(tzinfo=None)
            previous_window_start_db = previous_window_start.replace(tzinfo=None)
            now_db = now.replace(tzinfo=None)

            user_interest_lookup: Dict[str, List[str]] = {}
            for user_id, interests, device_type in persisted_users:
                normalized_interests = _extract_interest_values(interests)
                if not normalized_interests:
                    continue
                user_interest_lookup[str(user_id)] = normalized_interests

            activity_rows = await db.execute(
                select(ClickEvent.user_id, ClickEvent.timestamp)
                .where(ClickEvent.timestamp >= previous_window_start_db)
                .where(ClickEvent.timestamp <= now_db)
            )

            interest_buckets: Dict[str, Dict[str, object]] = {}
            for user_id, event_timestamp in activity_rows.all():
                user_key = str(user_id)
                normalized_interests = user_interest_lookup.get(user_key, [])
                if not normalized_interests:
                    continue
                event_dt = _as_utc_datetime(event_timestamp)
                if event_dt is None:
                    continue
                for interest in normalized_interests:
                    bucket = interest_buckets.setdefault(
                        interest,
                        {
                            "users": set(),
                            "current_users": set(),
                            "previous_users": set(),
                            "current_devices": Counter(),
                        },
                    )
                    bucket["users"].add(user_key)
                    if event_dt >= current_window_start:
                        bucket["current_users"].add(user_key)
                    elif event_dt >= previous_window_start:
                        bucket["previous_users"].add(user_key)

            if interest_buckets:
                segment_items: List[AudienceInsightItem] = []
                for interest, bucket in sorted(interest_buckets.items(), key=lambda item: (-len(item[1]["current_users"]), item[0])):
                    current_user_ids = sorted(bucket["current_users"])
                    previous_user_ids = sorted(bucket["previous_users"])
                    current_reach = len(current_user_ids)
                    previous_reach = len(previous_user_ids)

                    if previous_reach > 0:
                        growth_pct = ((current_reach - previous_reach) / previous_reach) * 100.0
                    else:
                        growth_pct = 0.0

                    device_counts = Counter()
                    for user_id, interests, device_type in persisted_users:
                        user_key = str(user_id)
                        if user_key not in current_user_ids:
                            continue
                        normalized_device = _normalise_device(device_type)
                        if normalized_device != "unknown":
                            device_counts[normalized_device] += 1

                    total_devices = sum(device_counts.values())
                    mobile_pct = round((device_counts.get("mobile", 0) / total_devices) * 100.0, 2) if total_devices else 0.0
                    desktop_pct = round((device_counts.get("desktop", 0) / total_devices) * 100.0, 2) if total_devices else 0.0
                    tablet_pct = round((device_counts.get("tablet", 0) / total_devices) * 100.0, 2) if total_devices else 0.0

                    fraud_rows = await db.execute(
                        select(FraudEvent.user_id, FraudEvent.fraud_score)
                        .where(FraudEvent.user_id.in_(current_user_ids))
                        .where(FraudEvent.timestamp >= current_window_start_db)
                    )
                    fraud_scores: List[float] = []
                    for user_id, score in fraud_rows.all():
                        if score is None:
                            continue
                        fraud_scores.append(float(score))
                    avg_fraud_score = sum(fraud_scores) / len(fraud_scores) if fraud_scores else 0.0
                    fraud_risk = _bucket_fraud_risk(avg_fraud_score)

                    ctr_rows = await db.execute(
                        select(MLPredictionLog.user_id, MLPredictionLog.click_probability)
                        .where(MLPredictionLog.user_id.in_(current_user_ids))
                        .where(MLPredictionLog.timestamp >= current_window_start_db)
                    )
                    prediction_probabilities: List[Optional[float]] = []
                    for user_id, click_probability in ctr_rows.all():
                        prediction_probabilities.append(float(click_probability) if click_probability is not None else None)
                    avg_ctr = _average_probability_percentage(prediction_probabilities)


                    dominant_device = "mobile" if mobile_pct >= max(desktop_pct, tablet_pct) else "desktop" if desktop_pct >= tablet_pct else "tablet"
                    tags = [
                        f"{_humanise_interest(interest)} audience",
                    ]
                    if mobile_pct >= 50:
                        tags.append("Mobile-first")
                    elif desktop_pct >= 50:
                        tags.append("Desktop-heavy")
                    if tablet_pct > 0:
                        tags.append("Cross-device")
                    if fraud_risk != "Low":
                        tags.append("Fraud watch")
                    if avg_ctr >= 10:
                        tags.append("High CTR")

                    top_features = [f"user_interest={interest}"]
                    if dominant_device:
                        top_features.append(f"device={dominant_device}")
                    if len(top_features) < top_features_limit:
                        top_features.extend([
                            f"reach={current_reach}",
                            f"active_window=7d",
                        ][: max(0, top_features_limit - len(top_features))])

                    segment_items.append(
                        AudienceInsightItem(
                            segment_name=f"{_humanise_interest(interest)} Audience",
                            subtitle=f"Users interested in {_humanise_interest(interest).lower()}",
                            icon=_interest_icon(interest),
                            reach=current_reach,
                            growth_pct=round(growth_pct, 2),
                            mobile_pct=round(mobile_pct, 2),
                            desktop_pct=round(desktop_pct, 2),
                            tablet_pct=round(tablet_pct, 2),
                            fraud_risk=fraud_risk,
                            avg_ctr=round(avg_ctr, 2),
                            tags=tags[:4],
                            top_features=top_features[:top_features_limit],
                        )
                    )

                segment_items.sort(key=lambda item: (-item.reach, item.segment_name.lower()))
                if limit is not None:
                    segment_items = segment_items[:limit]
                return AudienceResponse(segments=segment_items)

        static_query = (
            select(AudienceSegment)
            .where(AudienceSegment.is_active == True)  # noqa: E712
            .order_by(desc(AudienceSegment.reach))
        )
        if limit is not None:
            static_query = static_query.limit(limit)

        segments_result = await db.execute(static_query)
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

    async def get_infrastructure(self, limit: Optional[int] = None) -> InfrastructureResponse:
        """
        Return the latest heartbeat status for every registered service.

        Parameters
        ----------
        limit : Optional[int]
            Optional max number of infrastructure services to return.

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

        query = (
            select(InfrastructureMetric)
            .join(
                latest_sub,
                (InfrastructureMetric.service_name == latest_sub.c.service_name)
                & (InfrastructureMetric.heartbeat_timestamp == latest_sub.c.latest_ts),
            )
            .order_by(InfrastructureMetric.service_name)
        )
        if limit is not None:
            query = query.limit(limit)

        result = await db.execute(query)
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
            .where(ShapInsight.prediction_id.is_(None))
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

        The live feed mirrors the overview semantics for the current UTC day while
        the active-model count reflects the last 15 minutes of prediction activity.
        """
        (
            AdCampaign, AdCreative, AudienceSegment, AudienceSegmentInsight,
            ClickEvent, FraudEvent, InfrastructureMetric, MLPredictionLog,
            RecommendationLog, ShapInsight, User,
        ) = _models()
        db = self._db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        recent_activity_start = now - _ACTIVE_WINDOW

        total_today_result = await db.execute(
            select(func.count())
            .select_from(MLPredictionLog)
            .where(MLPredictionLog.timestamp >= today_start)
        )
        total_predictions_today: int = total_today_result.scalar_one() or 0

        ctr_result = await db.execute(
            select(func.avg(MLPredictionLog.click_probability))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        average_ctr_prediction: float = round((ctr_result.scalar_one() or 0.0) * 100, 2)

        fraud_result = await db.execute(
            select(func.avg(MLPredictionLog.fraud_probability))
            .where(MLPredictionLog.timestamp >= today_start)
        )
        average_fraud_probability: float = round((fraud_result.scalar_one() or 0.0) * 100, 2)

        active_models_result = await db.execute(
            select(func.count(func.distinct(MLPredictionLog.model_version)))
            .where(MLPredictionLog.timestamp >= recent_activity_start)
        )
        active_models: int = active_models_result.scalar_one() or 0

        return AIInsightLiveUpdate(
            total_predictions_today=total_predictions_today,
            average_ctr_prediction=average_ctr_prediction,
            average_fraud_probability=average_fraud_probability,
            active_models=active_models,
            timestamp=now,
        )